// app directory: A special directory containing only routes and their layouts. Any files added to this directory become a screen inside our native app and a page on the web.

import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

import ImageViewer from "@/components/imageViewer";
import Button from "@/components/Button";

const PlaceholderImage = require("@/assets/images/background-image.png");

export default function Index() {
  return (
    <View style={styles.container}>

      <View style={styles.footerContainer}>
        <Button label="Big bitton" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(36, 32, 28)',
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: 'rgb(247, 233, 233)',
    fontFamily: 'Helvetica',
    fontSize: 20,
  },
  button: {
    color: 'rgb(247, 233, 233)',
    fontFamily: 'Helvetica',
    fontSize: 20,
    textDecorationLine: 'underline',
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 20,
  },
  footerContainer: {
    flex: 1/3,
    alignItems: 'center',
  },
});
