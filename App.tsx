import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";

import SearchTyping from "./screens/SearchTyping";
import StartScreen from './screens/StartScreen';
import Schedule from "./screens/Schedule";
import Settings from "./screens/Settings";

import { GroupIdProvider } from "./components/GroupIdContext";
import { GroupProvider } from "./components/GroupContext";

const Stack = createNativeStackNavigator();

const App = () => {
  const [fontsLoaded, error] = useFonts({
    "SFProText-Regular": require("./assets/fonts/SFProText-Regular.otf"),
  });

  const [initialScreen, setInitialScreen] = useState('StartScreen');

  useEffect(() => {
    const checkInitialScreen = async () => {
      try {
        const value = await AsyncStorage.getItem('@group_name2');
        console.log(value)
        if (value !== null) {
          setInitialScreen('Schedule');
        }
      } catch (e) {
        console.error('Error reading data from AsyncStorage:', e);
      }
    };

    checkInitialScreen();
  }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
      <GroupProvider>
        <GroupIdProvider>
          <NavigationContainer>
            <StatusBar hidden={true} />
            <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="StartScreen" component={StartScreen} />
              <Stack.Screen name="Schedule" component={Schedule} />
              <Stack.Screen name="SearchTyping" component={SearchTyping} />
              <Stack.Screen name="Settings" component={Settings} />
            </Stack.Navigator>
          </NavigationContainer>
        </GroupIdProvider>
      </GroupProvider>
  );
};

export default App;
