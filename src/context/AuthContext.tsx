import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, writeBatch, onSnapshot, increment } from 'firebase/firestore';
import { toast } from 'sonner';

type ProfileType = 'personal' | 'institutional' | null;

export type ViewMode = 'PERSONAL' | 'INSTITUTION_OWNER' | 'INSTITUTION_MEMBER' | null;

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  validateInviteCode: (code: string) => Promise<boolean>;
  linkUserToInstitution: (userId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MARCELLE_EMAIL = 'marcelle.gomesvieira.ayres@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return localStorage.getItem('viewMode') as ViewMode || null;
  });
  const [profileType, setProfileType] = useState<ProfileType>(() => {
    return localStorage.getItem('userType') as ProfileType;
  });

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode) {
      localStorage.setItem('viewMode', mode);
      // Automatically sync profileType when switching viewMode
      if (mode === 'PERSONAL') {
        updateProfileType('personal');
      } else {
        updateProfileType('institutional');
      }
    } else {
      localStorage.removeItem('viewMode');
    }
  };

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
                  
                  // Security Enforcement: Ensure Marcelle is always Platform Admin
                  if (currentUser.email === MARCELLE_EMAIL && !data.isPlatformAdmin) {
                    updateDoc(userDocRef, { isPlatformAdmin: true }).catch(console.error);
                  }

                  setUserData(data);
                  
                  if (data?.institutionId) {
                    updateProfileType('institutional');
                  }
                } else {
                    // Handle doc creation logic if not exists
                  const handleCreation = async () => {
                    const pendingType = localStorage.getItem('pending_profile_type') as ProfileType;
                    const pendingInvite = localStorage.getItem('pending_invite_code');

                    const newUserType: 'personal' | 'institution_owner' | 'institution_member' = 
                      pendingType === 'institutional' ? 'institution_member' : 'personal';

                    await setDoc(userDocRef, {
                      id: currentUser.uid,
                      name: currentUser.displayName || 'Usuário',
                      email: currentUser.email,
                      role: 'MEMBER',
                      type: newUserType,
                      isPlatformAdmin: currentUser.email === MARCELLE_EMAIL,
                      activeModules: ['matrix', 'focus', 'personal', 'financial', 'family', 'professional', 'spiritual'],
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

      // 1. Update User Profile
      batch.update(doc(db, 'users', userId), { 
        institutionId: instId, 
        role: 'MEMBER',
        profileType: 'INSTITUTIONAL'
      });
      
      // 2. Update Institution (Increment membersCount and clear one-time code if needed)
      batch.update(doc(db, 'institutions', instId), { 
        inviteCode: (code !== 'OHEL-2026') ? '' : code,
        membersCount: increment(1)
      });

      // 3. Add to Members Subcollection
      batch.set(doc(db, 'institutions', instId, 'members', userId), {
        userId,
        name: userName,
        inviteCode: code,
        role: 'MEMBER',
        joinedAt: serverTimestamp()
      });

      // 4. Set Initial Subscription for Member
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
      viewMode,
      setViewMode: updateViewMode,
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
