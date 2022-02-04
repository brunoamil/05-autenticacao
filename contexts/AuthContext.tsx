import { createContext, ReactNode, useEffect, useState } from 'react';
import { parseCookies, setCookie, destroyCookie } from 'nookies';
import Router from 'next/router';
import { api } from '../services/apiClient';


type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    isAuthenticated: boolean;
    user: User;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);


export function signOut(){
    destroyCookie(undefined, 'nextauth.refreshToken');
    destroyCookie(undefined, 'nextauth.refreshToken');
    Router.push('/');
}
export function AuthProvider({  children }: AuthProviderProps){
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        const {'nextauth.token': token } = parseCookies();

        if(token){
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;

                setUser({
                    email,
                    permissions,
                    roles
                })
            }).catch(() => {
                signOut();
            })
        }
    }, []);

    console.log('USERS SET USER', user)

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            })

            const { token, refreshToken, permissions, roles } = response.data;
            //sessionStorage = ele só fica disponivel durante a sessao, se mudar a pagina ele some
            //localStorage = ele dura, abre e fehca aba e tal -- nao serve para serve side pq nao existe no servidor
            //cookies - armazenr informacoes no broswer, escolhe quais requisicoes - pode ser no sserviodor ou no browser.

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 20,
                path: '/'
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 20,
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            Router.push('/dashboard');
        } catch(err){
            alert(err);
        }
    }

    return (
        <AuthContext.Provider value={{signIn, isAuthenticated, user}}>
            {children}
        </AuthContext.Provider>
    )
}