import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View, Text, StyleSheet, ActivityIndicator  } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import axios from 'axios'; // Импорт библиотеки axios

import SearchTyping from "./screens/SearchTyping";
import StartScreen from './screens/StartScreen';
import Schedule from "./screens/Schedule";
import Settings from "./screens/Settings";
import DefaultScheduleSet from "./screens/DefaultScheduleSet";
import {GroupIdProvider} from "./components/GroupIdContext";
import {GroupProvider} from "./components/GroupContext";
import VersionError from "./screens/VersionError";

const Stack = createNativeStackNavigator();
const App = () => {

    const [fontsLoaded, error] = useFonts({
        "SFProText-Regular": require("./assets/fonts/SFProText-Regular.otf"),
    });


    if (!fontsLoaded && !error) {
        return null;
    }

    return (
        <GroupProvider>
            <GroupIdProvider>
                <NavigationContainer>
                    <StatusBar barStyle="light-content" backgroundColor="#BFBFBF" />
                    <Stack.Navigator initialRouteName={'Schedule'} screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="StartScreen" component={StartScreen} />
                        <Stack.Screen name="Schedule" component={Schedule} />
                        <Stack.Screen name="VersionError" component={VersionError} />
                        <Stack.Screen name="SearchTyping" component={SearchTyping} />
                        <Stack.Screen name="Settings" component={Settings} />
                        <Stack.Screen name="DefaultScheduleSet" component={DefaultScheduleSet} />
                    </Stack.Navigator>
                </NavigationContainer>
            </GroupIdProvider>
        </GroupProvider>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    textBox: {
        width: '80%',
        height: 150,
        borderColor: 'gray',
        borderWidth: 0.3,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    text: {
        fontSize: 12,
        color: '#000',
    },
})

export default App;