import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import supabase from "../lib/supabase";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

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

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("📬 Push Token:", token);

  try {
    await supabase.from("device_tokens").upsert({ token });
  } catch (err) {
    console.error("Error saving token:", err);
  }

  return token;
}
