import React, {useEffect, useMemo, useState} from "react";
import { Image } from "expo-image";
import {StyleSheet, Text, View, ImageSourcePropType, Dimensions, TouchableOpacity} from "react-native";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";
import {useIsFocused, useNavigation, useNavigationState} from "@react-navigation/core";
import Svg, {Path, Rect} from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TabBarType = {
    imageDimensions?: ImageSourcePropType;

    tabBarPosition?: string;
    tabBarTop?: number | string;
    tabBarLeft?: number | string;
    textColor?: string;

    tabBarWidth?: number;
    tabBarHeight?: number;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const TabBar = ({
                    imageDimensions,
                    tabBarPosition,
                    tabBarTop,
                    tabBarLeft,
                    textColor,
                    tabBarWidth, // новое свойство
                    tabBarHeight, // новое свойство
                }: TabBarType) => {
  const tabBarStyle = useMemo(() => {
    return {
      ...getStyleValue("position", "absolute"), // Используем absolute positioning
      ...getStyleValue("bottom", 0), // Размещаем внизу экрана
      ...getStyleValue("left", 0), // Размещаем слева
    };
  }, []);
    const [activeTab, setActiveTab] = useState('Schedule'); // Устанавливаем начальное состояние
    const navigation = useNavigation();
    const navState = useNavigationState(state => state); // Определение navState

    useEffect(() => {
        const routeName = navState.routes[navState.index].name as 'Schedule' | 'Chat' | 'SearchTyping' | 'Settings';
        setActiveTab(routeName);
    }, [navState.index]); // Обновление при изменении индекса в navState

    const handleTabPress = (routeName: 'Schedule' | 'Chat' | 'SearchTyping' | 'Settings') => {
        setActiveTab(routeName);
        navigation.navigate(routeName as never);
    };


    const getTabStyles = (tabName: 'Schedule' | 'Chat' | 'SearchTyping' | 'Settings') => {
        return activeTab === tabName ? { color: '#0381ff' } : {};
    };

  const textStyle = useMemo(() => {
    return {
      ...getStyleValue("color", textColor),
    };
  }, [textColor]);

    return (
        <View style={[
            styles.tabbar,
            tabBarStyle,
            styles.container,
            { width: tabBarWidth, height: tabBarHeight } // применение новых свойств
        ]}>
            <TouchableOpacity onPress={() => handleTabPress('Schedule')}>
                <View style={styles.iconContainer}>
                    {activeTab === 'Schedule' ?
                        <Image style={styles.briefcaseIcon} source={require("../assets/briefcaseBlue.png")} /> :
                        <Image style={styles.briefcaseIcon} source={require("../assets/briefcaseGray.png")} />
                    }
                    <Text style={[styles.text, getTabStyles('Schedule')]}>Расписание</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('Chat')}>
                <View style={styles.iconContainer}>
                    <Image
                        style={styles.briefcaseIcon}
                        contentFit="cover"
                        source={require("../assets/bubble.png")}
                    />
                    <Text style={styles.text}>Чат</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('SearchTyping')}>
                <View style={styles.iconContainer}>
                    {activeTab === 'SearchTyping' ?
                        <Svg style={[styles.briefcaseIcon, {width: 28, height: 28}]} width={28} height={28} viewBox="0 0 28 28">
                            <Rect width="28" height="28" rx="7" fill="none" />
                            <Path transform="scale(1.4)" d="M8.20355 16.097C9.75992 16.097 11.2184 15.6316 12.4322 14.8364L16.7195 19.0934C17.0034 19.3649 17.3656 19.5007 17.7571 19.5007C18.5696 19.5007 19.1667 18.8703 19.1667 18.0752C19.1667 17.7067 19.0394 17.3479 18.7653 17.0764L14.5073 12.8388C15.3883 11.5976 15.9071 10.0946 15.9071 8.4655C15.9071 4.26671 12.442 0.833984 8.20355 0.833984C3.97492 0.833984 0.5 4.26671 0.5 8.4655C0.5 12.6643 3.96513 16.097 8.20355 16.097ZM8.20355 14.0607C5.10059 14.0607 2.55558 11.5394 2.55558 8.4655C2.55558 5.39156 5.10059 2.87035 8.20355 2.87035C11.3065 2.87035 13.8515 5.39156 13.8515 8.4655C13.8515 11.5394 11.3065 14.0607 8.20355 14.0607Z" fill="#007AFF"/>
                        </Svg>  :
                        <Svg style={[styles.briefcaseIcon, {width: 28, height: 28}]} width={28} height={28} viewBox="0 0 28 28">
                            <Rect width="28" height="28" rx="7" fill="none" />
                            <Path transform="scale(1.4)" d="M8.20355 16.096C9.75992 16.096 11.2184 15.6306 12.4322 14.8354L16.7195 19.0924C17.0034 19.3639 17.3656 19.4997 17.7571 19.4997C18.5696 19.4997 19.1667 18.8694 19.1667 18.0742C19.1667 17.7057 19.0394 17.3469 18.7653 17.0754L14.5073 12.8379C15.3883 11.5966 15.9071 10.0936 15.9071 8.46452C15.9071 4.26573 12.442 0.833008 8.20355 0.833008C3.97492 0.833008 0.5 4.26573 0.5 8.46452C0.5 12.6633 3.96513 16.096 8.20355 16.096ZM8.20355 14.0597C5.10059 14.0597 2.55558 11.5385 2.55558 8.46452C2.55558 5.39058 5.10059 2.86937 8.20355 2.86937C11.3065 2.86937 13.8515 5.39058 13.8515 8.46452C13.8515 11.5385 11.3065 14.0597 8.20355 14.0597Z" fill="#8E8E93"/>
                        </Svg>                    }
                    <Text style={[styles.text, getTabStyles('SearchTyping')]}>Поиск</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('Settings')}>
                <View style={styles.iconContainer}>
                    {activeTab === 'Settings' ?
                        <Svg style={[styles.briefcaseIcon, {width: 28, height: 28}]} width={28} height={28} viewBox="0 0 28 28">
                            <Rect width="28" height="28" rx="7" fill="none" />
                            <Path transform="scale(1.25)" d="M8.5 8.73603C10.703 8.73603 12.5639 6.80354 12.5639 4.30327C12.5639 1.86276 10.6929 0 8.5 0C6.31716 0 4.44615 1.89264 4.44615 4.32319C4.45621 6.80354 6.3071 8.73603 8.5 8.73603ZM2.23314 18H14.7669C16.4266 18 17 17.5019 17 16.5955C17 14.0255 13.7207 10.4992 8.5 10.4992C3.28935 10.4992 0 14.0255 0 16.5955C0 17.5019 0.573373 18 2.23314 18Z" fill="#007AFF"/>
                        </Svg> :
                        <Svg style={[styles.briefcaseIcon, {width: 28, height: 28}]} width={28} height={28} viewBox="0 0 28 28">
                            <Rect width="28" height="28" rx="7" fill="none" />
                            <Path transform="scale(1.25)" d="M8.5 8.73603C10.703 8.73603 12.5639 6.80354 12.5639 4.30327C12.5639 1.86276 10.6929 0 8.5 0C6.31716 0 4.44615 1.89264 4.44615 4.32319C4.45621 6.80354 6.3071 8.73603 8.5 8.73603ZM2.23314 18H14.7669C16.4266 18 17 17.5019 17 16.5955C17 14.0255 13.7207 10.4992 8.5 10.4992C3.28935 10.4992 0 14.0255 0 16.5955C0 17.5019 0.573373 18 2.23314 18Z" fill="#8E8E93"/>
                        </Svg>
                    }
                    <Text style={[styles.text, getTabStyles('Settings')]}>Профиль</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', // Гарантирует, что иконки распределяются в ряд
        justifyContent: 'space-around', // Распределяет иконки равномерно
        backgroundColor: Color.lightBackgroundQuaternary,
        borderTopWidth: 0.5,
        borderColor: Color.colorDarkslategray_100,
    },
    iconContainer: {
        flex: 1, // Это поможет равномерно распределить пространство между иконками
        alignItems: 'center', // Выравнивание содержимого по центру
        paddingVertical: 15, // Вертикальный отступ для каждой иконки
    },
    briefcaseIcon: {
        width: 35,
        height: 28,
        overflow: "hidden",
    },
    tabbar: {
        backgroundColor: Color.lightBackgroundQuaternary,
        borderStyle: "solid",
        borderColor: Color.colorDarkslategray_100,
        borderTopWidth: 0.5,
        width: width,
        justifyContent: "center",
        flexDirection: "row",
        paddingHorizontal: Padding.p_lg,
        paddingTop: -5,
        paddingBottom: 5,
        alignItems: "center",
    },
    text: {
        fontSize: FontSize.tabBarMedium_size,
        letterSpacing: 0,
        lineHeight: 12,
        fontWeight: "500",
        fontFamily: FontFamily.tabBarMedium,
        color: Color.lightGraphicsGray,
        textAlign: "center",
    },
});

export default TabBar;
