import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from "@react-navigation/core";
import {useGroup} from "../components/GroupContext";

function DefaultScheduleSet() {
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);

    const storeGroupName = async (value: any) => {
        try {
            await AsyncStorage.setItem('@group_name', value);
        } catch (e) {
            console.error('Error saving group name:', e);
        }
    };

    useEffect(() => {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100); // устанавливаем задержку в 100 мс
         return () => clearTimeout(timer);
    }, []);

    const navigation = useNavigation();
    const { setGroupNameContext } = useGroup();

    const handleSubmit = async () => {
        setLoading(true); // начинаем загрузку
        setError(null); // сбрасываем ошибку

        try {
            const response = await fetch(`https://api.geliusihe.ru/check?group=${groupName}`);
            if (response.ok) {
                await AsyncStorage.setItem('@group_name', groupName);
                console.log(`formattedTitle: ${groupName}`)
                setGroupNameContext(groupName);
                storeGroupName(groupName);
                console.log(`Success ${groupName}`)
                setError(null);
                navigation.navigate('Schedule');
            } else {
                // Если группа не найдена
                throw new Error(`Группа ${groupName} не найдена`);
            }
        } catch (error) {
            // Обработка ошибок запроса или логики
            console.error(error);
            setError('На сервере нет расписания этой группы.');
        } finally {
            setLoading(false); // останавливаем загрузку в любом случае
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.text}>Давайте установим расписание по умолчанию</Text>
            <Text style={styles.subtext}>Чтобы продолжить, уточните, какое расписание должно показываться по умолчанию при входе в приложение</Text>
            {error && <Text style={{color: 'red', marginBottom: 20}}>{error}</Text>}

            <TextInput
                ref={inputRef}
                placeholder="Название группы"
                style={styles.input}
                onChangeText={(text) => setGroupName(text)}
                value={groupName}
            />
            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                    <Text style={styles.textStyle}>Установить</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    input: {
        marginBottom: -10,
        marginTop: -10,
        paddingLeft: 15,
        borderWidth: 0.3, // Толщина черной полоски
        borderRadius: 20,
        height: 55,
        borderColor: 'gray',
        width: '70%',
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 22,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerBar: {
        backgroundColor: '#F8F8F8',
        height: 60,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 0.02, // Толщина черной полоски
        borderBottomColor: 'black',
    },
    headerText: {
        fontSize: 25,
        fontWeight: "bold",
        textAlign: 'center',
    },
    instructionText: {
        color: "gray",
        fontSize: 16,
        marginTop: 15,
        marginBottom: 20,
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: '#2196F3',
        borderRadius: 20,
        height: 50,
        width: '70%',
        padding: 10,
        marginTop: 40,
        justifyContent: 'center',
        alignSelf: 'center', // выравнивание по центру горизонтали
    },
    wrapper: {},
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    image: {
        width: 140,
        height: 140,
        marginBottom: 50,
    },
    text: {
        width: 350,
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 25,
    },
    subtext: {
        width: 350,
        fontSize: 16,
        color: 'grey',
        textAlign: 'center',
        marginBottom: 50,
    },
    paginationStyle: {
        bottom: 50,
    },
    button: {
        width: '70%',
        height: 50,
        backgroundColor: '#2196F3',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

    export default DefaultScheduleSet;
