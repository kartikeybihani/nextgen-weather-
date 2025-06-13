import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ColorValue,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WeatherData {
  temperature_2m: number;
  weathercode: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
}

const getWeatherIcon = (code: number | undefined): any => {
  if (!code && code !== 0) return "sunny-outline";
  if (code === 0) return "sunny-outline";
  if ([1, 2, 3].includes(code)) return "partly-sunny-outline";
  if ([45, 48].includes(code)) return "cloudy-outline";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return "rainy-outline";
  if ([71, 73, 75, 85, 86].includes(code)) return "snow-outline";
  if ([95, 96, 99].includes(code)) return "thunderstorm-outline";
  return "cloudy-outline";
};

const getWeatherTheme = (
  code: number | undefined
): [ColorValue, ColorValue] => {
  if (!code && code !== 0) return ["#1a1a1a", "#2d2d2d"];
  if (code === 0) return ["#FFD700", "#FFA500"];
  if ([1, 2, 3].includes(code)) return ["#87CEEB", "#B0E0E6"];
  if ([45, 48].includes(code)) return ["#708090", "#A9A9A9"];
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return ["#2F4F4F", "#4A766E"];
  if ([71, 73, 75, 85, 86].includes(code)) return ["#E0FFFF", "#F0F8FF"];
  if ([95, 96, 99].includes(code)) return ["#483D8B", "#2F4F4F"];
  return ["#1a1a1a", "#2d2d2d"];
};

const WEATHER_FACTS = [
  "Lightning can heat the air to 50,000°F - hotter than the sun!",
  "A single snowflake can contain up to 200 ice crystals.",
  "Raindrops are shaped like hamburger buns, not teardrops.",
  "Clouds can weigh over a million pounds.",
  "A hurricane can release energy equal to 10 atomic bombs per second.",
];

const WeatherFactCard = () => {
  const [fact, setFact] = useState(WEATHER_FACTS[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * WEATHER_FACTS.length);
    setFact(WEATHER_FACTS[randomIndex]);
  }, []);

  return (
    <View style={styles.factCard}>
      <Text style={styles.factTitle}>Did You Know?</Text>
      <Text style={styles.factText}>{fact}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      // Get city name using reverse geocoding
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      setLocation({
        latitude,
        longitude,
        city: address?.city || "Unknown Location",
      });

      fetchWeather(latitude, longitude);
    })();
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
      );
      setWeather(res.data.current);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !weather) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const theme = getWeatherTheme(weather.weathercode);
  const icon = getWeatherIcon(weather.weathercode);

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
        style={styles.overlay}
      >
        <BlurView intensity={80} tint="dark" style={styles.glassCard}>
          <Ionicons name={icon} size={80} color="#fff" style={styles.icon} />
          <Text style={styles.temp}>{weather.temperature_2m}°C</Text>
          <Text style={styles.city}>{location?.city}</Text>
          <WeatherFactCard />
          <TouchableOpacity
            style={styles.vibeButton}
            onPress={() => router.push("/forecast")}
          >
            <Text style={styles.vibeText}>
              Check how your vibe looks this week 🔮
            </Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glassCard: {
    width: "100%",
    padding: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    marginBottom: 20,
  },
  temp: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  vibeButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
  },
  vibeText: {
    color: "#fff",
    fontSize: 16,
  },
  factCard: {
    width: "100%",
    marginTop: 20,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  factTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  factText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  city: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
