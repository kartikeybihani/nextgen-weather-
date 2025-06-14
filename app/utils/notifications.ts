import * as Notifications from "expo-notifications";
import supabase from "../lib/supabase";

export async function registerForPushNotificationsAsync(latitude?: number, longitude?: number) {
  // if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const { error } = await supabase.from("device_tokens").upsert({ 
      token,
      latitude,
      longitude 
    }, { onConflict: "token" });

    if (error) {
      throw error;
    }

    console.log("✅ Push token saved to Supabase");
    return token;
  } catch (err) {
    console.error("❌ Error saving push token:", err);
    return null;
  }
}

export default registerForPushNotificationsAsync;
