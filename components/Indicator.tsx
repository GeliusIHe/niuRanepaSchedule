import React, { useMemo } from "react";
import { Text, StyleSheet, View } from "react-native";
import { FontSize, FontFamily, Color, Border, Padding } from "../GlobalStyles";

type IndicatorType = {
  showBg?: boolean;

  /** Style props */
  indicatorPosition?: string;
  indicatorPadding?: number | string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const Indicator = ({
  showBg,
  indicatorPosition,
  indicatorPadding,
}: IndicatorType) => {
  const indicatorStyle = useMemo(() => {
    return {
      ...getStyleValue("position", indicatorPosition),
      ...getStyleValue("padding", indicatorPadding),
    };
  }, [indicatorPosition, indicatorPadding]);

  return (
    <View style={[styles.indicator, indicatorStyle]}>
      {showBg && (
        <View style={[styles.bg, styles.bgFlexBox]}>
          <Text style={[styles.amount, styles.bgFlexBox]}>2</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bgFlexBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  amount: {
    fontSize: FontSize.captionSemiBold_size,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: FontFamily.tabBarMedium,
    color: Color.lightBackgroundPrimary,
    textAlign: "center",
    display: "flex",
    width: 8,
    height: 19,
  },
  bg: {
    borderRadius: Border.br_mid,
    backgroundColor: Color.red,
    paddingHorizontal: Padding.p_7xs_5,
    paddingVertical: 0,
  },
  indicator: {
    flexDirection: "row",
    padding: 3,
  },
});

export default Indicator;
