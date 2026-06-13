import React, { useState, createContext, ReactNode, useCallback } from 'react';

interface LoginUserType {
    userIdx?: Number,
    userNum?: Number,
    userDB?: string,
    userId?: string,
    userName?: string,
}

interface LoginStatusContextType {
    userLang: string;
    isLogin: boolean;
    setLoginStatus: {
        login: () => void;
        logout: () => void;
    };
    setLang: (lang: string) => void;
    setUser: (user: LoginUserType) => void;
    setLoginUser: (user: LoginUserType) => void;
    loginUser: LoginUserType;
}

// Initial context value
const initialLoginStatusContext: LoginStatusContextType = {
    userLang: 'en',
    isLogin: false,
    setLoginStatus: {
        login: () => {},
        logout: () => {},
    },
    setLang: () => {},
    setUser: () => {},
    setLoginUser: () => {},
    loginUser: {
        userIdx: undefined,
        userNum: undefined,
        userDB: undefined,
        userId: undefined,
        userName: undefined,
    },
};

// Create context with initial value
const LoginStatusContext = createContext<LoginStatusContextType>(initialLoginStatusContext);

const _clearStorage = async () => {
    console.log('clear LocalStorage...........');
    localStorage.removeItem('userDB');
    localStorage.removeItem('userId');
    localStorage.removeItem('userIdx');
    localStorage.removeItem('userNum');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userSendKey');
};

// Provider component
const LoginStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLogin, setIsLogin] = useState<boolean>(false);
    const [userLang, setLang] = useState<string>('en');
    const [loginUser, setLoginUser] = useState<LoginUserType>({});

    const setLoginStatus = {
        login: () => {
            setIsLogin(true);
        },
        logout: () => {
            console.log('logout..............');
            _clearStorage();
            setIsLogin(false);
            setLoginUser({});
        },
    };

    const handleSetLang = useCallback((lang: string) => {
        setLang(lang);
    }, []);

    const handleSetUser = useCallback((user: LoginUserType) => {
        setLoginUser(user);
    }, []);

    const value = {
        isLogin,
        userLang,
        setLoginStatus,
        setLang: handleSetLang,
        setUser: handleSetUser,
        setLoginUser: handleSetUser,
        loginUser,
    };

    return <LoginStatusContext.Provider value={value}>{children}</LoginStatusContext.Provider>;
};

export { LoginStatusContext, LoginStatusProvider };
