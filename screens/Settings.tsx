
import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, Alert} from 'react-native';
import Modal from 'react-native-modal';
import Svg, { Rect, Path } from 'react-native-svg';
import TabBar from '../components/TabBar';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useGroup} from "../components/GroupContext";
import HeaderTitle from "../components/HeaderTitle";
const Settings = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // состояние для отслеживания загрузки

    const handleConfirm = async () => {
        console.log(inputValue);
        setIsModalOpen(false);
        try {
            await AsyncStorage.setItem('@daysMargin', inputValue);
        } catch (e) {
            console.error("Ошибка при сохранении в AsyncStorage:", e);
        }
    };


    const storeGroupName = async (value: string) => {
        try {
            await AsyncStorage.setItem('@group_name', value);
        } catch (e) {
            console.error('Error saving group name:', e);
        }
    };
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
                    setGroupNameContext(await value);
                    storeGroupName(formattedTitle);
                    setError(null);
                    setModalVisible(false);
                } else {
                    setError(`Такой группы или преподавателя не существует. Полученные данные: ${JSON.stringify(data)}`);
                    setLoading(false);
                }
            })
            .catch(error => {
                clearTimeout(timeoutId); // очищаем таймаут при ошибке
                setLoading(false); // останавливаем загрузку
                setError('Произошла ошибка при получении данных.');
            });
    };

    const inputRef = useRef<TextInput>(null); // указываем TextInput как тип ссылки

    useEffect(() => {
        if (modalVisible) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [modalVisible]);

    return (
        <View style={styles.container}>
            <View style={{marginBottom: 15}}>
                <HeaderTitle
                    prop="Настройки"
                    headerTitleMarginLeft={-200.5}
                    headerTitleTop={10}
                    headerTitleLeft="50%"
                />
            </View>
            <TouchableOpacity
                style={[{height: 80}, styles.groupContainer]}
                onPress={() => setModalVisible(true)}
            >
                <Svg width={30} height={30} viewBox="0 0 30 30">
                    <Rect width="30" height="30" rx="7" fill="#5AC8FA" />
                    <Path
                        d="M16.4464 22.87H18.3298C19.0831 22.87 19.4824 22.4556 19.4824 21.7174V11.5698L20.6275 21.8831C20.7028 22.6214 21.1398 22.998 21.8856 22.9076L24.2436 22.5912C24.9894 22.5008 25.3359 22.0639 25.2606 21.3256L23.9196 9.20424C23.8443 8.46596 23.4074 8.08929 22.6616 8.17969L20.296 8.49609C19.9269 8.53376 19.6557 8.66936 19.4824 8.8803V7.27567C19.4824 6.53739 19.0831 6.12305 18.3298 6.12305H16.4464C15.7006 6.12305 15.3013 6.53739 15.3013 7.27567V21.7174C15.3013 22.4556 15.7006 22.87 16.4464 22.87ZM5.86942 22.87H7.11998C7.87333 22.87 8.2726 22.4556 8.2726 21.7174V9.40011C8.2726 8.66183 7.87333 8.24749 7.11998 8.24749H5.86942C5.11607 8.24749 4.7168 8.66183 4.7168 9.40011V21.7174C4.7168 22.4556 5.11607 22.87 5.86942 22.87ZM10.3142 22.87H13.2522C14.0056 22.87 14.4049 22.4556 14.4049 21.7174V12.0745C14.4049 11.3362 14.0056 10.9294 13.2522 10.9294H10.3142C9.56836 10.9294 9.16908 11.3362 9.16908 12.0745V21.7174C9.16908 22.4556 9.56836 22.87 10.3142 22.87ZM10.9093 13.7469C10.6155 13.7469 10.397 13.5209 10.397 13.2347C10.397 12.9559 10.6155 12.7374 10.9093 12.7374H12.6797C12.966 12.7374 13.1844 12.9559 13.1844 13.2347C13.1844 13.5209 12.966 13.7469 12.6797 13.7469H10.9093ZM10.9093 21.0619C10.6155 21.0619 10.397 20.8435 10.397 20.5572C10.397 20.2709 10.6155 20.0525 10.9093 20.0525H12.6797C12.966 20.0525 13.1844 20.2709 13.1844 20.5572C13.1844 20.8435 12.966 21.0619 12.6797 21.0619H10.9093Z"
                        fill="white"
                    />
                </Svg>
                <View style={{ flexDirection: 'column', width: '80%' }}>
                    <Text style={styles.groupText}>Расписание по умолчанию</Text>
                    <Text style={{fontSize: 10, marginLeft: 15}}>Данная настройка изменяет то, какая группа будет по умолчанию отображаться во вкладке расписания.</Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Image source={require('../assets/Arrow.png')} style={styles.arrowIcon} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsModalOpen(true)} style={[{height: 80}, styles.groupContainer]}>
                <Svg width={30} height={30} viewBox="0 0 30 30">
                    <Rect width="30" height="30" rx="7" fill="#5AC8FA" />
                    <Path
                        d="M16.4464 22.87H18.3298C19.0831 22.87 19.4824 22.4556 19.4824 21.7174V11.5698L20.6275 21.8831C20.7028 22.6214 21.1398 22.998 21.8856 22.9076L24.2436 22.5912C24.9894 22.5008 25.3359 22.0639 25.2606 21.3256L23.9196 9.20424C23.8443 8.46596 23.4074 8.08929 22.6616 8.17969L20.296 8.49609C19.9269 8.53376 19.6557 8.66936 19.4824 8.8803V7.27567C19.4824 6.53739 19.0831 6.12305 18.3298 6.12305H16.4464C15.7006 6.12305 15.3013 6.53739 15.3013 7.27567V21.7174C15.3013 22.4556 15.7006 22.87 16.4464 22.87ZM5.86942 22.87H7.11998C7.87333 22.87 8.2726 22.4556 8.2726 21.7174V9.40011C8.2726 8.66183 7.87333 8.24749 7.11998 8.24749H5.86942C5.11607 8.24749 4.7168 8.66183 4.7168 9.40011V21.7174C4.7168 22.4556 5.11607 22.87 5.86942 22.87ZM10.3142 22.87H13.2522C14.0056 22.87 14.4049 22.4556 14.4049 21.7174V12.0745C14.4049 11.3362 14.0056 10.9294 13.2522 10.9294H10.3142C9.56836 10.9294 9.16908 11.3362 9.16908 12.0745V21.7174C9.16908 22.4556 9.56836 22.87 10.3142 22.87ZM10.9093 13.7469C10.6155 13.7469 10.397 13.5209 10.397 13.2347C10.397 12.9559 10.6155 12.7374 10.9093 12.7374H12.6797C12.966 12.7374 13.1844 12.9559 13.1844 13.2347C13.1844 13.5209 12.966 13.7469 12.6797 13.7469H10.9093ZM10.9093 21.0619C10.6155 21.0619 10.397 20.8435 10.397 20.5572C10.397 20.2709 10.6155 20.0525 10.9093 20.0525H12.6797C12.966 20.0525 13.1844 20.2709 13.1844 20.5572C13.1844 20.8435 12.966 21.0619 12.6797 21.0619H10.9093Z"
                        fill="white"
                    />
                </Svg>
                <View style={{ flexDirection: 'column', width: '80%' }}>
                    <Text style={styles.groupText}>Прогружаемые дни за раз</Text>
                    <Text style={{fontSize: 10, marginLeft: 15}}>Эта настройка устанавливает количество дней, прогружаемых за раз при заходе в приложение. </Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Image source={require('../assets/Arrow.png')} style={styles.arrowIcon} />
                </View>
            </TouchableOpacity>
            <Modal
                isVisible={isModalOpen}
                onBackdropPress={() => setIsModalOpen(false)}
                onBackButtonPress={() => setIsModalOpen(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
            >
                <View style={styles.modalView}>
                    <TextInput
                        style={styles.input}
                        ref={inputRef}
                        keyboardType="numeric"
                        value={inputValue}
                        onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
                        autoFocus={true}
                        placeholder="Введите число"
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={() => {
                        const numValue = parseInt(inputValue, 10);
                        if (numValue >= 7 && numValue <= 31) {
                            handleConfirm();
                        } else {
                            Alert.alert("Ошибка", "Число должно быть в диапазоне от 7 до 31");
                        }
                    }}>
                        <Text style={styles.textStyle}>Установить</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
            <Modal
                isVisible={modalVisible}
                onSwipeComplete={() => setModalVisible(false)}
                swipeDirection={['down']}
                style={styles.modal}
                onBackdropPress={() => setModalVisible(false)} // закрыть модальное окно при нажатии вне его
            >
                <View style={styles.headerBar}></View>
                <View style={styles.modalContent}>
                    <Text style={styles.headerText}>Установка основной группы</Text>
                    <Text style={styles.instructionText}>
                        Введите название группы, которую вы будете видеть при заходе во вкладку “Расписание”.
                    </Text>
                    {error && <Text style={{color: 'red'}}>{error}</Text>}
                    <TextInput
                        ref={inputRef}
                        placeholder="Название группы"
                        style={styles.input}
                        onChangeText={text => setGroupName(text)}
                        value={groupName}
                    />

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleSubmit}
                        disabled={loading} // делаем кнопку неактивной при загрузке
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#0000ff" /> // отображаем индикатор загрузки
                        ) : (
                            <Text style={styles.textStyle}>Сохранить</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </Modal>
            <TabBar
                imageDimensions={require("../assets/briefcaseGray.png")}
                tabBarPosition="absolute"
                tabBarTop={800}
                tabBarLeft={0}
                textColor="#007aff"
                tabBarWidth={400}
                tabBarHeight={75}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
    textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    input: {
        paddingLeft: 15,
        borderWidth: 0.3, // Толщина черной полоски
        borderRadius: 20,
        height: 55,
        borderColor: 'gray',
        width: '100%',
        marginTop: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    container: {
        flex: 1,
    },
    groupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingStart: 20,
        width: '100%', // или другой размер, который вы хотите
    },
    groupIcon: {
        width: 30,
        height: 30,
    },
    groupText: {
        marginLeft: 15,
    },
    arrowContainer: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 20,
    },
    arrowIcon: {
        // Задайте размеры, если это необходимо
    },
});
export default Settings;
