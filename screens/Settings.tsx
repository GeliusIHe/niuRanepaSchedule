
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, {Path, Rect} from "react-native-svg"
import TabBar from '../components/TabBar'; // Путь к вашему компоненту TabBar
const Settings = () => {
    return (
        <View style={styles.container}>
            <View style={styles.groupContainer}>
                <Svg width={30} height={30} viewBox="0 0 30 30">
                    <Rect width="30" height="30" rx="7" fill="#5AC8FA" />
                    <Path
                        d="M16.4464 22.87H18.3298C19.0831 22.87 19.4824 22.4556 19.4824 21.7174V11.5698L20.6275 21.8831C20.7028 22.6214 21.1398 22.998 21.8856 22.9076L24.2436 22.5912C24.9894 22.5008 25.3359 22.0639 25.2606 21.3256L23.9196 9.20424C23.8443 8.46596 23.4074 8.08929 22.6616 8.17969L20.296 8.49609C19.9269 8.53376 19.6557 8.66936 19.4824 8.8803V7.27567C19.4824 6.53739 19.0831 6.12305 18.3298 6.12305H16.4464C15.7006 6.12305 15.3013 6.53739 15.3013 7.27567V21.7174C15.3013 22.4556 15.7006 22.87 16.4464 22.87ZM5.86942 22.87H7.11998C7.87333 22.87 8.2726 22.4556 8.2726 21.7174V9.40011C8.2726 8.66183 7.87333 8.24749 7.11998 8.24749H5.86942C5.11607 8.24749 4.7168 8.66183 4.7168 9.40011V21.7174C4.7168 22.4556 5.11607 22.87 5.86942 22.87ZM10.3142 22.87H13.2522C14.0056 22.87 14.4049 22.4556 14.4049 21.7174V12.0745C14.4049 11.3362 14.0056 10.9294 13.2522 10.9294H10.3142C9.56836 10.9294 9.16908 11.3362 9.16908 12.0745V21.7174C9.16908 22.4556 9.56836 22.87 10.3142 22.87ZM10.9093 13.7469C10.6155 13.7469 10.397 13.5209 10.397 13.2347C10.397 12.9559 10.6155 12.7374 10.9093 12.7374H12.6797C12.966 12.7374 13.1844 12.9559 13.1844 13.2347C13.1844 13.5209 12.966 13.7469 12.6797 13.7469H10.9093ZM10.9093 21.0619C10.6155 21.0619 10.397 20.8435 10.397 20.5572C10.397 20.2709 10.6155 20.0525 10.9093 20.0525H12.6797C12.966 20.0525 13.1844 20.2709 13.1844 20.5572C13.1844 20.8435 12.966 21.0619 12.6797 21.0619H10.9093Z"
                        fill="white"
                    />
                </Svg>
                <Text style={styles.groupText}>Группа по умолчанию</Text>
                <View style={styles.arrowContainer}>
                    <Image source={require('../assets/Arrow.png')} style={styles.arrowIcon} />
                </View>
            </View>
            <TabBar
                imageDimensions={require("../assets/briefcaseGray.png")}
                tabBarPosition="absolute"
                tabBarTop={800}
                tabBarLeft={0}
                textColor="#007aff"
                tabBarWidth={400}
                tabBarHeight={75}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        flex: 1,
    },
    groupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingStart: 20,
        height: 45,
        width: '100%', // или другой размер, который вы хотите
    },
    groupIcon: {
        width: 30,
        height: 30,
    },
    groupText: {
        marginLeft: 15,
    },
    arrowContainer: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 20,
    },
    arrowIcon: {
        // Задайте размеры, если это необходимо
    },
});
export default Settings;