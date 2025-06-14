import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ColorValue,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WeatherData {
  temperature_2m: number;
  weathercode: number;
  windspeed_10m: number;
  relativehumidity_2m: number;
  precipitation: number;
}

interface HistoricalWeatherData {
  temperature: number;
  date: string;
  difference: number;
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
  code: number | undefined,
  isNight: boolean
): [ColorValue, ColorValue] => {
  const hour = new Date().getHours();
  const isDawn = hour >= 5 && hour < 7;
  const isDusk = hour >= 17 && hour < 19;
  const isDay = hour >= 7 && hour < 17;
  const isLateNight = hour >= 23 || hour < 5;

  // Base themes for different times of day
  const timeThemes: Record<string, [ColorValue, ColorValue]> = {
    dawn: ["#FFB6C1", "#FFC0CB"], // Soft pink to light pink
    day: ["#87CEEB", "#B0E0E6"], // Sky blue to light blue
    dusk: ["#FF7F50", "#FFA07A"], // Coral to light salmon
    night: ["#0A1128", "#1C2541"], // Deep blue to navy
    lateNight: ["#000033", "#000066"], // Darker blue for late night
  };

  // Weather-specific adjustments
  const weatherAdjustments: Record<
    string,
    (base: [ColorValue, ColorValue]) => [ColorValue, ColorValue]
  > = {
    sunny: (base) => (isDay ? ["#FFD700", "#FFA500"] : base), // Golden to orange for sunny days
    cloudy: (base) => (isDay ? ["#708090", "#A9A9A9"] : base), // Gray for cloudy
    rainy: (base) => (isDay ? ["#2F4F4F", "#4A766E"] : ["#1A237E", "#283593"]), // Darker for rain
    snowy: (base) => (isDay ? ["#E0FFFF", "#F0F8FF"] : base), // Light blue for snow
    stormy: (base) => (isDay ? ["#483D8B", "#2F4F4F"] : ["#1A237E", "#0D47A1"]), // Dark for storms
  };

  // Select base theme based on time
  let baseTheme: [ColorValue, ColorValue];
  if (isDawn) baseTheme = timeThemes.dawn;
  else if (isDusk) baseTheme = timeThemes.dusk;
  else if (isDay) baseTheme = timeThemes.day;
  else if (isLateNight) baseTheme = timeThemes.lateNight;
  else baseTheme = timeThemes.night;

  // Apply weather adjustments
  if (!code && code !== 0) return baseTheme;
  if (code === 0) return weatherAdjustments.sunny(baseTheme);
  if ([1, 2, 3].includes(code)) return weatherAdjustments.cloudy(baseTheme);
  if ([45, 48].includes(code)) return weatherAdjustments.cloudy(baseTheme);
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return weatherAdjustments.rainy(baseTheme);
  if ([71, 73, 75, 85, 86].includes(code))
    return weatherAdjustments.snowy(baseTheme);
  if ([95, 96, 99].includes(code)) return weatherAdjustments.stormy(baseTheme);

  return baseTheme;
};

const getWeatherEmoji = (code: number | undefined): string => {
  if (!code && code !== 0) return "🌫️";
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌫️";
};

