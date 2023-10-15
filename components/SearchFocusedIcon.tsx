import React, { useMemo } from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text } from "react-native";
import { FontFamily, Color, FontSize, Border, Padding } from "../GlobalStyles";

type SearchFocusedIconType = {
  showCursor1?: boolean;

  /** Style props */
  searchFocusedIconPosition?: string;
  searchFocusedIconBorderStyle?: string;
  searchFocusedIconBorderColor?: string;
  searchFocusedIconBorderBottomWidth?: number | string;
  searchFocusedIconTop?: number | string;
  searchFocusedIconLeft?: number | string;
  inputFieldJustifyContent?: string;
  textWidth?: number | string;
  textWidth1?: number | string;
  textFlex?: number;
  textLineHeight?: number;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const SearchFocusedIcon = ({
  showCursor1,
  searchFocusedIconPosition,
  searchFocusedIconBorderStyle,
  searchFocusedIconBorderColor,
  searchFocusedIconBorderBottomWidth,
  searchFocusedIconTop,
  searchFocusedIconLeft,
  inputFieldJustifyContent,
  textWidth,
  textWidth1,
  textFlex,
  textLineHeight,
}: SearchFocusedIconType) => {
  const searchFocusedIconStyle = useMemo(() => {
    return {
      ...getStyleValue("position", searchFocusedIconPosition),
      ...getStyleValue("borderStyle", searchFocusedIconBorderStyle),
      ...getStyleValue("borderColor", searchFocusedIconBorderColor),
      ...getStyleValue("borderBottomWidth", searchFocusedIconBorderBottomWidth),
      ...getStyleValue("top", searchFocusedIconTop),
      ...getStyleValue("left", searchFocusedIconLeft),
    };
  }, [
    searchFocusedIconPosition,
    searchFocusedIconBorderStyle,
    searchFocusedIconBorderColor,
    searchFocusedIconBorderBottomWidth,
    searchFocusedIconTop,
    searchFocusedIconLeft,
  ]);

  const inputFieldStyle = useMemo(() => {
    return {
      ...getStyleValue("justifyContent", inputFieldJustifyContent),
    };
  }, [inputFieldJustifyContent]);

  const textStyle = useMemo(() => {
    return {
      ...getStyleValue("width", textWidth),
    };
  }, [textWidth]);

  const text1Style = useMemo(() => {
    return {
      ...getStyleValue("width", textWidth1),
      ...getStyleValue("flex", textFlex),
    };
  }, [textWidth1, textFlex]);

  const text2Style = useMemo(() => {
    return {
      ...getStyleValue("lineHeight", textLineHeight),
    };
  }, [textLineHeight]);

  return (
    <View style={[styles.searchfocusedicon, searchFocusedIconStyle]}>
      <View style={styles.inputFlexBox}>
        <View style={[styles.inputField, styles.inputFlexBox, inputFieldStyle]}>
          <View style={styles.inputFlexBox}>
            <Image
              style={styles.searchIcon}
              contentFit="cover"
              source={require("../assets/search1.png")}
            />
            <View style={[styles.text, textStyle]}>
              {showCursor1 && <View style={styles.cursorLayout} />}
              <Text style={[styles.text1, styles.textTypo, text1Style]}>
                Поиск
              </Text>
              <View style={[styles.cursor2, styles.cursorLayout]} />
            </View>
          </View>
          <Image
            style={styles.sfSymbolXmarkcirclefill}
            contentFit="cover"
            source={require("../assets/sf-symbol--xmarkcirclefill.png")}
          />
        </View>
        <Text style={[styles.text2, styles.textTypo, text2Style]}>
          Отменить
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputFlexBox: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: 'lightgray',
    flexDirection: "row",
  },
  textTypo: {
    letterSpacing: 0,
  },
  cursorLayout: {
    height: 22,
    width: 2,
    borderRightWidth: 2,
    borderColor: Color.lightGraphicsBlue,
    borderStyle: "solid",
  },
  searchIcon: {
    width: 16,
    height: 16,
    overflow: "hidden",
  },
  text1: {
    lineHeight: 20,
    color: Color.lightGraphicsGray,
    textAlign: "left",
    display: "flex",
    width: 45,
    height: 20,
    marginLeft: 1,
    alignItems: "center",
  },
  cursor2: {
    display: "none",
    marginLeft: 1,
  },
  text: {
    marginLeft: 8,
    flexDirection: "row",
  },
  sfSymbolXmarkcirclefill: {
    width: 17,
    height: 17,
    marginLeft: 8,
  },
  inputField: {
    paddingHorizontal: Padding.p_xs,
    paddingVertical: Padding.p_5xs,
  },
  text2: {
    lineHeight: 24,
    color: Color.lightGraphicsBlue,
    textAlign: "right",
    display: "none",
    marginLeft: 8,
  },
  searchfocusedicon: {
    backgroundColor: Color.lightBackgroundQuaternary,
    marginLeft: 15,
    width: 375,
    height: 56,
    padding: Padding.p_xs,
    alignItems: "center",
    flexDirection: "row",
    borderStyle: "solid",
  },
});

export default SearchFocusedIcon;
