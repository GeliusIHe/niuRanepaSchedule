import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {
  ActivityIndicator,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import TableSubheadings from "../components/TableSubheadings";
import LessonCard from "../components/LessonCard";
import HeaderTitleIcon from "../components/HeaderTitleIcon";
import TabBar from "../components/TabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Color, FontFamily, FontSize, Padding} from "../GlobalStyles";
import {useGroupId} from "../components/GroupIdContext";
import {useGroup} from "../components/GroupContext";
import {find} from "lodash";
import Modal from "react-native-modal";
import {Image} from "expo-image";
import axios from "axios";
import {useNavigation} from "@react-navigation/core";

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

function getAddressAndRoom(room: string): { address: JSX.Element; roomNumber: string } {
  if (room.startsWith('П8-')) {
    return {
      address: <Text>
        Пушкина <Text style={{fontWeight: 'bold'}}>8</Text>
      </Text>,
      roomNumber: room.replace('П8-', ''),
    };
  } else if (room.startsWith('СО')) {
    return {
      address: <Text>
        Пушкина <Text style={{fontWeight: 'bold'}}>10</Text>
      </Text>,
      roomNumber: room.replace('СО ', ''),
    };
  } else {
    return {
      address: <Text>Не распознано</Text>,
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
  const intervalIdRef = useRef<number | null>(null);
  const [scheduleData, setScheduleData] = React.useState<ScheduleItem[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const groupedScheduleData = groupByDate(scheduleData);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [stableSchedule, setStableSchedule] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState(null);
  const inputRef = useRef<TextInput>(null); // указываем TextInput как тип ссылки
  const [showUpdate, setShowUpdate] = useState(false);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [updateUrl, setUpdateUrl] = useState('');
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState(''); // для хранения запроса пользователя

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
      console.log(newData)
      const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';
      if (newData[resultKey] && newData[resultKey].RaspItem) {
        const flatNewData = [].concat(...newData[resultKey].RaspItem);
        const filteredScheduleData = filterPhysicalEducationLessons(flatNewData);
        setScheduleData(prevData => [...prevData, ...filterScheduleBySubject(subjectName, filteredScheduleData)]);
      } else {
        console.error(`Unexpected data structure`);
      }
      setTimeout(() => {
        if (scrollViewRef.current && scrollViewRef.current.scrollTo) {
          scrollViewRef.current.scrollTo({ x: 0, y: loadMoreButtonPosition, animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching more schedule:', error);
      setShowNotification(true);
      clearTimeout(timeoutId);
    } finally {
      setIsFetchingMore(false);
    }
  }

  const findSuggestion = (input: any) => {
    const matchedSubject = subjectNames.find(name => name.toLowerCase().startsWith(input.toLowerCase()));
    return matchedSubject || '';
  };

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

    const checkServerConnection = async () => {
      let attempts = parseInt(await AsyncStorage.getItem('failedAttempts') as string) || 0;

      try {
        const appVersion = 'release-1.2.0-011924';
        const response = await axios.get(`https://api.geliusihe.ru/getData/${appVersion}`, { timeout: 3000 });

        if (response.data.access === 0) {
          // @ts-ignore
          navigation.navigate('VersionError');
        } else {
          await AsyncStorage.setItem('failedAttempts', '0');
        }
      } catch (error) {
        attempts += 1;
        await AsyncStorage.setItem('failedAttempts', attempts.toString());

        if (attempts >= 3) {
          // @ts-ignore
          navigation.navigate('VersionError');
        }
      }
    }
    checkServerConnection()

    const checkForUpdates = async () => {
      const appVersion = 'release-1.2.0-011924';
      try {
        const response = await axios.get(`https://api.geliusihe.ru/getData/${appVersion}`);
        if (response.data.latest === 0) {
          const latestResponse = await axios.get('https://api.geliusihe.ru/latest');
          console.log(latestResponse.data); // Вывод ответа от /latest
          setUpdateUrl(latestResponse.data)
          setShowUpdate(true);
        }
      } catch (error) {
        console.error('Ошибка при запросе к серверу:', error);
      }
    };

    checkForUpdates();
  }, []);


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
          const cachedData = await AsyncStorage.getItem('scheduleData');
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
// Кастомный хук для отслеживания изменений в AsyncStorage
  useEffect(() => {
    let isInitialLoad = true;

    const fetchData = async () => {
      const getData = async () => {
        try {
          const value = await AsyncStorage.getItem('@group_name');
          if (value == null && isInitialLoad) {
            isInitialLoad = false;
            navigation.navigate('StartScreen');
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
        const startDate = formatDate(new Date());
        const endDate = formatDate(addDays(new Date(), daysMargin));
        const url = `http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?user=${actualGroupName}&dstart=${startDate}&dfinish=${endDate}`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          let data = await response.json();
          const resultKey = isGroup(actualGroupName) ? 'GetRaspGroupResult' : 'GetRaspPrepResult';

          if (data[resultKey] && data[resultKey].RaspItem) {
            const filteredScheduleData = filterPhysicalEducationLessons(data[resultKey].RaspItem);
            setScheduleData(filterScheduleBySubject('', filteredScheduleData));
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
          // Устанавливаем таймер на 5 секунд перед установкой showNotification в true
          setTimeout(() => {
            setShowNotification(true);
          }, 5000);
        } finally {
          setIsLoading(false);
        }
      }
    }
    intervalIdRef.current = setInterval(fetchData, 2500) as unknown as number;

    fetchData(); // Вызываем fetchData в первый раз для инициализации

    return () => {
      // Очищаем интервал при размонтировании компонента, используя значение из ref
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [actualGroupId, groupNameContext]); // Не забудьте указать все необходимые зависимости


  if (isLoading) {
    return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
  }

  function extractLessonType(lessonName: string = " "): string | undefined {
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
  const handleUpdatePress = () => {
    console.log(updateUrl)
    if (updateUrl) {
      Linking.openURL(updateUrl).catch(err => console.error('Ошибка при открытии URL:', err));
    }
  };

  return (
      <View style={styles.schedule}>
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
            }}        >
          <>
            {showUpdate && (
                <TouchableOpacity onPress={handleUpdatePress}>
                  <View style={{backgroundColor: '#6FBA8F', padding: 5, alignItems: 'center', height: 30}}>
                    <Text style={{color: '#F8FCFA'}}>Доступно обновление. Нажмите чтобы установить</Text>
                  </View>
                </TouchableOpacity>
            )}
            {showNotification && (
                <View style={{ backgroundColor: 'red', padding: 5, alignItems: 'center' }}>
                  <Text style={{ color: 'white' }}>Не удалось извлечь новые данные с сервера</Text>
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
                              prop3={
                                <Text>
                                  Аудитория <Text style={{fontWeight: 'bold'}}>{getAddressAndRoom(lesson.aydit).roomNumber}</Text>, {getAddressAndRoom(lesson.aydit).address}
                                </Text>
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
});

export default Schedule;