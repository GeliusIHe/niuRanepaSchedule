import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GroupIdContextProps {
    groupId: string | null;
    setGroupId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const GroupIdContext = createContext<GroupIdContextProps | null>(null);

interface GroupIdProviderProps {
    children: ReactNode;
}

export const useGroupId = () => {
    const context = useContext(GroupIdContext);
    if (!context) {
        throw new Error('useGroupId must be used within a GroupIdProvider');
    }
    return context;
};

export const GroupIdProvider: React.FC<GroupIdProviderProps> = ({ children }) => {
    const [groupId, setGroupId] = useState<string | null>(null);

    return (
        <GroupIdContext.Provider value={{ groupId, setGroupId }}>
            {children}
        </GroupIdContext.Provider>
    );
};
