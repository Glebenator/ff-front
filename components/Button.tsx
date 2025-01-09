import { View, Pressable, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { sharedStyles } from "../styles/sharedStyles";

type Props = {
    label: string;
    theme?: 'primary'
};

export default function Button({ label, theme }: Props){
    if (theme === 'primary'){
        return(
            <View style={[sharedStyles.buttonContainer, { borderWidth: 4, borderColor: 'rgb(99, 207, 139)', borderRadius: 18 }]}>
                <Pressable style={[sharedStyles.button, { backgroundColor: 'rgb(255,255,255)'}]} onPress={() => alert('Button pressed')}>
                    <FontAwesome name="picture-o" size={18} color="rgb(0, 0, 0)" style={sharedStyles.buttonIcon} />
                    <Text style={sharedStyles.buttonLabel}>{label}</Text>
                </Pressable>
            </View>
        );
    }
    return(
        <View style={sharedStyles.buttonContainer}>
            <Pressable style={sharedStyles.button} onPress={() => alert('Button pressed')}>
                <Text style={sharedStyles.buttonLabel}>{label}</Text>
            </Pressable>
        </View>
    );
}