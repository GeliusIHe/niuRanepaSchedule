import React, { useMemo } from "react";
import { Text, StyleSheet, View } from "react-native";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";

type TableSubheadingsType = {
  noteTitle?: string;

  /** Style props */
  tableSubheadingsPosition?: string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const TableSubheadings = ({
  noteTitle,
  tableSubheadingsPosition,
}: TableSubheadingsType) => {
  const tableSubheadingsStyle = useMemo(() => {
    return {
      ...getStyleValue("position", tableSubheadingsPosition),
    };
  }, [tableSubheadingsPosition]);

  return (
    <View style={[styles.tablesubheadings, tableSubheadingsStyle]}>
      <Text style={styles.text}>{noteTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: FontSize.captionSemiBold_size,
    lineHeight: 18,
    fontWeight: "bold",
    fontFamily: FontFamily.tabBarMedium,
    color: Color.lightGraphicsGray,
    textAlign: "left",
  },
  tablesubheadings: {
    backgroundColor: Color.lightBackgroundTertiary,
    width: 375,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Padding.p_xl,
    paddingVertical: Padding.p_xs,
  },
});

export default TableSubheadings;
