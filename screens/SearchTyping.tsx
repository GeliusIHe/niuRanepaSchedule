import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import HeaderTitle from "../components/HeaderTitle";
import SearchFocusedIcon from "../components/SearchFocusedIcon";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";
import TabBar from "../components/TabBar";

const SearchTyping = () => {
  return (
    <View style={styles.searchTyping}>
      <HeaderTitle
        prop="Поиск"
        headerTitlePosition="absolute"
        headerTitleMarginLeft={-187.5}
        headerTitleTop={44}
        headerTitleLeft="50%"
      />
      <SearchFocusedIcon
        showCursor1
        searchFocusedIconPosition="absolute"
        searchFocusedIconBorderStyle="unset"
        searchFocusedIconBorderColor="unset"
        searchFocusedIconTop={87}
        searchFocusedIconLeft={0}
        inputFieldJustifyContent="flex-start"
        textWidth="unset"
        textWidth1={45}
        textLineHeight={24}
      />
      <View style={styles.content}>
        <Text style={styles.text}>{`Приложение сможет найти расписание 
преподавателя, группы и аудитории 👍`}</Text>
      </View>
      <TabBar
          imageDimensions={require("../assets/briefcase1.png")}
          tabBarPosition="absolute"
          tabBarTop={734}
          tabBarLeft={0}
          textColor="#007aff"
          tabBarWidth={400} // новое свойство
          tabBarHeight={60} // новое свойство
      />

    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: FontSize.footnoteRegular_size,
    letterSpacing: 0,
    lineHeight: 18,
    color: Color.lightLabelSecondary,
    textAlign: "center",
    marginLeft: 30,},
  content: {
    position: "absolute",
    top: 368,
    left: 0,
    backgroundColor: Color.lightBackgroundQuaternary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Padding.p_xl,
    width: 375,
  },
  searchTyping: {
    backgroundColor: Color.lightBackgroundTertiary,
    height: 812,
    width: '100%',
  },
});

export default SearchTyping;
