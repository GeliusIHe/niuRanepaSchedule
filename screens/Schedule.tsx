import * as React from "react";
import {Text, StyleSheet, View, ScrollView, Button, ActivityIndicator} from "react-native";
import { Image } from "expo-image";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import HeaderTitleIcon from "../components/HeaderTitleIcon";
import TabBar from "../components/TabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Color } from "../GlobalStyles";
import {useEffect, useState} from "react";
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


const Schedule = () => {
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

  const loadData = async () => {
    const timeoutId = setTimeout(() => {
      setShowNotification(true);
    }, 5000); // Установить тайм-аут на 5 секунд

    try {
      const response = await fetch('http://services.niu.ranepa.ru/API/public/group/getSchedule');
      if (response.ok) {
        const data = await response.json();
        // обработка данных...
        clearTimeout(timeoutId); // очистить тайм-аут, если данные загружены успешно
        setShowNotification(false); // скрыть уведомление
      } else {
        setShowNotification(true); // показать уведомление, если возникла ошибка
      }
    } catch (error) {
      setShowNotification(true); // показать уведомление, если возникла ошибка
    }
  };


  async function loadMoreData() {
    const startDateForNextFetch = addDays(endDate, 1);  // начало загрузки - на следующий день после текущего endDate
    const newEndDate = addDays(startDateForNextFetch, 6);  // конец загрузки - через 6 дней после начала загрузки
    setEndDate(newEndDate);
    setIsFetchingMore(true);

    try {
      const response = await fetch('http://services.niu.ranepa.ru/API/public/group/getSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: "18792",
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
        }
      } catch (error) {
        console.error('Error loading cached schedule:', error);
      }
    }

    // Загрузка данных с сервера
    async function fetchData() {
      const timeoutId = setTimeout(() => {
        setShowNotification(true);
      }, 5000); // Установить тайм-аут на 5 секунд

      try {
        const response = await fetch('http://services.niu.ranepa.ru/API/public/group/getSchedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: "18792",
            dateBegin: formatDate(new Date()),
            dateEnd: formatDate(addDays(new Date(), 7))
          }),
        });

        clearTimeout(timeoutId); // Очистить тайм-аут

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
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

    loadCachedData(); // Загрузка закешированных данных при первом запуске
    fetchData(); // Запрос на свежие данные с сервера

  }, []);



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
            style={{ marginTop: 66, marginBottom: 65 }}
        >
          <>
            {showNotification && (
                <View style={{ backgroundColor: 'red', padding: 5, alignItems: 'center' }}>
                  <Text style={{ color: 'white' }}>Не удалось извлечь новые данные с сервера</Text>
                </View>
            )}
            {/* остальной код вашего компонента */}
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
            showNotification ? (
                <Text style={{ color: 'white' }}>Не удалось извлечь новые данные с сервера</Text>
            ) : (
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
            imageDimensions={require("../assets/briefcase1.png")}
            tabBarPosition="absolute"
            tabBarTop={734}
            tabBarLeft={0}
            textColor="#007aff"
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
