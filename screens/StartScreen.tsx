import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator} from 'react-native';
import Swiper from 'react-native-swiper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Modal from "react-native-modal";
import {navigate} from "@react-navigation/routers/lib/typescript/src/CommonActions";
import {useNavigation} from "@react-navigation/core";

const StartScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const swiperRef = useRef<Swiper>(null);
    const inputRef = useRef<TextInput>(null);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation();
    const goToDefaultScheduleSet = () => {
        navigation.navigate('DefaultScheduleSet');
    };
    const goToNextSlide = () => {
        swiperRef.current?.scrollBy(1);
    };

    return (
        <Swiper
            ref={swiperRef}
            showsPagination={true}
            dotColor="grey"
            activeDotColor="#007AFF"
            style={styles.wrapper}
            paginationStyle={styles.paginationStyle}
            scrollEnabled={false} // отключает возможность переключения слайдов с помощью свайпа
        >
            <View style={styles.slide}>
                <Image
                    source={require('../assets/LogoOnboarding.png')}
                    style={styles.image}
                />
                <Text style={styles.text}>Привет! Это новое приложение РАНХИГС</Text>
                <Text style={styles.subtext}>Просматривайте расписание занятий без ошибок РУЗ</Text>
                <TouchableOpacity style={styles.button} onPress={goToNextSlide}>
                    <Text style={styles.buttonText}>Продолжить</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.slide}>
                <Image
                    source={require('../assets/FastSearch.png')}
                    style={styles.image}
                />
                <Text style={styles.text}>Быстрый поиск по университету</Text>
                <Text style={styles.subtext}>Узнавайте информацию о группах, преподавателях и свободных аудиториях</Text>
                <TouchableOpacity style={styles.button} onPress={goToDefaultScheduleSet}>
                    <Text style={styles.buttonText}>Продолжить</Text>
                </TouchableOpacity>
            </View>
        </Swiper>
    );
};

const styles = StyleSheet.create({
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
        width: 180,
        height: 180,
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
        marginBottom: 40,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default StartScreen;
