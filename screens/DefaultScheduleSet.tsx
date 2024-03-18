import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Keyboard} from 'react-native';
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

    const handleSubmit = () => {
        setLoading(true); // начинаем загрузку
        setError(null); // сбрасываем ошибку

        const timeoutId = setTimeout(() => {
            setLoading(false); // останавливаем загрузку
            setError('Сервер не отвечает. Проверьте подключение к интернету'); // устанавливаем ошибку таймаута
        }, 5000); // устанавливаем таймаут 5 секунд

        fetch(`http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?name=${groupName}`)
            .then(response => response.json())
            .then(async data => {
                clearTimeout(timeoutId);

                const results = Array.isArray(data.GetNameUidForRaspResult.ItemRaspUID)
                    ? data.GetNameUidForRaspResult.ItemRaspUID
                    : [data.GetNameUidForRaspResult.ItemRaspUID];

                const prepResults = results.filter((item: { Type: string; }) => item.Type === "Prep");
                const groupResult = results.find((item: { Type: string; }) => item.Type === "Group");

                if (prepResults.length > 1) {
                    setError('Найдено слишком много преподавателей. Уточните запрос.');
                    setLoading(false);
                } else if (prepResults.length === 1 || groupResult) {
                    const result = prepResults.length ? prepResults[0] : groupResult;
                    const formattedTitle = result.Title.replace(/ {2,}/g, ' '); // Убираем лишние пробелы
                    const value = AsyncStorage.getItem('@group_name');
                    console.log(`value: ${value}, formattedTitle: ${formattedTitle}`)
                    setGroupNameContext(await value);
                    storeGroupName(formattedTitle);
                    console.log(`Success ${formattedTitle}`)
                    setError(null);
                    navigation.navigate('Schedule');
                } else {
                    setError(`Такой группы или преподавателя не существует. Полученные данные: ${JSON.stringify(data)}`);
                    setLoading(false);
                }
            })
            .catch(error => {
                clearTimeout(timeoutId); // очищаем таймаут при ошибке
                setLoading(false); // останавливаем загрузку
                setError(`Произошла ошибка при получении данных. ${error}`);
            });
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
