import React, { useState, createContext, ReactNode} from 'react';


const SyncStatusContext = createContext<{isSyncActive:boolean, setIsSyncActive:any, sync:{start:any, stop:any}}>({
    isSyncActive: false,
    setIsSyncActive: () => {},
    sync: {
        start: () => {},
        stop: () => {}
    }
});

// Provider component
const SyncStatusProvider = ({ children }:{children:any}) => {
    const [isSyncActive, setIsSyncActive] = useState<boolean>(false);

    const sync = {
        start: () => {
            setIsSyncActive(true);
        },
        stop: () => {
            setIsSyncActive(false);
        }
    };

    const value = { isSyncActive, setIsSyncActive, sync };
    
    return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
};

export { SyncStatusContext, SyncStatusProvider };