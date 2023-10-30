import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View, Text, StyleSheet  } from "react-native";
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

  const [initialScreen, setInitialScreen] = useState('StartScreen');
  const [versionError, setVersionError] = useState(false); // Состояние для ошибки версии

    useEffect(() => {
        const checkInitialScreen = async () => {
            try {
                const value = await AsyncStorage.getItem('@group_name');
                console.log(value)
                if (value !== null) {
                    setInitialScreen('Schedule');
                }
            } catch (e) {
                console.error('Error reading data from AsyncStorage:', e);
            }
        };

        checkInitialScreen();
        axios.get('http://77.91.68.83:8080/version', { timeout: 3000 }) // Устанавливаем таймаут в 3 секунды
            .then(response => {
                const serverVersion = response.data.version;
                console.log(`Parsed server version: ${serverVersion}`);
                const appVersion = 'previewBuild-1.0.0-sdj1m23hcu';
                if (serverVersion !== appVersion) {
                    console.log('Server version != app version');
                    setVersionError(true);
                } else {
                    console.log(`Version validated: ${serverVersion}`);
                    setVersionError(false);
                }
            })
            .catch(error => {
                if (error.code === 'ECONNABORTED') {
                    console.error('Request timed out. Please check your internet connection or try again.');
                } else {
                    console.error('Error checking version:', error);
                }
                setVersionError(true);
            });
    }, []);

  if (!fontsLoaded && !error) {
    return null;
  }
    const styles = StyleSheet.create({
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

    if (versionError) {
        // Выводим сообщение об ошибке версии в центре экрана
        return (
            <View style={styles.container}>
                <View style={styles.textBox}>
                    <Text style={styles.text}>
                        Временно установлен промежуточный DRM сервер. Если вы видите это сообщение,
                        включите интернет, и повторите попытку снова. Если не помогло - значит вам
                        нужно обновить приложение, в противном случае - автор ограничил распространение
                        этой версии. Билд можно получить у @Temfzx
                    </Text>
                </View>
            </View>
        );
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
              <Stack.Screen name="DefaultScheduleSet" component={DefaultScheduleSet} />
            </Stack.Navigator>
          </NavigationContainer>
        </GroupIdProvider>
      </GroupProvider>
  );
};

export default App;
