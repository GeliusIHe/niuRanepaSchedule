import * as React from "react";
import {useEffect, useState} from "react";
import {ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import HeaderTitleIcon from "../components/HeaderTitleIcon";
import TabBar from "../components/TabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Color, FontFamily, FontSize} from "../GlobalStyles";
import {useGroupId} from "../components/GroupIdContext";
import {useGroup} from "../components/GroupContext";

type ScheduleItem = {
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

function groupByDate(lessons: ScheduleItem[]) {
  return lessons.reduce<{ [key: string]: ScheduleItem[] }>((acc, lesson) => {
    // Используем lesson.date, если дата содержится в этом поле
    (acc[lesson.date] = acc[lesson.date] || []).push(lesson);
    return acc;
  }, {});
}

function getAddressAndRoom(room: string): { address: string, roomNumber: string } {
  if (room.startsWith('П8-')) {
    return {
      address: 'Пушкина 8',
      roomNumber: room.replace('П8-', ''),
    };
  } else if (room.startsWith('СО')) {
    return {
      address: 'Пушкина 10',
      roomNumber: room.replace('СО ', ''),
    };
  } else {
    // Если формат комнаты не соответствует вышеуказанным, возвращаем исходное значение
    return {
      address: '',
      roomNumber: room,
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

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [endDate, setEndDate] = React.useState(addDays(new Date(), 7));

  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const groupedScheduleData = groupByDate(scheduleData);

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
      console.log('notif')
    }, 5000); // задаем тайм-аут, как в fetchData

    try {
      const value = await AsyncStorage.getItem('@group_name');
      const actualGroupName = groupName || value || null;
      const startDateForNextFetch = addDays(endDate, 1);
      const newEndDate = addDays(startDateForNextFetch, 6);
      setEndDate(newEndDate);
      const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${formatDate(startDateForNextFetch)}&dfinish=${formatDate(newEndDate)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      clearTimeout(timeoutId); // Очистка тайм-аута, так как данные были успешно получены

      let newData = await response.json();
      console.log(newData)
      const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';
      if (newData[resultKey] && newData[resultKey].RaspItem) {
        // Если RaspItem является массивом массивов, сделайте его "плоским"
        const flatNewData = [].concat(...newData[resultKey].RaspItem);
        setScheduleData(prevData => [...prevData, ...flatNewData]);
      } else {
        console.error("Unexpected data structure");
      }
      setTimeout(() => {
        if (scrollViewRef.current && scrollViewRef.current.scrollTo) {
          scrollViewRef.current.scrollTo({ x: 0, y: loadMoreButtonPosition, animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching more schedule:', error);
      setShowNotification(true);
      clearTimeout(timeoutId); // Очистка тайм-аута, так как произошла ошибка
    } finally {
      setIsFetchingMore(false);
    }
  }

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
        if (!groupName) { // Если groupName пуст, значит поиск не используется
          const cachedData = await AsyncStorage.getItem('scheduleData');
          if (cachedData) {
            setScheduleData(JSON.parse(cachedData));
            setIsLoading(false); // скрыть индикатор загрузки после загрузки кешированных данных
          }
        }
      } catch (error) {
        console.error('Error loading cached schedule:', error);
      }
    }
    loadCachedData(); // сначала загружаем кешированные данные

  }, [actualGroupId]);
// Кастомный хук для отслеживания изменений в AsyncStorage
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      const timeoutId = setTimeout(() => {
        setShowNotification(true);
        console.log('notif')
      }, 5000);

      const getData = async () => {
        try {
          const value = await AsyncStorage.getItem('@group_name');
          return value || null;
        } catch (e) {
          console.error('Error reading data', e);
          return null;
        }
      };

      const actualGroupName = groupName || await getData();
      console.log(`Загружено расписание ${actualGroupName}`);
      setData((actualGroupName || "").split(" ")[0] || null);

      const startDate = formatDate(new Date());
      const endDate = formatDate(addDays(new Date(), 7));
      const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${startDate}&dfinish=${endDate}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();

        // Очистка тайм-аута, так как данные были успешно получены
        clearTimeout(timeoutId);

        // Убедитесь, что ключ resultKey существует в ответе от сервера
        const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';

        if(data[resultKey] && data[resultKey].RaspItem) {
          const filteredScheduleData = filterPhysicalEducationLessons(data[resultKey].RaspItem);
          setScheduleData(filteredScheduleData);
          // Кэширование данных расписания
          try {
            await AsyncStorage.setItem('scheduleData', JSON.stringify(data[resultKey].RaspItem));
          } catch (error) {
            console.error('Error caching schedule data:', error);
          }

        } else {
          console.error("Unexpected data structure");
        }
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
        setShowNotification(true);
        clearTimeout(timeoutId); // Очистка тайм-аута, так как произошла ошибка
      } finally {
        setIsLoading(false);
      }
    }


    fetchData(); // затем обновляем данные с сервера


  }, [actualGroupId, groupNameContext]); // добавление groupId в зависимости useEffect


  if (isLoading) {
    return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
  }

  function extractLessonType(lessonName: string): string | undefined {
    // Используем регулярные выражения для поиска и замены типов занятий
    const lessonTypeMatch = lessonName.match(/\((.*?)\)/);

    if (lessonTypeMatch && lessonTypeMatch[1]) {
      let lessonType = lessonTypeMatch[1];

      if (lessonType.includes("Практ.") || lessonType.includes("семин.")) {
        return "Практика";
      }

      return lessonType;
    } else {
      // Возвращаем undefined, если тип занятия не найден
      return undefined;
    }
  }


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
        <HeaderTitleIcon
            prop={data || "loading"}
            headerTitleIconPosition="absolute"
            headerTitleIconMarginLeft={-187.5}
            headerTitleIconTop={15}
            headerTitleIconLeft="50%"
        />
        <ScrollView
            ref={scrollViewRef}
            style={{
              marginTop: groupName ? 0 : 66, // Устанавливаем marginTop в зависимости от наличия groupName
              marginBottom: 75
            }}        >
          <>
            {showNotification && (
                <View style={{ backgroundColor: 'red', padding: 5, alignItems: 'center' }}>
                  <Text style={{ color: 'white' }}>Не удалось извлечь новые данные с сервера</Text>
                </View>
            )}
          </>
          {!groupName ? null : (
              <View style={{ height: 100, backgroundColor: 'white', paddingLeft: 20, paddingTop: 20 }}>
                <Text style={[{ color: '#007AFF', fontWeight: '800' }, styles.textTypo]}>{isGroup(groupName) ? 'Группа' : 'Преподаватель'}</Text>
                <Text style={[{ marginTop: 5, fontWeight: 'bold' }, styles.textTypo]}>{groupName}</Text>
                <Text style={[{ marginTop: 5, color: '#8E8E93' }, styles.textTypo]}>{isGroup(groupName) ? 'Информация о группе' : 'Информация о преподавателе'}</Text>
              </View>
          )}
          {Object.entries(groupedScheduleData).length > 0 ? (
              Object.entries(groupedScheduleData).map(([date, lessonsForTheDay], index) => (
                  <React.Fragment key={index}>
                    <TableSubheadings noteTitle={formatHumanReadableDate(date)} />

                    {/* Выводим уроки за день */}
                    {lessonsForTheDay.map((lesson, lessonIndex) => {
                      // Трансформируем данные урока перед их использованием
                      return (
                          <LessonCard
                              key={lessonIndex}
                              prop={lesson.timestart}
                              prop1={lesson.timefinish}
                              prop2={extractLessonType(lesson.name)}
                              preMedi={processLessonName(lesson.name).lessonInfo}
                              teacherName={processLessonName(lesson.name).teacher}
                              prop3={`Аудитория ${getAddressAndRoom(lesson.aydit).roomNumber}, ${getAddressAndRoom(lesson.aydit).address}`}
                              showBg={false}
                              showBg1={false}
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
                <TouchableOpacity
                    onPress={loadMoreData}
                    disabled={isFetchingMore}
                    style={styles.button}
                >
                  <View style={styles.buttoncontainer}>
                    {isFetchingMore
                        ? <ActivityIndicator color="white" />
                        : <Text style={styles.buttontext}>ЗАГРУЗИТЬ ЕЩЕ</Text>
                    }
                  </View>
                </TouchableOpacity>
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
      </View>
  );
};

const styles = StyleSheet.create({
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
  textTypo: {
    textAlign: "left",
    fontFamily: FontFamily.tabBarMedium,
    lineHeight: 18,
    letterSpacing: 0,
    fontSize: FontSize.footnoteRegular_size,
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
});

export default Schedule;