import React, {useEffect, useMemo, useState} from "react";
import { Image } from "expo-image";
import {StyleSheet, View, Text, TextInput, TouchableOpacity, Animated} from "react-native";
import { FontFamily, Color, FontSize, Border, Padding } from "../GlobalStyles";
import HeaderTitle from "./HeaderTitle";
import { debounce } from 'lodash';
import {useNavigation} from "@react-navigation/core";
import Schedule from "../screens/Schedule";
import {useGroupId} from "./GroupIdContext";
import FlatList = Animated.FlatList;
import AsyncStorage from "@react-native-async-storage/async-storage";

type SearchFocusedIconType = {
  showCursor1?: boolean;

  searchFocusedIconPosition?: string;
  searchFocusedIconBorderStyle?: string;
  searchFocusedIconBorderColor?: string;
  searchFocusedIconBorderBottomWidth?: number | string;
  searchFocusedIconTop?: number | string;
  searchFocusedIconLeft?: number | string;
  inputFieldJustifyContent?: string;
  textWidth?: number | string;
  textWidth1?: number | string;
  textFlex?: number;
  textLineHeight?: number;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
type ItemDetails = {
  id: number;
  title: string;
  type: string;
};

type SelectedStarsType = {
  [key: number]: ItemDetails | null;
};

const SearchFocusedIcon = ({
                             showCursor1,
                             searchFocusedIconPosition,
                             searchFocusedIconBorderStyle,
                             searchFocusedIconBorderColor,
                             searchFocusedIconBorderBottomWidth,
                             searchFocusedIconTop,
                             searchFocusedIconLeft,
                             inputFieldJustifyContent,
                             textWidth,
                             textWidth1,
                             textFlex,
                             textLineHeight,
                           }: SearchFocusedIconType) => {
  const searchFocusedIconStyle = useMemo(() => {
    return {
      ...getStyleValue("position", searchFocusedIconPosition),
      ...getStyleValue("borderStyle", searchFocusedIconBorderStyle),
      ...getStyleValue("borderColor", searchFocusedIconBorderColor),
      ...getStyleValue("borderBottomWidth", searchFocusedIconBorderBottomWidth),
      ...getStyleValue("top", searchFocusedIconTop),
      ...getStyleValue("left", searchFocusedIconLeft),
    };
  }, [
    searchFocusedIconPosition,
    searchFocusedIconBorderStyle,
    searchFocusedIconBorderColor,
    searchFocusedIconBorderBottomWidth,
    searchFocusedIconTop,
    searchFocusedIconLeft,
  ]);

  const [searchQuery, setSearchQuery] = useState(''); // для хранения запроса пользователя
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [searchedGroupId, setSearchedGroupId] = useState(null);
  const [isShowingSelectedGroupSchedule, setIsShowingSelectedGroupSchedule] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedStars, setSelectedStars] = useState<SelectedStarsType>({});

  useEffect(() => {
    const loadSelectedItems = async () => {
      try {
        const savedData = await AsyncStorage.getItem('selectedStars');
        const selectedItems = savedData ? JSON.parse(savedData) : {};
        setSelectedStars(selectedItems);
      } catch (error) {
        console.error("Ошибка при загрузке выбранных элементов:", error);
      }
    };

    loadSelectedItems();
  }, []);

  function sortGroups(a: { Title: string; }, b: { Title: string; }) {
    // Разделяем строку на буквенную и цифровую части
    const matchA = a.Title.match(/([a-zA-Z]+)(\d+)/);
    const matchB = b.Title.match(/([a-zA-Z]+)(\d+)/);

    // Проверяем, удалось ли разделить строку
    if (matchA && matchB) {
      const prefixA = matchA[1], numberA = parseInt(matchA[2]);
      const prefixB = matchB[1], numberB = parseInt(matchB[2]);

      // Сначала сравниваем буквенные части
      if (prefixA < prefixB) return -1;
      if (prefixA > prefixB) return 1;

      // Если буквенные части равны, сравниваем числовые части
      return numberA - numberB;
    }

    // В случае, если не удалось разделить строку, сравниваем исходные строки
    return a.Title.localeCompare(b.Title);
  }


  const { setGroupId } = useGroupId();

  const handleGroupSelect = (selectedGroupId: any) => {
    setGroupId(selectedGroupId);
  };

  const inputFieldStyle = useMemo(() => {
    return {
      ...getStyleValue("justifyContent", inputFieldJustifyContent),
    };
  }, [inputFieldJustifyContent]);

  const textStyle = useMemo(() => {
    return {
      ...getStyleValue("width", textWidth),
    };
  }, [textWidth]);

  const text1Style = useMemo(() => {
    return {
      ...getStyleValue("width", textWidth1),
      ...getStyleValue("flex", textFlex),
    };
  }, [textWidth1, textFlex]);
  interface GroupResult {
    Title: string;
    Type: string;
    id: number;
  }

  const debouncedSearch = debounce((query: string) => {
    // Сначала обращаемся к api.geliusihe
    fetch(`https://api.geliusihe.ru/autocomplete?title=${encodeURIComponent(query)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json();
        })
        .then(suggestions => {
          if (suggestions && suggestions.length > 0) {
            // Если есть результаты от api.geliusihe, используем их и не выполняем запрос к services.niu.ranepa.ru
            console.log(suggestions)
            suggestions.sort(sortGroups);
            setSearchResults(suggestions);
            console.log(suggestions)
          } else {
            // Если нет результатов от api.geliusihe, выполняем запрос к services.niu.ranepa.ru
            return fetch(`http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?name=${query}`);
          }
        })
        .then(response => {
          if (response && response.ok) {
            return response.json();
          }
        })
        .then(data => {
          // Добавляем проверку на наличие данных перед обращением к свойствам объекта
          if (data) {
            const rawData = data.GetNameUidForRaspResult?.ItemRaspUID || [];
            const results = Array.isArray(rawData) ? rawData : [rawData];
            const groups = results.filter(result => result.Type === 'Group');
            groups.forEach(checkAndCacheGroup);
            setSearchResults(results);
          }
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
  }, 300);

  function checkAndCacheGroup(group: { Title: string; id: number; }) {
    // Замените URL на адрес вашего сервера для проверки кэша
    fetch(`https://api.geliusihe.ru/check-cache?title=${encodeURIComponent(group.Title)}`)
        .then(response => response.json())
        .then(data => {
          // Проверяем, есть ли в кэше информация о группе
          if (!data.cached) {
            // Если группа не найдена в кэше, нужно её туда добавить
            return fetch('https://api.geliusihe.ru/cache-group', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: group.Title, id: group.id }),
            });
          }
        })
        .then(response => {
          if (response && !response.ok) {
            // Если POST запрос не прошел успешно, выбрасываем ошибку
            throw new Error('Problem with caching the group');
          }
          // Обработка успешного кэширования, если нужно
        })
        .catch(error => {
          console.error('There was an error checking or updating the cache:', error);
        });
  }

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setIsLoading(true);
      debouncedSearch(searchQuery); // Вызов debounced функции с searchQuery
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }

    // Очистка эффекта, если компонент будет размонтирован
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);



  const text2Style = useMemo(() => {
    return {
      ...getStyleValue("lineHeight", textLineHeight),
    };
  }, [textLineHeight]);
  interface SearchResult {
    Type: string;
    id: number;
    Title: string;
  }

  function extractCourseNumber(groupName: string) {
    // Пытаемся найти число в названии группы и извлекаем из него вторую цифру
    const match = groupName.match(/\d+/);
    return match ? match[0][1] : null;
  }
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const navigation = useNavigation();

  const handleGroupClick = (groupId: any, groupName: string) => {
    setGroupId(groupId); // обновление groupId в контексте
    setSelectedGroupName(groupName); // обновление названия группы
    console.log(`Установлен groupId ${groupId}`);
    setIsShowingSelectedGroupSchedule(true); // показываем расписание
  };

  const handleBackToSearchClick = () => {
    setIsShowingSelectedGroupSchedule(false); // скрываем расписание, возвращаясь к поиску
  };
  const handleStarClick = async (item: ItemDetails) => {
    const newStars: SelectedStarsType = {
      ...selectedStars,
      [item.id]: selectedStars[item.id] ? null : item
    };

    setSelectedStars(newStars);
    await AsyncStorage.setItem('selectedStars', JSON.stringify(newStars));
  };


  const hasSelectedItems = () => {
    const hasItems = Object.values(selectedStars).some(value => value);
    return hasItems;
  };

  const renderSelectedItems = () => {
    return Object.entries(selectedStars)
        .filter(([, item]) => item !== null)
        .map(([id, item]) => {
          if (!item) return null;

          return (
              <TouchableOpacity key={id} onPress={() => handleGroupClick(item.id, item.title)}>
                <View>
                  <View style={{ alignItems: 'flex-start',
                    marginBottom: 15,
                    paddingLeft: 20,
                    borderStyle: "solid",
                    borderColor: Color.colorDarkslategray_100,
                    borderBottomWidth: 0.5, }}>
                    <Text style={[styles.resultText, styles.boldText]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.additionalText, {marginBottom: 15,}]}>
                      {item.type === "Group" ? `СПО, ${extractCourseNumber(item.title)} курс, очная форма` : "Информация о преподавателе"}
                    </Text>
                  </View>
                  <TouchableOpacity     style={{
                    position: 'absolute',
                    right: 30,
                    transform: [{ translateY: 5 }] // Половина высоты иконки для центрирования
                  }}
                                        onPress={() => handleStarClick({
                                          id: item.id,
                                          title: item?.title,
                                          type: item.type,
                                        })}>
                    <Image
                        source={selectedStars[item.id] ? require("../assets/yellow-star.png") : require("../assets/gray-star.png")}
                        style={{ width: 30, height: 30 }}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
          );
        });
  };


  return (
      <View style={styles.mainContainer}>

        {isShowingSelectedGroupSchedule ? (
            <>
              <TouchableOpacity onPress={handleBackToSearchClick} style={styles.container2}>
                <View style={styles.iconContainer2}>
                  <Image style={[{width: 20, height: 20}]} source={require("../assets/backicon.svg")} />
                </View>
                <Text style={styles.text3}>Поиск</Text>
              </TouchableOpacity>
              <Schedule groupIdProp={selectedGroupId} groupName={selectedGroupName} />
            </>
        ) : (
            <>
              <HeaderTitle
                  prop="Поиск"
                  headerTitleMarginLeft={-200.5}
                  headerTitleTop={10}
                  headerTitleLeft="50%"
              />
              <View style={[styles.searchContainer]}>
                <TextInput
                    style={[styles.input]}
                    placeholder="Поиск"
                    onChangeText={text => {
                      setSearchQuery(text);
                    }}
                    value={searchQuery}
                />
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Image
                      style={styles.sfSymbolXmarkcirclefill}
                      source={require("../assets/sf-symbol--xmarkcirclefill.png")}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputLine}></View>

              <View style={styles.resultContainer}>
                <FlatList
                    style={{
                      marginBottom: searchQuery === '' ? 35 : 195
                    }}
                    data={searchResults}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleGroupClick(item.id, item.Title)}>
                          <View style={[styles.groupContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                            {item.Type === "Prep" && (
                                <View style={styles.iconContainer}>
                                  <Image source={require("../assets/Graduationcap.svg")} style={styles.icon} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.resultText, styles.boldText]}>
                                {item.Title}
                              </Text>
                              <Text style={styles.additionalText}>
                                {item.Type === "Group" ? `СПО, ${extractCourseNumber(item.Title)} курс, очная форма` : "Информация о преподавателе"}
                              </Text>
                              {item.Type === "Group" && (
                                  <TouchableOpacity
                                      style={{
                                        position: 'absolute',
                                        right: 30,
                                        top: '25%',
                                        transform: [{ translateY: -15 }] // Половина высоты иконки для центрирования
                                      }}
                                      onPress={() => handleStarClick({
                                        id: item.id,
                                        title: item.Title,
                                        type: item.Type,
                                      })}
                                  >
                                    <Image
                                        source={selectedStars[item.id] ? require("../assets/yellow-star.png") : require("../assets/gray-star.png")}
                                        style={{ width: 30, height: 30 }}
                                    />
                                  </TouchableOpacity>
                              )}

                            </View>
                          </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item.id.toString()}
                />
              </View>

              {searchQuery === '' && (
                  hasSelectedItems() ? (
                      <View style={{marginTop: -18}}>
                        {renderSelectedItems()}
                      </View>
                  ) : (
                      <View style={[styles.content, {marginTop: 195}]}>
                        <Text style={styles.contentText}>
                          {`Приложение сможет найти расписание преподавателя, группы и аудитории 👍`}
                        </Text>
                      </View>
                  )
              )}

            </>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // отступ справа от иконки
  },
  icon: {
    width: 20,
    height: 20,
  },
  container2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    height: 45,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  iconContainer2: {
    marginRight: 7,
    marginTop: 2.5,
  },
  text3: {
    color: '#007AFF',
    marginTop: 10,
    marginBottom: 9.5,
    marginLeft: -6,
    fontSize: 16,
  },
  prepMargin: {
    marginBottom: -50,
  },
  groupTitle: {
    marginTop: 15,
  },
  boldText: {
  },
  groupContainer: {
    paddingLeft: 20,
    height: 80,
    borderStyle: "solid",
    borderColor: Color.colorDarkslategray_100,
    borderBottomWidth: 0.5,
  },
  additionalText: {
    marginTop: -4,
    fontSize: 12,
    color: 'grey',
  },
  inputLine: {
    marginTop: 15,
  },
  content: {
    flex: 1,
    backgroundColor: Color.lightBackgroundQuaternary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Padding.p_xl,
    marginBottom: 100,
  },
  contentText: {
    fontSize: FontSize.footnoteRegular_size,
    letterSpacing: 0,
    lineHeight: 18,
    color: Color.lightLabelSecondary,
    textAlign: 'center',
  },
  mainContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  searchContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'lightgrey',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 10,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  resultContainer: {
    marginTop: 2,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  inputFlexBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: 'lightgray',
  },
  textTypo: {
    letterSpacing: 0,
  },
  cursorLayout: {
    height: 22,
    width: 2,
    borderRightWidth: 2,
    borderColor: Color.lightGraphicsBlue,
    borderStyle: "solid",
  },
  searchIcon: {
    width: 16,
    height: 16,
    overflow: "hidden",
  },
  text1: {
    flex: 1,
    lineHeight: 20,
    color: Color.lightGraphicsGray,
    textAlign: "left",
  },
  cursor2: {
    display: "none",
    marginLeft: 1,
  },
  text: {
    marginLeft: 8,
    flexDirection: "row",
  },
  sfSymbolXmarkcirclefill: {
    width: 17,
    height: 17,
    marginLeft: 8,
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Padding.p_xs,
    paddingVertical: Padding.p_5xs,
  },
  text2: {
    lineHeight: 24,
    color: Color.lightGraphicsBlue,
    textAlign: "right",
    display: "none",
    marginLeft: 8,
  },
  searchfocusedicon: {
    backgroundColor: Color.lightBackgroundQuaternary,
    marginLeft: 15,
    width: '100%',
    height: 56,
    padding: Padding.p_xs,
    flexDirection: 'column',
  },
});

export default SearchFocusedIcon;
