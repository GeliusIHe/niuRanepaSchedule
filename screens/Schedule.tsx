import * as React from "react";
import { Text, StyleSheet, View, ScrollView } from "react-native";
import { Image } from "expo-image";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import HeaderTitleIcon from "../components/HeaderTitleIcon";
import TabBar from "../components/TabBar";
import { Color } from "../GlobalStyles";
import {useEffect} from "react";
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
      return 'Практическое занятие';
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


  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const groupedScheduleData = groupByDate(scheduleData);

  function formatHumanReadableDate(dateString: string): string {
    const daysOfWeek = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

    const date = new Date(dateString);
    const dayOfWeek = daysOfWeek[date.getUTCDay()];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];

    return `${dayOfWeek}, ${day} ${month}`;
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
    async function fetchData() {
      try {
        console.log('Sending request to the server...');
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

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Data received from the server:', data);
        setScheduleData(data);

        setIsLoading(false);  // <-- Вот здесь

      } catch (error) {
        console.error('Error fetching the schedule:', error as Error);
        console.log('Error occurred:', (error as Error).message);

        setIsLoading(false);  // И здесь

      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
      <View style={styles.schedule}>
        <ScrollView style={{ marginTop: 86 }}>
          {Object.entries(groupedScheduleData).map(([date, lessonsForTheDay], index) => (
              <React.Fragment key={index}>
                <TableSubheadings
                    noteTitle={formatHumanReadableDate(date)}
                />
                {lessonsForTheDay.map((lesson, lessonIndex) => {
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
        </ScrollView>
        <HeaderTitleIcon
            prop="Расписание"
            headerTitleIconPosition="absolute"
            headerTitleIconMarginLeft={-187.5}
            headerTitleIconTop={44}
            headerTitleIconLeft="50%"
        />
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
  schedule: {
    backgroundColor: Color.lightBackgroundQuaternary,
    flex: 1,
    width: "100%",
    height: 812,
  },
});

export default Schedule;
