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
import store from './store';
import { Provider } from 'react-redux';

const Stack = createNativeStackNavigator();

const App = () => {
  const [fontsLoaded, error] = useFonts({
    "SFProText-Regular": require("./assets/fonts/SFProText-Regular.otf"),
  });

  const [initialScreen, setInitialScreen] = useState('StartScreen');
  const [versionError, setVersionError] = useState(false); // Состояние для ошибки версии
  const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const loadData = async () => {
            try {
                const groupPromise = AsyncStorage.getItem('@group_name');
                const versionPromise = axios.get('http://77.91.68.83:8080/version', { timeout: 3000 });

                const [group, versionResponse] = await Promise.all([groupPromise, versionPromise]);

                if (group !== null) {
                    console.log(group);
                    setInitialScreen('Schedule');
                }

                const serverVersion = versionResponse.data.version;
                const appVersion = 'previewBuild-1.0.0-sdj1m23hcu';
                setVersionError(serverVersion !== appVersion);

            } catch (error) {
                console.error('Error loading data:', error);
                setVersionError(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);


    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        if (isLoading) {
            const loaderTimeout = setTimeout(() => {
                setShowLoader(true);
            }, 65);

            return () => clearTimeout(loaderTimeout); // Очищаем таймер, если компонент размонтирован
        }

        setShowLoader(false); // Скрываем загрузчик, если загрузка завершена
    }, [isLoading]);

    if (showLoader) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

  if (!fontsLoaded && !error) {
    return null;
  }

    if (versionError) {
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
          <Provider store={store}>
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
          </Provider>
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
