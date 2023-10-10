import React, { useMemo } from "react";
import { Image } from "expo-image";
import {StyleSheet, Text, View, ImageSourcePropType, Dimensions} from "react-native";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";

type TabBarType = {
  imageDimensions?: ImageSourcePropType;

  /** Style props */
  tabBarPosition?: string;
  tabBarTop?: number | string;
  tabBarLeft?: number | string;
  textColor?: string;
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
                }: TabBarType) => {
  const tabBarStyle = useMemo(() => {
    return {
      ...getStyleValue("position", "absolute"), // Используем absolute positioning
      ...getStyleValue("bottom", 0), // Размещаем внизу экрана
      ...getStyleValue("left", 0), // Размещаем слева
    };
  }, []);

  const textStyle = useMemo(() => {
    return {
      ...getStyleValue("color", textColor),
    };
  }, [textColor]);

  return (
      <View style={[styles.tabbar, tabBarStyle]}>
        <View style={styles.icontext}>
        <Image
          style={styles.briefcaseIcon}
          contentFit="cover"
          source={imageDimensions}
        />
        <Text style={[styles.text, textStyle]}>Расписание</Text>
      </View>
      <View style={styles.icontext1}>
        <Image
          style={styles.briefcaseIcon}
          contentFit="cover"
          source={require("../assets/bubble.png")}
        />
        <Text style={styles.text}>Чат</Text>
      </View>
      <View style={styles.icontext1}>
        <Image
          style={styles.briefcaseIcon}
          contentFit="cover"
          source={require("../assets/magnifyingglass.png")}
        />
        <Text style={styles.text}>Поиск</Text>
      </View>
      <View style={styles.icontext1}>
        <Image
          style={styles.briefcaseIcon}
          contentFit="cover"
          source={require("../assets/person.png")}
        />
        <Text style={styles.text}>Профиль</Text>
      </View>
    </View>
  );
};
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  briefcaseIcon: {
    width: 35,
    height: 28,
    overflow: "hidden",
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
  icontext: {
    alignItems: "center",
  },
  icontext1: {
    marginLeft: 56,
    alignItems: "center",
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
    paddingTop: Padding.p_9xs,
    paddingBottom: Padding.p_15xl,
    alignItems: "center",
  },
});

export default TabBar;
