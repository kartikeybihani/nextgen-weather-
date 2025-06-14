import * as Location from "expo-location";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TemperatureProvider } from "./lib/TemperatureContext";
import { registerForPushNotificationsAsync } from "./utils/notifications";

export default function RootLayout() {
  useEffect(() => {
    async function setupNotifications() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission not granted");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        await registerForPushNotificationsAsync(
          location.coords.latitude,
          location.coords.longitude
        );
      } catch (error) {
        console.error("Error getting location:", error);
      }
    }

    setupNotifications();
  }, []);

  return (
    <TemperatureProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="forecast" />
          <Stack.Screen name="map" />
        </Stack>
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </TemperatureProvider>
  );
}
