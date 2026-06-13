import React, { useState, createContext, ReactNode, useEffect } from 'react';

interface VirtualDriveStatusContextType {
    isVirtualDriveActive: boolean;
    virtualDrive: {
        start: () => void;
        stop: () => void;
    };
}

// Initial context value
const initialVirtualDriveStatusContext: VirtualDriveStatusContextType = {
    isVirtualDriveActive: false,
    virtualDrive: {
        start: () => {},
        stop: () => {}
    }
};

// Create context with initial value
const VirtualDriveStatusContext = createContext<VirtualDriveStatusContextType>(initialVirtualDriveStatusContext);

// Provider component
const VirtualDriveStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isVirtualDriveActive, setIsVirtualDriveActive] = useState<boolean>(false);

    const virtualDrive = {
        start: () => {
            setIsVirtualDriveActive(true);
        },
        stop: () => {
            setIsVirtualDriveActive(false);
        }
    };

    const value = { isVirtualDriveActive, virtualDrive };

    return <VirtualDriveStatusContext.Provider value={value}>{children}</VirtualDriveStatusContext.Provider>;
};

export { VirtualDriveStatusContext, VirtualDriveStatusProvider };