import React, { useMemo } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { FontFamily, FontSize, Color, Padding } from "../GlobalStyles";

type HeaderTitleType = {
  prop?: string;

  /** Style props */
  headerTitlePosition?: string;
  headerTitleMarginLeft?: number | string;
  headerTitleTop?: number | string;
  headerTitleLeft?: number | string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const HeaderTitle = ({
  prop,
  headerTitlePosition,
  headerTitleMarginLeft,
  headerTitleTop,
  headerTitleLeft,
}: HeaderTitleType) => {
  const headerTitleStyle = useMemo(() => {
    return {
      ...getStyleValue("position", headerTitlePosition),
      ...getStyleValue("marginLeft", headerTitleMarginLeft),
      ...getStyleValue("top", headerTitleTop),
      ...getStyleValue("left", headerTitleLeft),
    };
  }, [
    headerTitlePosition,
    headerTitleMarginLeft,
    headerTitleTop,
    headerTitleLeft,
  ]);

  return (
    <View style={[styles.headertitle, headerTitleStyle]}>
      <View style={[styles.leftAccessory, styles.accessoryFlexBox]}>
        <Image
          style={styles.backIcon}
          contentFit="cover"
          source={require("../assets/back-icon.png")}
        />
        <Text style={[styles.leftTitle, styles.textTypo]}>Расписание</Text>
      </View>
      <View style={[styles.title, styles.accessoryFlexBox]}>
        <Text style={[styles.text, styles.textTypo]}>{prop}</Text>
      </View>
      <View style={[styles.rightAccessory, styles.accessoryFlexBox]}>
        <View style={[styles.iconsleft, styles.accessoryFlexBox]}>
          <Image
            style={styles.badgecalendarIcon}
            contentFit="cover"
            source={require("../assets/badgecalendar.png")}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accessoryFlexBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  textTypo: {
    lineHeight: 24,
    letterSpacing: 0,
  },
  backIcon: {
    width: 18,
    height: 24,
    display: "none",
  },
  leftTitle: {
    flex: 1,
    color: Color.lightGraphicsBlue,
    textAlign: "left",
    height: 23,
    marginLeft: 2,
    overflow: "hidden",
    display: "none",
    alignItems: "center",
  },
  leftAccessory: {
    left: 0,
    width: 136,
    padding: Padding.p_5xs,
    display: "none",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  text: {
    fontSize: 19,
    fontWeight: "600",
    color: "#424242",
    textAlign: "center",
  },
  title: {
    marginLeft: -66.5,
    left: "50%",
    width: 133,
    justifyContent: "center",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  badgecalendarIcon: {
    width: 26,
    height: 26,
    overflow: "hidden",
  },
  iconsleft: {
    display: "none",
    alignItems: "center",
  },
  rightAccessory: {
    right: 0,
    width: 120,
    justifyContent: "flex-end",
    paddingLeft: Padding.p_4xs,
    paddingTop: Padding.p_4xs,
    paddingRight: Padding.p_base,
    paddingBottom: Padding.p_4xs,
    display: "none",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  headertitle: {
    backgroundColor: Color.lightBackgroundQuaternary,
    width: 400,
    height: 42,
  },
});

export default HeaderTitle;
