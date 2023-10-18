import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import HeaderTitle from "../components/HeaderTitle";
import SearchFocusedIcon from "../components/SearchFocusedIcon";
import { FontSize, FontFamily, Color, Padding } from "../GlobalStyles";
import TabBar from "../components/TabBar";
import {useState} from "react";

const SearchTyping = () => {
    const [searchQuery, setSearchQuery] = useState(''); // Состояние для отслеживания текста в поле ввода
  return (
  <View style={[styles.searchTyping, {flex: 1, flexDirection: 'column', justifyContent: 'space-between'}]}>
      <SearchFocusedIcon
          searchFocusedIconPosition="absolute"
          searchFocusedIconBorderStyle="solid"
          searchFocusedIconBorderColor="lightgrey"
          searchFocusedIconTop={100} // Вы можете настроить это значение
          searchFocusedIconLeft={0}
          inputFieldJustifyContent="flex-start"
          textWidth="unset"
          textWidth1={280}
          textLineHeight={24}
      />
      <TabBar
          imageDimensions={require("../assets/briefcaseGray.png")}
          tabBarPosition="absolute"
          tabBarTop={800}
          tabBarLeft={0}
          textColor="#007aff"
          tabBarWidth={400}
          tabBarHeight={75}
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
  searchTyping: {
    backgroundColor: Color.lightBackgroundTertiary,
    height: 812,
    width: '100%',
  },
});

export default SearchTyping;
