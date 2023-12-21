import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Padding, Color, FontFamily, FontSize, Border } from "../GlobalStyles";

type LessonCardType = {
  prop?: string;
  prop1?: string;
  prop2?: string;
  preMedi?: string;
  teacherName: string;
  prop3?: React.ReactNode;
  showBg?: boolean;
  subjectName?: string;
  showBg1?: boolean;
};

const LessonCard = ({
                      prop,
                      prop1,
                      prop2,
                      preMedi,
                      teacherName,
                      prop3,
                      showBg,
                      showBg1,
                      subjectName
                    }: LessonCardType) => {
  // Функция для определения дополнительного стиля
  const getAdditionalStyle = () => {
    if (preMedi && subjectName && preMedi.includes(subjectName)) {
      return {
        borderLeftWidth: 10,
        borderLeftColor: 'blue',
        paddingRight: 10,
      };
    }
    return {};
  };
  const additionalStyle = getAdditionalStyle();
  return (
      <View style={[styles.lessoncard, additionalStyle]}>
        <View style={[styles.time, styles.timeSpaceBlock]}>
          <Text style={[styles.text, styles.textTypo, styles.timeText]}>{prop}</Text>
          <Text style={[styles.text1, styles.text1Typo]}>{prop1}</Text>
        </View>
        <View style={[styles.description, styles.timeSpaceBlock]}>
          <Text style={[styles.text2, {width: '85%'}]}>
            {prop2}
            {teacherName && (
                <Text style={[styles.text3, styles.text3SpaceBlock]}> ({teacherName})</Text>
            )}
          </Text>
          <View style={[styles.nameindicator, styles.text3SpaceBlock]}>
            <Text style={[styles.premedia, styles.textTypo]}>{preMedi}</Text>
            <View style={styles.indicator}>
              {showBg && (
                  <View style={styles.bg}>
                    <Text style={[styles.amount, styles.text1Typo]}>2</Text>
                  </View>
              )}
            </View>
          </View>
          <Text style={[styles.text3, styles.text3SpaceBlock]}>{prop3}</Text>
        </View>
      </View>
  );
};


const styles = StyleSheet.create({
  timeText: {
    marginTop: 27,
  },
  timeSpaceBlock: {
    paddingHorizontal: Padding.p_xs,
    backgroundColor: Color.lightBackgroundPrimary,
    position: "absolute",
  },
  textTypo: {
    color: Color.lightLabelPrimary,
    textAlign: "left",
    fontFamily: FontFamily.tabBarMedium,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: 0,
    fontSize: FontSize.footnoteRegular_size,
  },
  text1Typo: {
    lineHeight: 16,
    fontSize: FontSize.captionSemiBold_size,
    fontFamily: FontFamily.tabBarMedium,
  },
  text3SpaceBlock: {
    marginTop: 8,
    alignSelf: "stretch",
  },
  text: {
    textAlign: "left",
  },
  text1: {
    color: Color.lightLabelSecondary,
    marginTop: 2,
    textAlign: "left",
  },
  time: {
    marginTop: -58,
    width: "16.8%",
    top: "50%",
    right: "83.2%",
    left: "0%",
    borderStyle: "solid",
    borderColor: Color.colorDarkslategray_100,
    borderRightWidth: 0.5,
    paddingTop: Padding.p_xs,
    paddingBottom: Padding.p_lg,
    alignItems: "center",
    height: 116,
  },
  text2: {
    fontSize: FontSize.caption2Semibold_size,
    lineHeight: 14,
    color: Color.lightGraphicsBlue,
    alignSelf: "stretch",
    textAlign: "left",
    fontFamily: FontFamily.tabBarMedium,
    fontWeight: "800",
    letterSpacing: 0,
  },
  premedia: {
    width: 300,
    textAlign: "left",
  },
  amount: {
    color: Color.lightBackgroundPrimary,
    textAlign: "center",
    display: "flex",
    width: 8,
    height: 19,
    justifyContent: "center",
    fontWeight: "600",
    lineHeight: 16,
    fontSize: FontSize.captionSemiBold_size,
    alignItems: "center",
  },
  bg: {
    borderRadius: Border.br_mid,
    backgroundColor: Color.red,
    paddingHorizontal: Padding.p_7xs_5,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    flexDirection: "row",
  },
  nameindicator: {
    justifyContent: "space-between",
    paddingRight: Padding.p_5xs,
    flexDirection: "row",
    alignItems: "center",
  },
  text3: {
    color: Color.lightGraphicsGray,
    textAlign: "left",
    fontFamily: FontFamily.tabBarMedium,
    lineHeight: 18,
    letterSpacing: 0,
    fontSize: FontSize.footnoteRegular_size,
    marginTop: 8,
  },
  description: {
    height: "100%",
    width: "100%",
    top: "0%",
    right: "0%",
    bottom: "0%",
    left: "16.8%",
    paddingVertical: Padding.p_base,
    justifyContent: "center",
  },
  lessoncard: {
    width: 400,
    height: 116,
  },
});

export default LessonCard;
