import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StartScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Привет! Это новое    приложение РАНХИГС</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    text: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginHorizontal: 20, // для возможного переноса текста на новые строки, если текст окажется длинным
    },
});

export default StartScreen;
