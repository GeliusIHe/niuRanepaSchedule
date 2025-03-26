import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import TabBar from "../components/TabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Color, FontFamily, Padding} from "../GlobalStyles";
import {useGroupId} from "../components/GroupIdContext";
import {useGroup} from "../components/GroupContext";
import Modal from "react-native-modal";
import {Image} from "expo-image";
import {useNavigation} from "@react-navigation/core";

type ScheduleItem = {
    date: string;
    timestart: string;
    namegroup?: string;
    timefinish: string;
    name: string;
    aydit: string;
    kf: string;
    nf: string;
    number: string;
    subject: string;
    teacher: string;
    type: string;
    xdt: string;
};

function groupByDate(lessons: ScheduleItem[]) {
    return lessons.reduce<{ [key: string]: ScheduleItem[] }>((acc, lesson) => {
        // Используем lesson.date, если дата содержится в этом поле
        (acc[lesson.date] = acc[lesson.date] || []).push(lesson);
        return acc;
    }, {});
}

function getAddressAndRoom(room: string): { address: JSX.Element; roomNumber: string; isRemote: boolean } {
    // Проверка на дистанционное обучение (СДО)
    if (room === 'СДО' || room === 'сдо') {
        return {
            address: <Text>Дистант</Text>,
            roomNumber: '',
            isRemote: true
        };
    } else if (room.startsWith('П8-')) {
        return {
            address: <Text>
                Пушкина <Text style={{fontWeight: 'bold'}}>8</Text>
            </Text>,
            roomNumber: room.replace('П8-', ''),
            isRemote: false
        };
    } else if (room.startsWith('СО')) {
        return {
            address: <Text>
                Пушкина <Text style={{fontWeight: 'bold'}}>10</Text>
            </Text>,
            roomNumber: room.replace('СО ', ''),
            isRemote: false
        };
    } else {
        return {
            address: <Text>Не распознано</Text>,
            roomNumber: room,
            isRemote: false
        };
    }
}

