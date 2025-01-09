
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
    buttonContainer: {
        width: 320,
        height: 68,
        marginHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
    },
    button: {
        backgroundColor: 'rgb(99, 207, 139)',
        padding: 10,
        borderRadius: 10,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonLabel: {
        color: 'rgb(36, 32, 28)',
        fontSize: 20,
    },
    buttonIcon: {
        paddingRight: 8,
    },
});