import { Image, StyleSheet, View, type ViewStyle } from "react-native";

type RabbitAvatarProps = {
  size?: number;
  style?: ViewStyle;
  accent?: string;
};

export function RabbitAvatar({ size = 76, style, accent = "#FDE5CE" }: RabbitAvatarProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: accent }, style]}>
      <Image source={require("../assets/images/icon.png")} style={{ width: size * 0.84, height: size * 0.84, borderRadius: size * 0.25 }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
