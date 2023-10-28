import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useAsyncStorage(key: any) {
    const [storageValue, setStorageValue] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const value = await AsyncStorage.getItem(key);
            setStorageValue(value);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateData = async (newValue: any) => {
        try {
            if (newValue === null) {
                await AsyncStorage.removeItem(key);
            } else {
                await AsyncStorage.setItem(key, newValue);
            }
            loadData(); // Перезагрузка данных после их изменения
        } catch (error) {
            console.error(error);
        }
    };

    return [storageValue, updateData];
}


export default useAsyncStorage;
