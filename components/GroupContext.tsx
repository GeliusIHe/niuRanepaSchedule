import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GroupContextProps {
    groupNameContext: string | null;
    setGroupNameContext: (value: string | null) => void;
}

// Указание defaultValue
const defaultValue: GroupContextProps = {
    groupNameContext: null,
    setGroupNameContext: () => {},
};

// Создание контекста с defaultValue
export const GroupContext = createContext<GroupContextProps>(defaultValue);

interface GroupProviderProps {
    children: ReactNode;
}

// Добавление типов и исправление ошибки TS7031
export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
    const [groupNameContext, setGroupNameContext] = useState<string | null>(null);

    return (
        <GroupContext.Provider value={{ groupNameContext, setGroupNameContext }}>
            {children}
        </GroupContext.Provider>
    );
};

// Хук для упрощения доступа к контексту
export const useGroup = () => {
    return useContext(GroupContext);
};
