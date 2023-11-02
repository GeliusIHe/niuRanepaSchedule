import React, {useMemo, useRef, useState} from "react";
import { Image } from "expo-image";
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, TextInput} from "react-native";
import Modal from 'react-native-modal';
import { FontFamily, FontSize, Color, Padding } from "../GlobalStyles";

type HeaderTitleIconType = {
  prop?: string;

  /** Style props */
  headerTitleIconPosition?: string;
  headerTitleIconMarginLeft?: number | string;
  headerTitleIconTop?: number | string;
  headerTitleIconLeft?: number | string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const HeaderTitleIcon = ({
  prop,
  headerTitleIconPosition,
  headerTitleIconMarginLeft,
  headerTitleIconTop,
  headerTitleIconLeft,
}: HeaderTitleIconType) => {
  const headerTitleIconStyle = useMemo(() => {
    return {
      ...getStyleValue("position", headerTitleIconPosition),
      ...getStyleValue("marginLeft", headerTitleIconMarginLeft),
      ...getStyleValue("top", headerTitleIconTop),
      ...getStyleValue("left", headerTitleIconLeft),
    };
  }, [
    headerTitleIconPosition,
    headerTitleIconMarginLeft,
    headerTitleIconTop,
    headerTitleIconLeft,
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef<TextInput>(null); // указываем TextInput как тип ссылки


  return (
      <View>
        <View style={[styles.headertitleicon, headerTitleIconStyle]}>
          <View style={[styles.leftAccessory, styles.accessoryFlexBox]}>
            <Image
                style={styles.backIcon}
                contentFit="cover"
                source={require("../assets/back-icon.png")}
            />
            <Text style={[styles.leftTitle, styles.textTypo]}>Расписание</Text>
          </View>
          <View style={[styles.title, styles.accessoryFlexBox]}>
            {prop === "loading" ? (
                <ActivityIndicator size="small" color="#0000ff" />
            ) : (
                <Text style={[styles.text, styles.textTypo]}>{prop}</Text>
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
            <TextInput
                ref={inputRef}
                placeholder="Название предмета"
                style={styles.input}
                onChangeText={text => setSubjectName(text)}
                value={subjectName}
            />

            <TouchableOpacity
                style={styles.closeButton}
                disabled={loading} // делаем кнопку неактивной при загрузке
            >
              {loading ? (
                  <ActivityIndicator size="small" color="#0000ff" /> // отображаем индикатор загрузки
              ) : (
                  <Text style={styles.textStyle}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
  );
};

const styles = StyleSheet.create({
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
  input: {
    paddingLeft: 15,
    borderWidth: 0.3, // Толщина черной полоски
    borderRadius: 20,
    height: 55,
    borderColor: 'gray',
    width: '100%',
    marginTop: 10,
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
    fontSize: FontSize.headlineSemiBold_size,
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
});

export default HeaderTitleIcon;
