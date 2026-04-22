import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { StreamClient } from '@stream-io/node-sdk';

dotenv.config();

// Initialize Stream Client
const streamApiKey = process.env.STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;
const streamClient = streamApiKey && streamApiSecret 
  ? new StreamClient(streamApiKey, streamApiSecret) 
  : null;

// Initialize Firebase Admin with smarter credential detection
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized with service account from ENV.');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin initialized with default credentials.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

const db = admin.firestore();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000; // Mandatory port for AIS environment and proxy consistency

  // Basic Security & Logging
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite + Maps to work correctly in dev
  }));
  app.use(morgan('dev'));
  
  // Trust proxy for correct IP behind Render/Cloud Run
  app.set('trust proxy', 1);

  // Expanded CORS configuration
  const allowedOrigins = [
    'https://app.ohel.app',
    'https://ohel-api.onrender.com', // Self
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || 
          allowedOrigins.includes(origin) || 
          origin.includes('.run.app') || 
          origin.includes('.onrender.com') ||
          process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
  }));

  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  // Webhook endpoint (Raw body needed)
  app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const eventId = event.id;

        if (userId) {
          const eventRef = db.collection('processed_events').doc(eventId);
          const eventDoc = await eventRef.get();
          
          if (!eventDoc.exists) {
            const batch = db.batch();
            batch.update(db.collection('users').doc(userId), {
              planType: 'PRO',
              status: 'ACTIVE',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            batch.set(db.collection('subscriptions').doc(userId), {
              userId,
              planType: 'PRO',
              status: 'ACTIVE',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            batch.set(eventRef, {
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              type: event.type
            });

            await batch.commit();
            console.log(`User ${userId} upgraded to PRO.`);
          }
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Regular JSON parsing for other routes
  app.use(express.json());

  // --- API ENDPOINTS ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      stripe: !!stripe,
      firebase: !!admin.apps.length,
      stream: !!streamClient
    });
  });

  // Stream Token Generation
  app.post('/api/stream-token', async (req, res) => {
    if (!streamClient) {
      return res.status(500).json({ error: 'Stream not configured' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      // Validate that the user exists in Firebase to prevent token harvesting
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Expire in 1 hour
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const issuedAt = Math.floor(Date.now() / 1000) - 60;
      
      const token = streamClient.generateUserToken({ 
        user_id: userId,
        validity_in_seconds: 3600
      });

      res.json({ token, apiKey: streamApiKey });
    } catch (error: any) {
      console.error('Error generating Stream token:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Validate Invitation Code (New)
  app.post('/api/invite/validate', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    try {
      const q = db.collection('institutions').where('inviteCode', '==', code.toUpperCase());
      const snapshot = await q.get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Código de convite inválido ou expirado.' });
      }

      const instDoc = snapshot.docs[0];
      res.json({ 
        id: instDoc.id, 
        name: instDoc.data().name,
        logo: instDoc.data().logo 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Subscription Status
  app.get('/api/user-subscription/:userId', async (req, res) => {
    try {
      const doc = await db.collection('subscriptions').doc(req.params.userId).get();
      if (!doc.exists) return res.json({ planType: 'BASIC', status: 'INACTIVE' });
      res.json(doc.data());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { userId, email } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        client_reference_id: userId,
        line_items: [{
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
        allow_promotion_codes: true,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Customer Portal
  app.post('/api/create-portal-session', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { customerId } = req.body;

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: req.headers.origin,
      });
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- STATIC FILES / VITE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OHEL Backend running on http://localhost:${PORT}`);
  });
}

startServer();
