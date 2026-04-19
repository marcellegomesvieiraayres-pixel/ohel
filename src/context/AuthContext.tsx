import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

type ProfileType = 'personal' | 'institutional' | null;

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  validateInviteCode: (code: string) => Promise<boolean>;
  linkUserToInstitution: (userId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileType, setProfileType] = useState<ProfileType>(() => {
    return localStorage.getItem('userType') as ProfileType;
  });

  const updateProfileType = (type: ProfileType) => {
    setProfileType(type);
    if (type) {
      localStorage.setItem('userType', type);
    } else {
      localStorage.removeItem('userType');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!isMounted) return;
          
          if (currentUser) {
            try {
              const userDocRef = doc(db, 'users', currentUser.uid);
              
              // Use onSnapshot for real-time user data
              const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  setUserData(data);
                  
                  if (data?.institutionId) {
                    updateProfileType('institutional');
                  }
                } else {
                  // Handle doc creation logic if not exists
                  const handleCreation = async () => {
                    const pendingType = localStorage.getItem('pending_profile_type') as ProfileType;
                    const pendingInvite = localStorage.getItem('pending_invite_code');

                    await setDoc(userDocRef, {
                      id: currentUser.uid,
                      name: currentUser.displayName || 'Usuário',
                      email: currentUser.email,
                      role: 'MEMBER',
                      activeModules: ['matrix', 'focus'],
                      createdAt: serverTimestamp()
                    });
                    
                    if (pendingInvite && pendingType === 'institutional') {
                      await linkUserToInstitution(currentUser.uid, pendingInvite);
                    }

                    if (pendingType) {
                      updateProfileType(pendingType);
                    }
                    
                    localStorage.removeItem('pending_profile_type');
                    localStorage.removeItem('pending_invite_code');
                  };
                  handleCreation();
                }
              }, (error) => {
                console.error('Error in user doc snapshot:', error);
              });

              setUser(currentUser);
              // Store unsubDoc in a ref if needed, but here it's inside the effect
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          } else {
            setUser(null);
            setUserData(null);
            updateProfileType(null);
          }
          
          if (isMounted) setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) setLoading(false);
      }
    };

    const authUnsubscribePromise = initializeAuth();

    return () => {
      isMounted = false;
      authUnsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Store profile type if it's set before login
      if (profileType) {
        localStorage.setItem('pending_profile_type', profileType);
      }
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.error('O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('O login foi cancelado.');
      } else {
        console.error('Google login error:', error);
        toast.error('Erro ao entrar com Google: ' + error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const validateInviteCode = async (code: string): Promise<boolean> => {
    try {
      if (code === 'OHEL-2026') return true;
      
      const q = query(
        collection(db, 'institutions'), 
        where('inviteCode', '==', code)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'institutions');
      return false;
    }
  };

  const linkUserToInstitution = async (userId: string, code: string) => {
    try {
      let instId = 'inst-1';
      if (code !== 'OHEL-2026') {
        const q = query(collection(db, 'institutions'), where('inviteCode', '==', code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error('Instituição não encontrada');
        instId = snapshot.docs[0].id;
      }
      const batch = writeBatch(db);
      const userName = auth.currentUser?.displayName || 'Usuário';
      batch.update(doc(db, 'users', userId), { 
        institutionId: instId, 
        role: 'MEMBER',
        profileType: 'INSTITUTIONAL'
      });
      
      // If it's a dynamic code (not the default), clear it from the institution to make it one-time use
      if (code !== 'OHEL-2026') {
        batch.update(doc(db, 'institutions', instId), { inviteCode: '' });
      }

      batch.set(doc(db, 'institutions', instId, 'members', userId), {
        userId,
        name: userName,
        inviteCode: code,
        role: 'MEMBER',
        joinedAt: serverTimestamp()
      });
      batch.set(doc(db, 'subscriptions', userId), {
        userId,
        planType: 'BASIC',
        status: 'ACTIVE',
        startDate: serverTimestamp()
      }, { merge: true });
      await batch.commit();
      toast.success('Vinculado com sucesso!');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      profileType, 
      setProfileType: updateProfileType, 
      loginWithGoogle, 
      logout,
      validateInviteCode,
      linkUserToInstitution
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
