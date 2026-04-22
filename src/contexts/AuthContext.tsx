'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    const [loading, setLoading] = useState(isFirebaseConfigured);
    const [error, setError] = useState<string | null>(null);
    const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            return;
        }

        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser) => {
                setUser(firebaseUser);
                setError(null);

                if (!firebaseUser) {
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                    if (!userDoc.exists()) {
                        setProfile(null);
                        setError(
                            'Seu usuário autenticado não possui perfil cadastrado. Solicite liberação ao administrador.'
                        );
                        setLoading(false);
                        return;
                    }

                    const data = userDoc.data();
                    setProfile({
                        uid: firebaseUser.uid,
                        email: data.email,
                        name: data.name,
                        role: data.role,
                        partnerId: data.partnerId,
                        createdAt: data.createdAt?.toDate?.() || new Date(),
                    });
                } catch (loadError) {
                    console.error('Erro ao carregar perfil:', loadError);
                    setProfile(null);
                    setError('Não foi possível carregar seu perfil.');
                }

                setLoading(false);
            },
            (authError) => {
                console.error('Erro Auth:', authError);
                setError(authError.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!isFirebaseConfigured) {
            throw new Error('Firebase não configurado. Use o modo demo.');
        }

        setDemoMode(false);
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signOut = async () => {
        if (demoMode) {
            setUser(null);
            setProfile(null);
            setDemoMode(false);
            return;
        }

        await firebaseSignOut(auth);
        setProfile(null);
    };

    const enableDemoMode = (role: 'admin' | 'parceiro') => {
        setUser(null);
        setError(null);
        setLoading(false);
        setDemoMode(true);
        setProfile({
            uid: 'demo-user',
            email: role === 'admin' ? 'admin@equipanet.com' : 'parceiro@demo.com',
            name: role === 'admin' ? 'Administrador' : 'Empresa Demo',
            role,
            partnerId: role === 'parceiro' ? 'demo-partner-id' : undefined,
            createdAt: new Date(),
        });
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                error,
                signIn,
                signOut,
                isAdmin,
                isConfigured: isFirebaseConfigured,
                demoMode,
                enableDemoMode,
            }}
        >
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
