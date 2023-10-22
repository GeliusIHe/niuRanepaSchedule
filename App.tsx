import SearchTyping from "./screens/SearchTyping";

const Stack = createNativeStackNavigator();
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import Schedule from "./screens/Schedule";
import TabBar from "./components/TabBar";
import HeaderTitleIcon from "./components/HeaderTitleIcon";
import Indicator from "./components/Indicator";
import LessonCard from "./components/LessonCard";
import TableSubheadings from "./components/TableSubheadings";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {View, Text, Pressable, TouchableOpacity, ScrollView, StatusBar} from "react-native";
import {GroupIdProvider} from "./components/GroupIdContext";

const App = () => {
  const [hideSplashScreen, setHideSplashScreen] = React.useState(true);

  const [fontsLoaded, error] = useFonts({
    "SFProText-Regular": require("./assets/fonts/SFProText-Regular.otf"),
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <>
      <GroupIdProvider>
        <NavigationContainer>
          <StatusBar hidden={true} />
          {hideSplashScreen ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Schedule" component={Schedule} />
              <Stack.Screen name="SearchTyping" component={SearchTyping} />
            </Stack.Navigator>
          ) : null}
        </NavigationContainer>
      </GroupIdProvider>
    </>
  );
};
export default App;
