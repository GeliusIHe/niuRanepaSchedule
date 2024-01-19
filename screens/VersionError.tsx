import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';


const VersionError = () => {
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const appVersion = 'release-1.0.0-122823';

    useEffect(() => {
        const fetchComment = async () => {
            try {
                const response = await axios.get(`https://api.geliusihe.ru/getData/${appVersion}`, { timeout: 3000 });
                if (response.data && response.data.comment) {
                    setComment(response.data.comment);
                } else {
                    // Если комментарий пустой, устанавливаем сообщение об ошибке
                    setComment('Произошла множественная ошибка DRM валидации. Проверьте подключение интернету.');
                }
            } catch (error) {
                console.error('Ошибка при запросе:', error);
                setComment(`Произошла ошибка при запросе данных ${error}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchComment();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{comment}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default VersionError;