const getWeatherMood = (code: number | undefined): string => {
  if (!code && code !== 0) return "Mysterious vibes";
  if (code === 0) return "Perfect beach day!";
  if ([1, 2, 3].includes(code)) return "Partly perfect!";
  if ([45, 48].includes(code)) return "Foggy adventures";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return "Rainy day vibes";
  if ([71, 73, 75, 85, 86].includes(code)) return "Winter wonderland";
  if ([95, 96, 99].includes(code)) return "Thunder & lightning!";
  return "Mysterious vibes";
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

const WeatherMetric = ({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) => (
  <View style={styles.metricContainer}>
    <Ionicons name={icon} size={24} color="#fff" />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const QuickAction = ({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <Ionicons name={icon} size={28} color="#fff" />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const getHistoricalComparison = (
  current: number,
  historical: number
): string => {
  const diff = current - historical;
  if (Math.abs(diff) < 2) return "Similar to last year";
  if (diff > 5) return "Much warmer than last year";
  if (diff > 2) return "Warmer than last year";
  if (diff < -5) return "Much colder than last year";
  if (diff < -2) return "Colder than last year";
  return "Similar to last year";
};

export default function HomeScreen() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [historicalWeather, setHistoricalWeather] =
    useState<HistoricalWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isNight, setIsNight] = useState(false);
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour <= 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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

    const startRotation = () => {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        { iterations: -1 }
      ).start();
    };
    startRotation();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const currentDate = new Date();
      const lastYear = new Date(
        currentDate.getFullYear() - 1,
        currentDate.getMonth(),
        currentDate.getDate()
      );

      // Fetch current weather
      const currentRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,precipitation&timezone=auto`
      );
      setWeather(currentRes.data.current);

      // Fetch historical weather
      const historicalRes = await axios.get(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${
          lastYear.toISOString().split("T")[0]
        }&end_date=${
          lastYear.toISOString().split("T")[0]
        }&daily=temperature_2m_mean`
      );

      if (historicalRes.data.daily) {
        setHistoricalWeather({
          temperature: historicalRes.data.daily.temperature_2m_mean[0],
          date: lastYear.toISOString().split("T")[0],
          difference:
            currentRes.data.current.temperature_2m -
            historicalRes.data.daily.temperature_2m_mean[0],
        });
      }
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

  const theme = getWeatherTheme(weather.weathercode, isNight);
  const icon = getWeatherIcon(weather.weathercode);

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.4)"]}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <Text style={styles.city}>{location?.city}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.mood}>
              {getWeatherMood(weather.weathercode)}{" "}
              {getWeatherEmoji(weather.weathercode)}
            </Text>
          </View>

          <BlurView intensity={90} tint="dark" style={styles.glassCard}>
            <View style={styles.temperatureContainer}>
              <Animated.View
                style={[
                  styles.weatherIconContainer,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <Ionicons name={icon} size={80} color="#fff" />
              </Animated.View>
              <Text style={styles.temp}>{weather.temperature_2m}°C</Text>
            </View>

            <View style={styles.metricsContainer}>
              <WeatherMetric
                icon="water-outline"
                value={`${weather.relativehumidity_2m}%`}
                label="Humidity"
              />
              <WeatherMetric
                icon="airplane-outline"
                value={`${weather.windspeed_10m} km/h`}
                label="Wind"
              />
              <WeatherMetric
                icon="rainy-outline"
                value={`${weather.precipitation} mm`}
                label="Rain"
              />
            </View>
          </BlurView>

          <View style={styles.quickActionsContainer}>
            <QuickAction
              icon="map-outline"
              label="🌏 World Tour"
              onPress={() => router.push("/map")}
            />
            <QuickAction
              icon="calendar-outline"
              label="🔮 Check your vibe"
              onPress={() => router.push("/forecast")}
            />
          </View>

          {historicalWeather && (
            <View style={styles.historicalContainer}>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineYear}>Last Year</Text>
                      <Text style={styles.timelineTemp}>
                        {historicalWeather.temperature.toFixed(1)}°C
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineYear}>Today</Text>
                      <Text style={styles.timelineTemp}>
                        {weather.temperature_2m.toFixed(1)}°C
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.historicalNote}>
                {getHistoricalComparison(
                  weather.temperature_2m,
                  historicalWeather.temperature
                )}
              </Text>
            </View>
          )}

          <WeatherFactCard />
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  city: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  date: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  mood: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginTop: 6,
    textAlign: "center",
  },
  glassCard: {
    width: "100%",
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 15,
  },
  weatherIconContainer: {
    marginBottom: 20,
  },
  temp: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 25,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  metricContainer: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  quickAction: {
    width: "48%",
    height: 90,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  quickActionLabel: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  factCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  factTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  factText: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    textAlign: "center",
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  temperatureContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  historicalContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  timelineLine: {
    width: 2,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    position: "absolute",
    left: 15,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 30,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineYear: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  timelineTemp: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  historicalNote: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.9,
    fontStyle: "italic",
    marginTop: 10,
  },
});
