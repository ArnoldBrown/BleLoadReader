import React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native';

const LoadingAnim = () => {
    return (
        <View style={styles.EmptyCartContainer}>
            <LottieView
                style={styles.LottieStyle}
                source={require('../lottie/loading_anim.json')}
                autoPlay
                loop
            />
        </View>
    );
};
export default LoadingAnim;

const styles = StyleSheet.create({
    EmptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    LottieStyle: {
        height: 300,
    },
});