interface ScheduleProps {
    groupIdProp: string | null;
    groupName?: string;
}
const Schedule: React.FC<ScheduleProps> = ({ groupIdProp, groupName }) => {
    const { groupId: groupIdFromHook } = useGroupId();

    const actualGroupId = groupIdProp !== null ? groupIdProp : groupIdFromHook;
    const [loadMoreButtonPosition, setLoadMoreButtonPosition] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [startDate, setStartDate] = useState(new Date());

    const scrollViewRef = React.useRef<ScrollView>(null);
    const [isFetchingMore, setIsFetchingMore] = React.useState(false);
    const [endDate, setEndDate] = React.useState(addDays(new Date(), 7));
    const intervalIdRef = useRef<number | null>(null);
    const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
    const [data, setData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const groupedScheduleData = groupByDate(scheduleData);
    const [modalVisible, setModalVisible] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string>('');
    const [stableSchedule, setStableSchedule] = useState<ScheduleItem[]>([]);
    const [error, setError] = useState(null);
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');

    // Track whether we have other cached schedules
    const [hasOtherCachedSchedules, setHasOtherCachedSchedules] = useState(false);
    const [errorMessage, setErrorMessage] = useState("Не удалось извлечь новые данные с сервера");

    // Объект для хранения позиций дат в скролле
    const [datePositions, setDatePositions] = useState<{[key: string]: number}>({});

    function formatHumanReadableDate(dateString: string): string {
        const date = parseDate(dateString);

        if (!date || isNaN(date.getTime())) return "Invalid Date"; // Проверка на корректность даты и на null

        const daysOfWeek = ["ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"];
        const months = ["ЯНВАРЯ", "ФЕВРАЛЯ", "МАРТА", "АПРЕЛЯ", "МАЯ", "ИЮНЯ", "ИЮЛЯ", "АВГУСТА", "СЕНТЯБРЯ", "ОКТЯБРЯ", "НОЯБРЯ", "ДЕКАБРЯ"];

        const dayOfWeek = daysOfWeek[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];

        return `${dayOfWeek}, ${day} ${month}`;
    }


    function parseDate(dateString: string) {
        // Заменяем точки на дефисы и создаем новый объект Date
        const date = new Date(dateString.split('.').reverse().join('-'));

        if (isNaN(date.getTime())) {
            console.error(`Invalid date: ${dateString}`);
            return null;
        }

        return date;
    }

    // Utility function for generating consistent cache keys
    function getCacheKey(groupIdentifier: string | null): string {
        return `scheduleData_${groupIdentifier || ''}`;
    }

    type Lesson = {
        date: string;
        timestart: string;
        timefinish: string;
        name: string;
        aydit: string;

        kf: string;
        nf: string;
        number: string;
        subject: string;
        teacher: string;
        type: string;
        xdt: string;
    };

    function filterScheduleBySubject(subject: string, schedule: Lesson[]): Lesson[] {
        // Сначала найдем все уникальные даты, когда есть урок по выбранному предмету
        const subjectDates = schedule
            .filter(lesson => lesson.name.includes(subject))
            .map(lesson => lesson.date);

        // Теперь вернем все уроки, которые проводятся в эти даты
        return schedule.filter(lesson => subjectDates.includes(lesson.date));
    }

    function filterPhysicalEducationLessons(scheduleData: any[]) {
        let isPhysicalEducationFound = false;

        return scheduleData.filter((lesson) => {
            if (lesson.name.includes("Физическая культура")) {
                if (isPhysicalEducationFound) {
                    return false;
                }
                isPhysicalEducationFound = true;
            }
            return true;
        });
    }


    async function loadMoreData() {
        setIsFetchingMore(true);

        const timeoutId = setTimeout(() => {
            setShowNotification(true);
        }, 5000);

        try {
            const value = await AsyncStorage.getItem('@group_name');
            const daysMarginString = await AsyncStorage.getItem('@daysMargin');
            const daysMargin = daysMarginString ? parseInt(daysMarginString, 10) - 2 : 13;
            const actualGroupName = groupName || value || null;
            const startDateForNextFetch = addDays(endDate, 2);
            const newEndDate = addDays(startDateForNextFetch, daysMargin);
            setEndDate(newEndDate);
            const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${formatDate(startDateForNextFetch)}&dfinish=${formatDate(newEndDate)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            clearTimeout(timeoutId);
            
            let newData = await response.json();
            
            if (!newData) {
                throw new Error(`Invalid response data`);
            }
            
            const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';
            
            if (newData[resultKey] && newData[resultKey].RaspItem) {
                const flatNewData = [].concat(...newData[resultKey].RaspItem);
                const filteredScheduleData = filterPhysicalEducationLessons(flatNewData);
                
                // Update the state with the combined data
                setScheduleData(prevData => {
                    const combinedData = [...prevData, ...filterScheduleBySubject(subjectName, filteredScheduleData)];
                    
                    // Update the cache with the combined data
                    try {
                        const cacheKey = getCacheKey(actualGroupName);
                        AsyncStorage.setItem(cacheKey, JSON.stringify(combinedData))
                            .catch(error => console.error('Error updating cache with combined data:', error));
                    } catch (error) {
                        console.error('Error preparing cache update:', error);
                    }
                    
                    return combinedData;
                });
                
                setTimeout(() => {
                    if (scrollViewRef.current && scrollViewRef.current.scrollTo) {
                        scrollViewRef.current.scrollTo({ x: 0, y: loadMoreButtonPosition, animated: true });
                    }
                }, 100);
            } else {
                console.error(`Unexpected data structure in loadMoreData response`);
            }
        } catch (error) {
            console.error('Error fetching more schedule:', error);
            // Try fallback to what we already have in cache
            const actualGroupName = groupName || await AsyncStorage.getItem('@group_name') || null;
            if (actualGroupName) {
                const hasCachedData = await hasCachedSchedule(actualGroupName);
                if (hasCachedData) {
                    // We already have data from cache, just show what we have
                    clearTimeout(timeoutId);
                    console.log(`Using cached data for ${actualGroupName} due to fetch error`);
                } else {
                    const cachedSchedules = await getCachedScheduleKeys();
                    if (cachedSchedules.length > 0) {
                        console.log('No cache for this group, but other groups have cached data');
                    }
                    setShowNotification(true);
                }
            } else {
                setShowNotification(true);
            }
        } finally {
            setIsFetchingMore(false);
        }
    }

    const findSuggestion = (input: any) => {
        const matchedSubject = subjectNames.find(name => name.toLowerCase().startsWith(input.toLowerCase()));
        return matchedSubject || '';
    };

    const [subjectNames, setSubjectNames] = useState<string[]>([]);

    useEffect(() => {
        if (subjectName) {
            setSuggestion(findSuggestion(subjectName));
        }
    }, [subjectName, subjectNames]);

    useEffect(() => {
        console.log(`Stable schedule changing. : ${stableSchedule}`)
        const uniqueNames = [...new Set(stableSchedule.map(item => {
            return item.name.split('(')[0].trim();
        }))];
        setSubjectNames(uniqueNames);
    }, [stableSchedule]); // Обновляем subjectNames при изменении stableSchedule

    useEffect(() => {
        if (stableSchedule.length > 0) {
            setScheduleData(filterScheduleBySubject(subjectName, stableSchedule));
            console.log(subjectName, stableSchedule);
            setModalVisible(false);
        }
    }, [stableSchedule]); // Этот useEffect будет вызван, когда stableSchedule обновится

    useEffect(() => {
        if (modalVisible) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [modalVisible]);

    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };
    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    const { groupNameContext, setGroupNameContext } = useGroup();
    useEffect(() => {
        async function loadCachedData() {
            try {
                if (!groupName) {
                    const cacheKey = getCacheKey(actualGroupId);
                    const cachedData = await AsyncStorage.getItem(cacheKey);
                    if (cachedData) {
                        setIsLoading(false);
                        setScheduleData(JSON.parse(cachedData));
                    }
                }
            } catch (error) {
                console.error('Error loading cached schedule:', error);
            }
        }
        loadCachedData();

    }, [actualGroupId]);

    // Function to get all cached schedule keys
    async function getCachedScheduleKeys(): Promise<string[]> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            return allKeys.filter(key => key.startsWith('scheduleData_'));
        } catch (error) {
            console.error('Error getting cached schedule keys:', error);
            return [];
        }
    }

    // Function to check if a specific group has cached data
    async function hasCachedSchedule(groupIdentifier: string | null | undefined): Promise<boolean> {
        try {
            if (groupIdentifier === undefined) return false;
            
            const cacheKey = getCacheKey(groupIdentifier);
            const cachedData = await AsyncStorage.getItem(cacheKey);
            return cachedData !== null;
        } catch (error) {
            console.error('Error checking cached schedule:', error);
            return false;
        }
    }

    // Update the fetchData function to scroll to current day
    useEffect(() => {
        let isInitialLoad = true;

        const fetchData = async () => {
            const getData = async () => {
                try {
                    const value = await AsyncStorage.getItem('@group_name');
                    if (value == null && isInitialLoad) {
                        isInitialLoad = false;
                        navigation.navigate('StartScreen' as never);
                    }
                    return value || null;
                } catch (e) {
                    console.error('Error reading data', e);
                    return null;
                }
            };

            const actualGroupName = groupName || await getData();

            if (actualGroupName !== null) {
                if (intervalIdRef.current !== null) {
                    clearInterval(intervalIdRef.current);
                    intervalIdRef.current = null; // Сбрасываем значение ref
                }
                console.log(`Загружено расписание ${actualGroupName}`);
                setData((actualGroupName || "").split(" ")[0] || null);
                const daysMarginString = await AsyncStorage.getItem('@daysMargin');
                const daysMargin = daysMarginString ? parseInt(daysMarginString, 10) : 7;
                const currentDate = new Date();
                setStartDate(currentDate); // Инициализируем startDate текущей датой при первой загрузке
                const startDateStr = formatDate(currentDate);
                const endDate = formatDate(addDays(currentDate, daysMargin));
                const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${startDateStr}&dfinish=${endDate}`;

                try {
                    // First check if we have cached data for this group
                    const cacheKey = getCacheKey(actualGroupName);
                    const cachedData = await AsyncStorage.getItem(cacheKey);
                    let loadedFromCache = false;
                    
                    // If we have cached data, use it immediately to show something to the user
                    if (cachedData) {
                        try {
                            const data = JSON.parse(cachedData);
                            const filteredScheduleData = filterPhysicalEducationLessons(data);
                            setScheduleData(filterScheduleBySubject('', filteredScheduleData));
                            console.log(`Loaded initial schedule for ${actualGroupName} from cache`);
                            loadedFromCache = true;
                            
                            // Set loading to false since we've loaded cache data
                            setIsLoading(false);
                            
                            // But mark as refreshing to indicate we're getting fresh data
                            setIsRefreshing(true);
                        } catch (cacheParseError) {
                            console.error("Error parsing cached data:", cacheParseError);
                            // Continue with network request if cache parsing fails
                        }
                    }
                    
                    // Still make the network request to get the latest data
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    let data = await response.json();
                    const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';

                    if (data[resultKey] && data[resultKey].RaspItem) {
                        const filteredScheduleData = filterPhysicalEducationLessons(data[resultKey].RaspItem);
                        console.log(filteredScheduleData)
                        setScheduleData(filterScheduleBySubject('', filteredScheduleData));
                        try {
                            // Cache using group-specific key
                            const cacheKey = getCacheKey(actualGroupName);
                            await AsyncStorage.setItem(cacheKey, JSON.stringify(data[resultKey].RaspItem));
                            
                            // After data is loaded, scroll to today's schedule
                            setTimeout(() => {
                                scrollToCurrentDay();
                            }, 500);
                        } catch (error) {
                            console.error('Error caching schedule data:', error);
                        }
                    } else {
                        console.error("Unexpected data structure");
                    }
                } catch (error) {
                    console.error("An error occurred while fetching data:", error);
                    // Try to load from cache if server is unreachable
                    try {
                        const cacheKey = getCacheKey(actualGroupName);
                        const cachedData = await AsyncStorage.getItem(cacheKey);
                        if (cachedData) {
                            const data = JSON.parse(cachedData);
                            const filteredScheduleData = filterPhysicalEducationLessons(data);
                            setScheduleData(filterScheduleBySubject('', filteredScheduleData));
                            console.log(`Loaded schedule for ${actualGroupName} from cache`);
                            
                            // After cache data is loaded, scroll to today's schedule
                            setTimeout(() => {
                                scrollToCurrentDay();
                            }, 500);
                        } else {
                            // No cache available for this specific group
                            // Check if we have ANY cached schedules
                            const cachedKeys = await getCachedScheduleKeys();
                            if (cachedKeys.length > 0) {
                                console.log(`No cache for ${actualGroupName}, but found cached data for other groups.`);
                                // We have other cached schedules, but not for this group
                                // Show notification that THIS group's schedule is unavailable, but others may be available
                                setTimeout(() => {
                                    setShowNotification(true);
                                }, 5000);
                            } else {
                                // No cache available at all
                                setTimeout(() => {
                                    setShowNotification(true);
                                }, 5000);
                            }
                        }
                    } catch (cacheError) {
                        console.error("Error retrieving from cache:", cacheError);
                        setTimeout(() => {
                            setShowNotification(true);
                        }, 5000);
                    }
                } finally {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        }
        intervalIdRef.current = setInterval(fetchData, 2500) as unknown as number;

        fetchData();

        return () => {
            if (intervalIdRef.current !== null) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, [actualGroupId, groupNameContext]);

    // Add function to scroll to current day's schedule
    const scrollToCurrentDay = () => {
        const today = formatDate(new Date());
        
        // Find closest date position to today
        const dateKeys = Object.keys(datePositions).sort((a, b) => {
            const dateA = parseDate(a);
            const dateB = parseDate(b);
            if (dateA && dateB) {
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });
        
        // Try to find today's date
        let targetDate = today;
        let targetPosition = datePositions[targetDate];
        
        // If today's date is not found, find the closest date
        if (!targetPosition) {
            const todayTimestamp = new Date(today.split('.').reverse().join('-')).getTime();
            
            // Find closest date to today
            let closestDate = '';
            let minDiff = Number.MAX_SAFE_INTEGER;
            
            for (const date of dateKeys) {
                const parsedDate = parseDate(date);
                if (parsedDate) {
                    const diff = Math.abs(parsedDate.getTime() - todayTimestamp);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestDate = date;
                    }
                }
            }
            
            if (closestDate) {
                targetPosition = datePositions[closestDate];
            }
        }
        
        // Scroll to the position if found
        if (targetPosition && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ 
                x: 0, 
                y: targetPosition, 
                animated: true 
            });
        }
    };

    // Функция для загрузки данных за предыдущую неделю
    async function loadPreviousWeekData() {
        setIsFetchingMore(true);
        
        const timeoutId = setTimeout(() => {
            setShowNotification(true);
        }, 5000);
        
        try {
            const value = await AsyncStorage.getItem('@group_name');
            const daysMarginString = await AsyncStorage.getItem('@daysMargin');
            const daysMargin = daysMarginString ? parseInt(daysMarginString, 10) - 2 : 13;
            const actualGroupName = groupName || value || null;
            
            // Вычисляем новую начальную дату (на 7 дней назад от текущей startDate)
            const newStartDate = addDays(startDate, -7);
            const newEndDate = addDays(startDate, -1); // До дня перед текущей начальной датой
            
            // Запоминаем дату, к которой нужно будет прокрутить (последний день новой загрузки)
            const targetDateStr = formatDate(newEndDate);
            
            // Обновляем состояние начальной даты
            setStartDate(newStartDate);
            
            const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${formatDate(newStartDate)}&dfinish=${formatDate(newEndDate)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            clearTimeout(timeoutId);
            
            let newData = await response.json();
            
            if (!newData) {
                throw new Error(`Invalid response data`);
            }
            
            const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';
            
            if (newData[resultKey] && newData[resultKey].RaspItem) {
                const flatNewData = [].concat(...newData[resultKey].RaspItem);
                const filteredScheduleData = filterPhysicalEducationLessons(flatNewData);
                
                // Обновляем состояние, добавляя новые данные в начало списка
                setScheduleData(prevData => {
                    const combinedData = [...filterScheduleBySubject(subjectName, filteredScheduleData), ...prevData];
                    
                    // Обновляем кеш с объединенными данными
                    try {
                        const cacheKey = getCacheKey(actualGroupName);
                        AsyncStorage.setItem(cacheKey, JSON.stringify(combinedData))
                            .catch(error => console.error('Error updating cache with combined data:', error));
                    } catch (error) {
                        console.error('Error preparing cache update:', error);
                    }
                    
                    return combinedData;
                });

                // Даем время отрендерить новые данные, а затем скроллим к нужной дате
                setTimeout(() => {
                    // Ищем позицию для последнего дня загруженной недели (день перед текущей начальной датой)
                    // Это позволит нам плавно перенести пользователя на предыдущий день перед тем, что он видел
                    
                    // Попытка найти день, который был последним в новой загрузке (ближайший к предыдущей startDate)
                    const targetDate = targetDateStr;
                    let targetPosition = datePositions[targetDate];
                    
                    // Если точно такой даты нет, ищем ближайшую
                    if (!targetPosition) {
                        // Сортируем даты
                        const dateKeys = Object.keys(datePositions).sort((a, b) => {
                            const dateA = parseDate(a);
                            const dateB = parseDate(b);
                            if (dateA && dateB) {
                                return dateA.getTime() - dateB.getTime();
                            }
                            return 0;
                        });
                        
                        // Преобразуем целевую дату в timestamp для сравнения
                        const targetTimestamp = parseDate(targetDate)?.getTime() || 0;
                        
                        // Ищем ближайшую дату к целевой
                        let closestDate = '';
                        let minDiff = Number.MAX_SAFE_INTEGER;
                        
                        for (const date of dateKeys) {
                            const parsedDate = parseDate(date);
                            if (parsedDate) {
                                const diff = Math.abs(parsedDate.getTime() - targetTimestamp);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestDate = date;
                                }
                            }
                        }
                        
                        if (closestDate) {
                            targetPosition = datePositions[closestDate];
                        }
                    }
                    
                    // Если нашли позицию, скроллим к ней
                    if (targetPosition && scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ 
                            x: 0, 
                            y: targetPosition, 
                            animated: true 
                        });
                    } else {
                        // Если позицию не нашли по какой-то причине, просто скроллим в начало
                        if (scrollViewRef.current) {
                            scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
                        }
                    }
                }, 300); // Даем больше времени для рендеринга
            } else {
                console.error(`Unexpected data structure in loadPreviousWeekData response`);
            }
        } catch (error) {
            console.error('Error fetching previous week schedule:', error);
        } finally {
            setIsFetchingMore(false);
        }
    }

    // Check for cached schedules on mount
    useEffect(() => {
        async function checkCachedSchedules() {
            const cachedKeys = await getCachedScheduleKeys();
            setHasOtherCachedSchedules(cachedKeys.length > 0);
        }
        
        checkCachedSchedules();
    }, []);

    // Update error notification when showing
    useEffect(() => {
        if (showNotification) {
            const checkAndUpdateError = async () => {
                const cachedKeys = await getCachedScheduleKeys();
                const currentGroupHasCache = await hasCachedSchedule(actualGroupId || groupName);
                
                if (!currentGroupHasCache && cachedKeys.length > 0) {
                    setErrorMessage("Нет данных для этой группы. Попробуйте другую группу - для некоторых групп могут быть доступны кэшированные данные.");
                    setHasOtherCachedSchedules(true);
                } else {
                    setErrorMessage("Не удалось извлечь новые данные с сервера");
                }
            };
            
            checkAndUpdateError();
        }
    }, [showNotification, actualGroupId, groupName]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    function extractLessonType(lessonName: string = " ", nameGroup: string = ""): string | undefined {
        const lessonTypeMatch = lessonName.match(/\((.*?)\)/);
        let lessonType = lessonTypeMatch && lessonTypeMatch[1] ? lessonTypeMatch[1] : undefined;

        if (lessonType) {
            if (lessonType.includes("Практ.") || lessonType.includes("семин.")) {
                lessonType = "Практика";
            } else if (lessonType.toLowerCase().includes("лабораторная работа")) {
                const groupNumber = nameGroup.match(/\d+/);
                if (groupNumber) {
                    lessonType = `Лабораторная работа (Группа ${groupNumber[0]})`;
                } else {
                    lessonType = "Лабораторная работа";
                }
            } else {
                lessonType = lessonType.charAt(0).toUpperCase() + lessonType.slice(1).toLowerCase();
            }
            return lessonType;
        } else {
            return undefined;
        }
    }

    const handleButtonPress = () => {
        setEndDate(addDays(new Date(), 7));
        if (stableSchedule.length === 0) {
            console.log(`Default schedule : ${scheduleData}`)
            setStableSchedule(scheduleData);
            console.log(`Set stable schedule: ${stableSchedule}`)
        }

        // Используем stableSchedule вместо scheduleData
        setScheduleData(filterScheduleBySubject(subjectName, stableSchedule));
        console.log(subjectName, stableSchedule)
        setModalVisible(false)
    };


    function isGroup(groupName: any) {
        // Регулярное выражение для поиска чисел в строке
        const hasNumbers = /\d/;

        // Проверка, содержит ли groupName числа
        return hasNumbers.test(groupName);
    }

    function processLessonName(lessonName: string): { teacher: string, lessonInfo: string } {
        // Разделяем строку по '<br />', чтобы отделить информацию об уроке от имени преподавателя
        const splitLessonName = lessonName.split('<br />');

        // Убираем все символы, начиная с первой открывающей скобки
        let lessonInfo = splitLessonName[0].split('(')[0].trim();

        // Получаем имя преподавателя или используем заполнитель, если имя отсутствует
        const teacher = splitLessonName.length > 1 ? splitLessonName[1].trim() : "";

        return {
            teacher,
            lessonInfo
        };
    }

    return (
        <View style={styles.schedule}>
            {/* Refreshing indicator */}
            {isRefreshing && (
                <View style={styles.refreshingContainer}>
                    <ActivityIndicator size="small" color="#0000ff" />
                    <Text style={styles.refreshingText}>Обновление данных...</Text>
                </View>
            )}
            
            <View style={[styles.headertitleicon, styles.headerTitleIconStyle]}>
                <View style={[styles.leftAccessory, styles.accessoryFlexBox]}>
                    <Image
                        style={styles.backIcon}
                        contentFit="cover"
                        source={require("../assets/back-icon.png")}
                    />
                    <Text style={[styles.leftTitle, styles.textTypo]}>Расписание</Text>
                </View>
                <View style={[styles.title, styles.accessoryFlexBox]}>
                    {data === "loading" ? (
                        <ActivityIndicator size="small" color="#0000ff" />
                    ) : (
                        <Text style={[styles.text, styles.textTypo]}>{data}</Text>
                    )}
                </View>
                <View style={[styles.rightAccessory, styles.accessoryFlexBox]}>
                    <View style={[styles.iconsleft, styles.accessoryFlexBox]}>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Image
                                style={styles.badgecalendarIcon}
                                contentFit="cover"
                                source={require("../assets/badgecalendar.png")}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <ScrollView
                ref={scrollViewRef}
                style={{
                    marginTop: groupName ? 0 : 66, // Устанавливаем marginTop в зависимости от наличия groupName
                    marginBottom: 75
                }}        
            >
                <>
                    {showNotification && (
                        <View style={{ backgroundColor: 'red', padding: 10, alignItems: 'center' }}>
                            <Text style={{ color: 'white', textAlign: 'center' }}>{errorMessage}</Text>
                            {hasOtherCachedSchedules && (
                                <Text style={{ color: 'white', fontSize: 12, marginTop: 5, textAlign: 'center' }}>
                                    Используйте поиск для доступа к другим группам с кэшированными данными
                                </Text>
                            )}
                        </View>
                    )}
                </>
                {!groupName ? null : (
                    <View style={{ height: 95, backgroundColor: 'white', paddingLeft: 20, paddingTop: 20 }}>
                        <Text style={[{ marginTop: -10, color: '#007AFF', fontWeight: '800' }, styles.textTypoSearch]}>{isGroup(groupName) ? 'Группа' : 'Преподаватель'}</Text>
                        <Text style={[{ marginTop: 0, fontWeight: 'bold' }, styles.textTypoSearch]}>{groupName}</Text>
                        <Text style={[{ marginTop: 0, color: '#8E8E93' }, styles.textTypoSearch]}>{isGroup(groupName) ? 'Информация о группе' : 'Информация о преподавателе'}</Text>
                    </View>
                )}
                
                {/* Кнопка для загрузки расписания за прошлую неделю */}
                <TouchableOpacity
                    style={{ 
                        backgroundColor: '#007AFF', 
                        padding: 10, 
                        borderRadius: 8, 
                        marginHorizontal: 20,
                        marginVertical: 10,
                        alignItems: 'center',
                    }}
                    onPress={loadPreviousWeekData}
                    disabled={isFetchingMore}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        {isFetchingMore ? 'Загрузка...' : 'Расписание прошлой недели'}
                    </Text>
                </TouchableOpacity>
                
                {Object.entries(groupedScheduleData).length > 0 ? (
                    Object.entries(groupedScheduleData)
                        .sort(([dateA], [dateB]) => {
                            // Сортировка дат
                            const parsedDateA = parseDate(dateA);
                            const parsedDateB = parseDate(dateB);
                            if (parsedDateA && parsedDateB) {
                                return parsedDateA.getTime() - parsedDateB.getTime();
                            }
                            return 0;
                        })
                        .map(([date, lessonsForTheDay], index) => (
                        <React.Fragment key={index}>
                            <View 
                                onLayout={(event) => {
                                    // Запоминаем позицию каждой даты в скролле
                                    const layout = event.nativeEvent.layout;
                                    setDatePositions(prev => ({
                                        ...prev,
                                        [date]: layout.y
                                    }));
                                }}
                            >
                                <TableSubheadings noteTitle={formatHumanReadableDate(date)} />
                            </View>

                            {/* Выводим уроки за день */}
                            {lessonsForTheDay.map((lesson, lessonIndex) => {
                                // Трансформируем данные урока перед их использованием
                                const roomInfo = getAddressAndRoom(lesson.aydit);
                                return (
                                    <LessonCard
                                        key={lessonIndex}
                                        prop={lesson.timestart}
                                        prop1={lesson.timefinish}
                                        prop2={extractLessonType(lesson.name, lesson.namegroup)}
                                        preMedi={processLessonName(lesson.name).lessonInfo}
                                        teacherName={lesson.teacher !== "П " ? processLessonName(lesson.name).teacher ? processLessonName(lesson.name).teacher : "Преподаватель не указан" : "П "}
                                        prop3={
                                            (() => {
                                                if (roomInfo.isRemote) {
                                                    return <Text>{roomInfo.address}</Text>;
                                                } else {
                                                    return (
                                                        <Text>
                                                            Аудитория <Text style={{fontWeight: 'bold'}}>{roomInfo.roomNumber}</Text>, {roomInfo.address}
                                                        </Text>
                                                    );
                                                }
                                            })()
                                        }
                                        showBg={false}
                                        showBg1={false}
                                        subjectName={subjectName}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>
                            Расписания за указанный период не найдено.
                        </Text>
                    </View>
                )}
                
                {Object.entries(groupedScheduleData).length > 0 && (
                    <View
                        onLayout={(event) => {
                            const layout = event.nativeEvent.layout;
                            setLoadMoreButtonPosition(layout.y);
                        }}
                    >
                        {!showNotification && <TouchableOpacity
                            onPress={loadMoreData}
                            disabled={isFetchingMore}
                            style={styles.button}
                        >
                            <View style={styles.buttoncontainer}>
                                {isFetchingMore
                                    ? <ActivityIndicator color="white"/>
                                    : <Text style={styles.buttontext}>ЗАГРУЗИТЬ ЕЩЕ</Text>
                                }
                            </View>
                        </TouchableOpacity>}
                    </View>
                )}
            </ScrollView>
            <TabBar
                imageDimensions={require("../assets/briefcaseGray.png")}
                tabBarPosition="absolute"
                tabBarTop={734}
                tabBarLeft={0}
                textColor="#007aff"
                tabBarWidth={400}
                tabBarHeight={75}
            />
            <Modal
                isVisible={modalVisible}
                onSwipeComplete={() => setModalVisible(false)}
                swipeDirection={['down']}
                style={styles.modal}
                onBackdropPress={() => setModalVisible(false)} // закрыть модальное окно при нажатии вне его
            >
                <View style={styles.headerBar}></View>
                <View style={styles.modalContent}>
                    <Text style={styles.headerText}>Установка фильтра</Text>
                    <Text style={styles.instructionText}>
                        Можете установить фильтр по отображаемым предметам, выбрать диапазон показа расписания
                    </Text>
                    {error && <Text style={{color: 'red'}}>{error}</Text>}

                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            onChangeText={(text) => {
                                setSubjectName(text);
                            }}
                            value={subjectName}
                            placeholder={subjectName.length === 0 ? 'Название предмета' : ''}
                        />

                        <TouchableOpacity onPress={() => setSubjectName('')}>
                            <Image
                                style={styles.sfSymbolXmarkcirclefill}
                                source={require("../assets/sf-symbol--xmarkcirclefill.png")}
                            />
                        </TouchableOpacity>
                    </View>


                    <TouchableOpacity
                        style={styles.closeButton}
                        disabled={loading}
                        onPress={handleButtonPress}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : (
                            <Text style={styles.textStyle}>Установить</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  sfSymbolXmarkcirclefill: {
    width: 20,
    height: 20,
    marginLeft: -45,
    marginTop: 10,
  },
  headerTitleIconStyle: {
    position: "absolute",
    marginLeft: -187.5,
    top: 15,
    left: '50%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    marginTop: 30,
    flex: 1,
  },
  accessoryFlexBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  textTypo: {
    fontFamily: FontFamily.tabBarMedium,
    lineHeight: 24,
    letterSpacing: 0,
    fontSize: 18,
  },
  textTypoSearch: {
    fontFamily: FontFamily.tabBarMedium,
    lineHeight: 24,
    letterSpacing: 0,
    fontSize: 14,
  },
  backIcon: {
    width: 18,
    height: 24,
  },
  leftTitle: {
    flex: 1,
    color: Color.lightGraphicsBlue,
    textAlign: "left",
    display: "flex",
    height: 23,
    marginLeft: 5,
    overflow: "hidden",
    alignItems: "center",
  },
  leftAccessory: {
    left: 0,
    width: 136,
    paddingLeft: Padding.p_6xs,
    paddingTop: Padding.p_4xs,
    paddingRight: Padding.p_4xs,
    paddingBottom: Padding.p_4xs,
    display: "none",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  text: {
    fontWeight: "600",
    color: Color.lightLabelPrimary,
    textAlign: "center",
  },
  title: {
    marginLeft: -66.5,
    left: "50%",
    width: 133,
    justifyContent: "center",
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  badgecalendarIcon: {
    width: 26,
    height: 26,
    overflow: "hidden",
  },
  iconsleft: {
    alignItems: "center",
  },
  rightAccessory: {
    right: 0,
    justifyContent: "flex-end",
    paddingLeft: Padding.p_5xs,
    paddingTop: Padding.p_5xs,
    paddingRight: Padding.p_base,
    paddingBottom: Padding.p_5xs,
    alignItems: "center",
    top: "50%",
    marginTop: -21,
    position: "absolute",
    flexDirection: "row",
    height: 42,
  },
  headertitleicon: {
    backgroundColor: Color.lightBackgroundQuaternary,
    borderStyle: "solid",
    borderColor: Color.colorDarkslategray_100,
    borderBottomWidth: 0.5,
    width: 375,
    height: 42,
  },
  input: {
    paddingLeft: 15,
    borderWidth: 0.3, // Толщина черной полоски
    borderRadius: 20,
    height: 55,
    borderColor: 'gray',
    width: '100%',
    marginTop: 10,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerBar: {
    backgroundColor: '#F8F8F8',
    height: 60,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.02, // Толщина черной полоски
    borderBottomColor: 'black',
  },
  headerText: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: 'center',
  },
  instructionText: {
    color: "gray",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    height: 50,
    width: '70%',
    padding: 10,
    marginTop: 40,
    justifyContent: 'center',
    alignSelf: 'center', // выравнивание по центру горизонтали
  },
  textStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2296f3',
    padding: 10,
  },
  buttoncontainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttontext: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  schedule: {
    backgroundColor: Color.lightBackgroundQuaternary,
    flex: 1,
    width: "100%",
    height: 812,
  },
  refreshingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  refreshingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0000ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Schedule;