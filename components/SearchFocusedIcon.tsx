import React, {useEffect, useMemo, useState} from "react";
import { Image } from "expo-image";
import {StyleSheet, View, Text, TextInput, TouchableOpacity} from "react-native";
import { FontFamily, Color, FontSize, Border, Padding } from "../GlobalStyles";
import HeaderTitle from "./HeaderTitle";
import { debounce } from 'lodash';
import {useNavigation} from "@react-navigation/core";
import Schedule from "../screens/Schedule";
import {useGroupId} from "./GroupIdContext";

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

  const debouncedSearch = debounce((query: string) => {
    fetch(`http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?name=${query}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json();
        })
        .then(data => {
          const rawData = data.GetNameUidForRaspResult?.ItemRaspUID || [];

          // Проверка, является ли результат объектом, и если да, преобразование его в массив
          const results = Array.isArray(rawData) ? rawData : [rawData];

          setSearchResults(results);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
  }, 300); // задержка в 300 миллисекунд

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
                <Image style={styles.sfSymbolXmarkcirclefill} source={require("../assets/sf-symbol--xmarkcirclefill.png")} />
              </View>

              <View style={styles.inputLine}></View>

              <View style={styles.resultContainer}>
                {searchResults.map(item => (
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
                        </View>
                      </View>
                    </TouchableOpacity>
                ))}
              </View>

              <View style={styles.content}>
                {searchQuery === '' && (
                    <Text style={styles.contentText}>{`Приложение сможет найти расписание преподавателя, группы и аудитории 👍`}</Text>
                )}
              </View>
            </>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40, // или другой размер, который вам подходит
    height: 40, // или другой размер, который вам подходит
    borderRadius: 20, // это сделает кружок
    backgroundColor: '#fff', // или другой цвет, если вы хотите
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // отступ справа от иконки
  },
  icon: {
    width: 20, // или другой размер, который вам подходит
    height: 20, // или другой размер, который вам подходит
    resizeMode: 'contain',
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
    marginTop: 9.5,
  },
  text3: {
    color: '#007AFF',
    marginTop: 15,
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
    borderStyle: "solid",
    borderColor: Color.colorDarkslategray_100,
    borderBottomWidth: 0.5,
  },
  contentText: {
    fontSize: FontSize.footnoteRegular_size,
    letterSpacing: 0,
    lineHeight: 18,
    color: Color.lightLabelSecondary,
    textAlign: "center",
    marginLeft: 30,},
  content: {
    position: "absolute",
    top: 368,
    left: 0,
    backgroundColor: Color.lightBackgroundQuaternary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Padding.p_xl,
    width: 375,
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
