'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    isConfigured: boolean;
    demoMode: boolean;
    enableDemoMode: (role: 'admin' | 'parceiro') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setError(null);

            if (firebaseUser) {
                // SUPER BYPASS: Se for o dono, libera acesso Admin imediatamente para não travar
                if (firebaseUser.email === 'edsonschueroff@gmail.com') {
                    setProfile({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: 'Edson (Admin)',
                        role: 'admin',
                        createdAt: new Date(),
                    });
                    setLoading(false);
                }

                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setProfile({
                            uid: firebaseUser.uid,
                            email: data.email,
                            name: data.name,
                            role: data.role,
                            partnerId: data.partnerId,
                            createdAt: data.createdAt?.toDate?.() || new Date(),
                        });
                    } else {
                        // AUTO-CREATE PROFILE: If user is authenticated but has no profile, create one as admin (first setup)
                        const newProfile = {
                            email: firebaseUser.email || '',
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Administrador',
                            role: firebaseUser.email === 'edsonschueroff@gmail.com' ? 'admin' : 'parceiro',
                            createdAt: serverTimestamp(),
                        };

                        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);

                        setProfile({
                            uid: firebaseUser.uid,
                            email: newProfile.email,
                            name: newProfile.name,
                            role: (firebaseUser.email === 'edsonschueroff@gmail.com' ? 'admin' : 'parceiro') as any,
                            createdAt: new Date(),
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar perfil:', error);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        }, (err) => {
            console.error('Erro Auth:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!isFirebaseConfigured) {
            throw new Error('Firebase não configurado. Use o modo demo.');
        }
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signOut = async () => {
        if (demoMode) {
            setProfile(null);
            setDemoMode(false);
            return;
        }
        await firebaseSignOut(auth);
        setProfile(null);
    };

    const enableDemoMode = (role: 'admin' | 'parceiro') => {
        setDemoMode(true);
        setProfile({
            uid: 'demo-user',
            email: role === 'admin' ? 'admin@equipanet.com' : 'parceiro@demo.com',
            name: role === 'admin' ? 'Administrador' : 'Empresa Demo',
            role: role,
            partnerId: role === 'parceiro' ? 'demo-partner-id' : undefined,
            createdAt: new Date(),
        });
    };

    const isAdmin = profile?.role === 'admin' || user?.email === 'edsonschueroff@gmail.com';

    return (
        <AuthContext.Provider value={{
            user, profile, loading, error, signIn, signOut, isAdmin,
            isConfigured: isFirebaseConfigured, demoMode, enableDemoMode,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
