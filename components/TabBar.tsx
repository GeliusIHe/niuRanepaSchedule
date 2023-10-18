import React, {useEffect, useMemo, useState} from "react";
import { Image } from "expo-image";
import {StyleSheet, Text, View, ImageSourcePropType, Dimensions, TouchableOpacity} from "react-native";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";
import {useIsFocused, useNavigation, useNavigationState} from "@react-navigation/core";

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
        const routeName = navState.routes[navState.index].name as 'Schedule' | 'Chat' | 'SearchTyping' | 'Profile';
        setActiveTab(routeName);
    }, [navState.index]); // Обновление при изменении индекса в navState

    const handleTabPress = (routeName: 'Schedule' | 'Chat' | 'SearchTyping' | 'Profile') => {
        setActiveTab(routeName);
        navigation.navigate(routeName as never);
    };


    const getTabStyles = (tabName: 'Schedule' | 'Chat' | 'SearchTyping' | 'Profile') => {
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
                        <Image style={[styles.briefcaseIcon, {width: 28, height: 28}]} source={require("../assets/magnifyingglassBlue.svg")} /> :
                        <Image style={[styles.briefcaseIcon, {width: 28, height: 28}]} source={require("../assets/magnifyingglassGray.svg")} />
                    }
                    <Text style={[styles.text, getTabStyles('SearchTyping')]}>Поиск</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('Profile')}>
                <View style={styles.iconContainer}>
                    <Image
                        style={styles.briefcaseIcon}
                        contentFit="cover"
                        source={require("../assets/person.png")}
                    />
                    <Text style={styles.text}>Профиль</Text>
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
