import { View, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";

export default function NotFoundScreen(){
    return(
        <>
            <Stack.Screen options={{ title: "Not Found" }} />
            <View style = {styles.container}>
                <Link href="/" style = {styles.button}> Go back to home screen</Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgb(36, 32, 28)',
        justifyContent: "center",
        alignItems: "center",
    },
    button: {
        color: 'rgb(247, 233, 233)',
        fontFamily: 'Helvetica',
        fontSize: 20,
        textDecorationLine: 'underline',
    },
});