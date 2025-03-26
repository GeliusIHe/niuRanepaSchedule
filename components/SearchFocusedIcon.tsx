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
  const [groupsWithCache, setGroupsWithCache] = useState<{[id: number]: boolean}>({});
  const [isServerReachable, setIsServerReachable] = useState(true);

  // Function to clean up old search caches (keeping only the most recent)
  const cleanUpOldSearchCaches = async () => {
    try {
      const MAX_CACHED_SEARCHES = 20;
      const cachedSearches = await AsyncStorage.getItem('cachedSearchQueries') || '[]';
      const searches = JSON.parse(cachedSearches);
      
      if (searches.length > MAX_CACHED_SEARCHES) {
        // Keep only the most recent MAX_CACHED_SEARCHES
        const searchesToRemove = searches.slice(0, searches.length - MAX_CACHED_SEARCHES);
        const searchesToKeep = searches.slice(searches.length - MAX_CACHED_SEARCHES);
        
        // Remove the old caches
        for (const query of searchesToRemove) {
          const cacheKey = `searchCache_${query}`;
          const timestampKey = `searchCacheTimestamp_${query}`;
          await AsyncStorage.removeItem(cacheKey);
          await AsyncStorage.removeItem(timestampKey);
        }
        
        // Update the list of cached searches
        await AsyncStorage.setItem('cachedSearchQueries', JSON.stringify(searchesToKeep));
        console.log(`Cleaned up ${searchesToRemove.length} old search caches`);
      }
    } catch (error) {
      console.error('Error cleaning up old search caches:', error);
    }
  };

  // Function to get cache key for a group
  function getCacheKey(groupIdentifier: string | null): string {
    return `scheduleData_${groupIdentifier || ''}`;
  }

  // Function to check if a group has cached data
  async function checkGroupCache(groupId: number, groupTitle: string): Promise<boolean> {
    try {
      const cacheKey = getCacheKey(groupTitle);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      return cachedData !== null;
    } catch (error) {
      console.error('Error checking group cache:', error);
      return false;
    }
  }

  // Function to update cache status for all search results
  async function updateCacheStatus(results: SearchResult[]) {
    const cacheStatus: {[id: number]: boolean} = {};
    
    for (const result of results) {
      // For groups, check if we have cached schedule data
      if (result.Type === "Group") {
        cacheStatus[result.id] = await checkGroupCache(result.id, result.Title);
      } else {
        // For non-groups (teachers, etc.), just mark as false
        cacheStatus[result.id] = false;
      }
    }
    
    setGroupsWithCache(cacheStatus);
    
    // After checking status, also check if we have cached schedules
    // This helps update UI indicators for offline availability
    const cachedScheduleKeys = await getCachedScheduleKeys();
    console.log(`Found ${cachedScheduleKeys.length} cached schedules`);
  }
  
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

  const debouncedSearch = debounce(async (query: string) => {
    setIsLoading(true);
    
    // First, check if we have this query cached
    try {
      const searchCacheKey = `searchCache_${query.toLowerCase()}`;
      const cachedResults = await AsyncStorage.getItem(searchCacheKey);
      const cachedTimestampKey = `searchCacheTimestamp_${query.toLowerCase()}`;
      const cachedTimestampStr = await AsyncStorage.getItem(cachedTimestampKey);
      
      if (cachedResults) {
        // We have cached results, use them immediately
        console.log("Using cached search results for:", query);
        const parsedResults = JSON.parse(cachedResults);
        setSearchResults(parsedResults);
        updateCacheStatus(parsedResults);
        setIsServerReachable(true);
        setIsLoading(false);
        
        // Check if we need to refresh in the background (if cache is older than 1 hour)
        const currentTime = Date.now();
        const cachedTime = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;
        const cacheAge = currentTime - cachedTime;
        const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (cacheAge > ONE_HOUR) {
          console.log("Cache is older than 1 hour, refreshing in background");
          // After showing cached results, fetch fresh data in background
          fetchFreshSearchResults(query, searchCacheKey);
        } else {
          console.log("Cache is recent, not refreshing from server");
        }
        return;
      }
    } catch (cacheError) {
      console.error("Error checking search cache:", cacheError);
      // Continue with normal fetch if cache check fails
    }
    
    // If no cache or cache check failed, proceed with normal fetch
    fetchFreshSearchResults(query);
  }, 300);
  
  // Function to fetch fresh results from server
  const fetchFreshSearchResults = (query: string, cacheKey?: string) => {
    // Попытка обращения к api.etherveil.baby с обработкой ошибок
    fetch(`https://api.etherveil.baby/autocomplete?title=${encodeURIComponent(query)}`)
        .then(
          response => {
            if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
          },
          // Обработка ошибок сетевого запроса - переходим к запасному серверу
          error => {
            console.log("Error accessing api.etherveil.baby:", error.message);
            // Сразу возвращаем запрос к ranepa серверу
            return fetch(`http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?name=${query}`);
          }
        )
        .then(responseOrData => {
          // Проверяем, ответ ли это или уже данные
          if (responseOrData && responseOrData.json && typeof responseOrData.json === 'function') {
            // Это ответ от api.etherveil.baby
            if (responseOrData.ok) {
              return responseOrData.json();
            } else {
              // Если ответ не ок, выполняем запрос к ranepa
              return fetch(`http://services.niu.ranepa.ru/wp-content/plugins/rasp/rasp_json_data.php?name=${query}`)
                .then(response => response.json());
            }
          } else {
            // Это уже данные от api.etherveil.baby
            return responseOrData;
          }
        })
        .then(data => {
          // Если данные с api.etherveil.baby - массив объектов со свойством Title
          if (data && Array.isArray(data) && data.length > 0 && data[0].Title) {
            console.log("Got results from api.etherveil.baby");
            data.sort(sortGroups);
            setSearchResults(data);
            updateCacheStatus(data);
            setIsServerReachable(true);
            setIsLoading(false);
            
            // Cache the search results for future use
            cacheSearchResults(query, data);
          } 
          // Если данные от ranepa (имеют структуру с GetNameUidForRaspResult)
          else if (data && data.GetNameUidForRaspResult) {
            console.log("Got results from NIU RANEPA server");
            const rawData = data.GetNameUidForRaspResult?.ItemRaspUID || [];
            const results = Array.isArray(rawData) ? rawData : [rawData];
            const groups = results.filter(result => result.Type === 'Group');
            groups.forEach(checkAndCacheGroup);
            setSearchResults(results);
            updateCacheStatus(results);
            setIsServerReachable(true);
            setIsLoading(false);
            
            // Cache the search results for future use
            cacheSearchResults(query, results);
          } 
          // Если данные отсутствуют или в неизвестном формате
          else {
            console.log("No results found or invalid data format");
            setSearchResults([]);
            setIsLoading(false);
            setIsServerReachable(true);
          }
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
          setIsServerReachable(false);
          // When server is unreachable, show all groups with cached data
          getAllCachedGroups(query);
          setIsLoading(false);
        });
  };
  
  // Function to cache search results
  const cacheSearchResults = async (query: string, results: any[]) => {
    try {
      const searchCacheKey = `searchCache_${query.toLowerCase()}`;
      await AsyncStorage.setItem(searchCacheKey, JSON.stringify(results));
      console.log("Cached search results for:", query);
      
      // Store timestamp of when this cache was created
      const timestampKey = `searchCacheTimestamp_${query.toLowerCase()}`;
      await AsyncStorage.setItem(timestampKey, Date.now().toString());
      
      // Store this query in the list of cached searches
      const cachedSearches = await AsyncStorage.getItem('cachedSearchQueries') || '[]';
      const searches = JSON.parse(cachedSearches);
      if (!searches.includes(query.toLowerCase())) {
        searches.push(query.toLowerCase());
        await AsyncStorage.setItem('cachedSearchQueries', JSON.stringify(searches));
        
        // Clean up old caches if we just added a new one
        cleanUpOldSearchCaches();
      }
    } catch (error) {
      console.error("Error caching search results:", error);
    }
  };

  // Clean up old search caches when component mounts
  useEffect(() => {
    cleanUpOldSearchCaches();
  }, []);

  function checkAndCacheGroup(group: { Title: string; id: number; }) {
    // Замените URL на адрес вашего сервера для проверки кэша
    fetch(`https://api.etherveil.baby/check-cache?title=${encodeURIComponent(group.Title)}`)
        .then(response => response.json())
        .then(data => {
          // Проверяем, есть ли в кэше информация о группе
          if (!data.cached) {
            // Если группа не найдена в кэше, нужно её туда добавить
            return fetch('https://api.etherveil.baby/cache-group', {
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

  // Function to get and display all groups with cached data
  async function getAllCachedGroups(searchQuery?: string) {
    try {
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys that represent cached schedules
      const scheduleKeys = allKeys.filter(key => key.startsWith('scheduleData_'));
      
      // Extract group names from the keys
      const groupNames = scheduleKeys.map(key => key.replace('scheduleData_', ''));
      
      // Filter group names by search query if provided
      const filteredGroupNames = searchQuery 
        ? groupNames.filter(name => 
            name.toLowerCase().includes(searchQuery.toLowerCase()))
        : groupNames;
      
      // Create result objects for these groups
      const cachedGroups: SearchResult[] = filteredGroupNames
        .filter(name => name && name.trim() !== '')
        .map((name, index) => ({
          Title: name,
          Type: 'Group',
          id: -(index + 1) // Use negative IDs to indicate these are from cache only
        }));
      
      if (cachedGroups.length > 0) {
        setSearchResults(cachedGroups);
        // Mark all as having cache
        const cacheStatus: {[id: number]: boolean} = {};
        cachedGroups.forEach(group => {
          cacheStatus[group.id] = true;
        });
        setGroupsWithCache(cacheStatus);
      }
    } catch (error) {
      console.error('Error retrieving cached groups:', error);
    }
  }

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
                                {!isServerReachable && groupsWithCache[item.id] && (
                                  <Text style={{ color: '#4CAF50', fontSize: 12 }}> (кэш)</Text>
                                )}
                              </Text>
                              <Text style={styles.additionalText}>
                                {item.Type === "Group" ? `СПО, ${extractCourseNumber(item.Title)} курс, очная форма` : "Информация о преподавателе"}
                                {groupsWithCache[item.id] && (
                                  <Text style={{ color: '#4CAF50' }}> (доступно оффлайн)</Text>
                                )}
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
    fontWeight: 'bold',
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
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
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
    marginTop: 20,
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