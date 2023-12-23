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

const Stack = createNativeStackNavigator();

const App = () => {
  const [fontsLoaded, error] = useFonts({
    "SFProText-Regular": require("./assets/fonts/SFProText-Regular.otf"),
  });

    const [versionErrorState, setVersionErrorState] = useState("");
    useEffect(() => {
        const loadData = async () => {
            try {

                // Отправка версии приложения на сервер
                const appVersion = 'preRelease-1.0.0-122323';
                const response = await axios.get(`https://api.geliusihe.ru/getData/${appVersion}`, { timeout: 3000 });

                // Проверка access и установка состояния ошибки версии
                if (response.data.access === 0) {
                    setVersionErrorState(`${response.data.comment}`);
                }
                await AsyncStorage.setItem('failedAttempts', '0');
            } catch (error) {
                console.error('Error loading data:', error);

                // Чтение счётчика неудачных попыток
                const failedAttempts = await AsyncStorage.getItem('failedAttempts') || '0';
                const attempts = parseInt(failedAttempts, 10);

                if (attempts < 3) {
                    // Увеличение счётчика при неудачной попытке
                    await AsyncStorage.setItem('failedAttempts', (attempts + 1).toString());
                } else {
                    // Установка ошибки если число попыток достигло 3
                    setVersionErrorState("Не удалось проверить подлинность приложения множество раз.");
                }
            }
        };
        loadData();
    }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

    if (versionErrorState != "") {
        return (
            <View style={styles.container}>
                <View style={styles.textBox}>
                    <Text style={styles.text}>{versionErrorState}</Text>
                </View>
            </View>
        );
    }

  return (
      <GroupProvider>
          <GroupIdProvider>
              <NavigationContainer>
                  <StatusBar hidden={true} />
                  <Stack.Navigator initialRouteName={'Schedule'} screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="StartScreen" component={StartScreen} />
                      <Stack.Screen name="Schedule" component={Schedule} />
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
