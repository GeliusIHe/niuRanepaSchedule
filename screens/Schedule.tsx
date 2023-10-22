import * as React from "react";
import {useEffect, useState} from "react";
import {ActivityIndicator, Button, ScrollView, StyleSheet, Text, View} from "react-native";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import HeaderTitleIcon from "../components/HeaderTitleIcon";
import TabBar from "../components/TabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Color} from "../GlobalStyles";
import {useGroupId} from "../components/GroupIdContext";

type ScheduleItem = {
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
    (acc[lesson.xdt] = acc[lesson.xdt] || []).push(lesson);
    return acc;
  }, {});
}

function getFullTypeName(type: string): string {
  switch (type) {
    case 'Лек':
      return 'Лекция';
    case 'Прак':
      return 'Практика';
    default:
      return type; // Возвращаем исходный тип, если он не соответствует ни одному из вышеуказанных
  }
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
}
const Schedule: React.FC<ScheduleProps> = ({ groupIdProp }) => {
  const { groupId: groupIdFromHook } = useGroupId();

  const actualGroupId = groupIdProp !== null ? groupIdProp : groupIdFromHook;
  const [loadMoreButtonPosition, setLoadMoreButtonPosition] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [endDate, setEndDate] = React.useState(addDays(new Date(), 7));

  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const groupedScheduleData = groupByDate(scheduleData);

  function formatHumanReadableDate(dateString: string): string {
    const daysOfWeek = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    const date = new Date(dateString);

    // Смещаем дату на два дня вперёд
    date.setDate(date.getDate());

    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];

    return `${dayOfWeek}, ${day} ${month}`;
  }
  function filterDuplicatePhysicalEducation(lessons: ScheduleItem[]): ScheduleItem[] {
    let isPhysicalEducationIncluded = false;
    return lessons.filter(lesson => {
      if (lesson.subject === 'Физическая культура') {
        if (isPhysicalEducationIncluded) {
          return false;
        }
        isPhysicalEducationIncluded = true;
      }
      return true;
    });
  }
  async function loadMoreData() {
    const groupIdString = actualGroupId ? String(actualGroupId) : "18792";

    const startDateForNextFetch = addDays(endDate, 1);
    const newEndDate = addDays(startDateForNextFetch, 6);
    setEndDate(newEndDate);
    setIsFetchingMore(true);

    try {
      const response = await fetch('http://services.niu.ranepa.ru/API/public/group/getSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: groupIdString, // используется условный оператор для установки id
          dateBegin: formatDate(startDateForNextFetch),
          dateEnd: formatDate(newEndDate)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const newData = await response.json();
      setScheduleData(prevData => [...prevData, ...newData]);

      setTimeout(() => {
        if (scrollViewRef.current && scrollViewRef.current.scrollTo) {
          scrollViewRef.current.scrollTo({ x: 0, y: loadMoreButtonPosition, animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching more schedule:', error);
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

  useEffect(() => {
    // Загрузка закешированных данных
    async function loadCachedData() {
      try {
        const cachedData = await AsyncStorage.getItem('scheduleData');
        if (cachedData) {
          setScheduleData(JSON.parse(cachedData));
          setIsLoading(false); // скрыть индикатор загрузки после загрузки кешированных данных
        }
      } catch (error) {
        console.error('Error loading cached schedule:', error);
      }
    }
    // Загрузка данных с сервера
    async function fetchData() {
      let groupIdString;
      if (actualGroupId) {
        groupIdString = String(actualGroupId);
        console.log(`groupidstring ${groupIdString}`)
      } else {
        groupIdString = "18792"; // ID группы по умолчанию
      }
      const timeoutId = setTimeout(() => {
        setShowNotification(true);
      }, 5000); // Установить тайм-аут на 5 секунд
      if (actualGroupId) {
        console.log("Текущий ID группы:", actualGroupId);
      } else {
        console.log("groupId не определен");
      }

      try {
        const response = await fetch('http://services.niu.ranepa.ru/API/public/group/getSchedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: groupIdString, // используйте groupId, переданный как prop
            dateBegin: formatDate(new Date()),
            dateEnd: formatDate(addDays(new Date(), 7))
          }),
        });
        if (actualGroupId) {
          const groupIdString = String(actualGroupId);
          console.log(`Trying to get ${groupIdString}`);
        } else {
          console.log('groupId or groupId.groupId is not defined:', actualGroupId);
        }


        clearTimeout(timeoutId); // Очистить тайм-аут

        if (!response.ok) {
          const errorData = await response.json(); // попытаться получить данные об ошибке из ответа сервера
          console.error('Error data:', errorData); // вывод данных об ошибке
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
          setIsLoading(false); // Устанавливаем isLoading в false, если данные получены с сервера
        }
        setShowNotification(false); // Скрыть уведомление об ошибке

        if (JSON.stringify(data) !== JSON.stringify(scheduleData)) {
          setScheduleData(data); // Обновить данные расписания
          await AsyncStorage.setItem('scheduleData', JSON.stringify(data)); // Обновить кеш
        }

      } catch (error) {
        setShowNotification(true); // Показать уведомление об ошибке, если возникла ошибка
        console.error('Error fetching the schedule:', error);
      } finally {
        setIsLoading(false); // Скрыть индикатор загрузки
      }
    }

    loadCachedData(); // сначала загружаем кешированные данные
    fetchData(); // затем обновляем данные с сервера

  }, [actualGroupId]); // добавление groupId в зависимости useEffect

  if (isLoading) {
    return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
  }


  return (
      <View style={styles.schedule}>

        <HeaderTitleIcon
            prop="ИСПб-027"
            headerTitleIconPosition="absolute"
            headerTitleIconMarginLeft={-187.5}
            headerTitleIconTop={15}
            headerTitleIconLeft="50%"
        />
        <ScrollView
            ref={scrollViewRef}
            style={{ marginTop: 66, marginBottom: 75 }}
        >
          <>
            {showNotification && (
                <View style={{ backgroundColor: 'red', padding: 5, alignItems: 'center' }}>
                  <Text style={{ color: 'white' }}>Не удалось извлечь новые данные с сервера</Text>
                </View>
            )}
          </>
          {Object.entries(groupedScheduleData).map(([date, lessonsForTheDay], index) => (
              <React.Fragment key={index}>
                <TableSubheadings noteTitle={formatHumanReadableDate(date)} />
                {filterDuplicatePhysicalEducation(lessonsForTheDay).map((lesson, lessonIndex) => {
                  const fullTypeName = getFullTypeName(lesson.type.split(',')[0]);
                  const { address, roomNumber } = getAddressAndRoom(lesson.number);
                  return (
                      <LessonCard
                          key={lessonIndex}
                          prop={lesson.nf}
                          prop1={lesson.kf}
                          prop2={fullTypeName}
                          preMedi={lesson.subject}
                          prop3={`Аудитория ${roomNumber}, ${address}`}
                          showBg={false}
                          showBg1={false}
                      />
                  );
                })}
              </React.Fragment>
          ))}
          {
            showNotification ? null : (
                <View
                    onLayout={(event) => {
                      const layout = event.nativeEvent.layout;
                      setLoadMoreButtonPosition(layout.y);
                    }}
                >
                  <Button
                      title={isFetchingMore ? "Загрузка..." : "Загрузить еще"}
                      onPress={loadMoreData}
                  />
                </View>
            )
          }

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
