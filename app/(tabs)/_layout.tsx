import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#E96E2B", tabBarInactiveTintColor: "#9A9289", tabBarButton: HapticTab, tabBarStyle: { height: 58 + bottomPadding, paddingTop: 7, paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: "#EEE7DE" }, tabBarLabelStyle: { fontWeight: "800", fontSize: 11 } }}>
    <Tabs.Screen name="index" options={{ title: "今天", tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" size={size} color={color} /> }} />
    <Tabs.Screen name="map" options={{ title: "闯关", tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} /> }} />
    <Tabs.Screen name="review" options={{ title: "复习", tabBarIcon: ({ color, size }) => <MaterialIcons name="style" size={size} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: "我的", tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} /> }} />
  </Tabs>;
}
