import React, { useMemo } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { FontFamily, FontSize, Color, Padding } from "../GlobalStyles";

type HeaderTitleIconType = {
  prop?: string;

  /** Style props */
  headerTitleIconPosition?: string;
  headerTitleIconMarginLeft?: number | string;
  headerTitleIconTop?: number | string;
  headerTitleIconLeft?: number | string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const HeaderTitleIcon = ({
  prop,
  headerTitleIconPosition,
  headerTitleIconMarginLeft,
  headerTitleIconTop,
  headerTitleIconLeft,
}: HeaderTitleIconType) => {
  const headerTitleIconStyle = useMemo(() => {
    return {
      ...getStyleValue("position", headerTitleIconPosition),
      ...getStyleValue("marginLeft", headerTitleIconMarginLeft),
      ...getStyleValue("top", headerTitleIconTop),
      ...getStyleValue("left", headerTitleIconLeft),
    };
  }, [
    headerTitleIconPosition,
    headerTitleIconMarginLeft,
    headerTitleIconTop,
    headerTitleIconLeft,
  ]);

  return (
    <View style={[styles.headertitleicon, headerTitleIconStyle]}>
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
    fontFamily: FontFamily.tabBarMedium,
    lineHeight: 24,
    letterSpacing: 0,
    fontSize: FontSize.headlineSemiBold_size,
  },
  backIcon: {
    width: 18,
    height: 24,
  },
  leftTitle: {
    flex: 1,
    color: Color.lightGraphicsBlue,
    textAlign: "left",
    display: "flex",
    height: 23,
    marginLeft: 5,
    overflow: "hidden",
    alignItems: "center",
  },
  leftAccessory: {
    left: 0,
    width: 136,
    paddingLeft: Padding.p_6xs,
    paddingTop: Padding.p_4xs,
    paddingRight: Padding.p_4xs,
    paddingBottom: Padding.p_4xs,
    display: "none",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  text: {
    fontWeight: "600",
    color: Color.lightLabelPrimary,
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
    alignItems: "center",
  },
  rightAccessory: {
    right: 0,
    justifyContent: "flex-end",
    paddingLeft: Padding.p_5xs,
    paddingTop: Padding.p_5xs,
    paddingRight: Padding.p_base,
    paddingBottom: Padding.p_5xs,
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  headertitleicon: {
    backgroundColor: Color.lightBackgroundQuaternary,
    borderStyle: "solid",
    borderColor: Color.colorDarkslategray_100,
    borderBottomWidth: 0.5,
    width: 375,
    height: 42,
  },
});

export default HeaderTitleIcon;
