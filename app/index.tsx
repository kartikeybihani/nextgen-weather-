import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ColorValue,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTemperature } from "./lib/TemperatureContext";

const { width, height } = Dimensions.get("window");

interface WeatherData {
  temperature_2m: number;
  weathercode: number;
  windspeed_10m: number;
  relativehumidity_2m: number;
  precipitation: number;
  apparent_temperature: number;
  timezone: string;
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
  isNight: boolean,
  testHour?: number
): [ColorValue, ColorValue] => {
  const hour = testHour ?? new Date().getHours();
  const isDawn = hour >= 5 && hour < 7;
  const isDusk = hour >= 17 && hour < 19;
  const isDay = hour >= 7 && hour < 17;
  const isMidday = hour >= 12 && hour < 15;
  const isLateNight = hour >= 23 || hour < 5;

  // Base themes for different times of day
  const timeThemes: Record<string, [ColorValue, ColorValue]> = {
    dawn: ["#FFB6C1", "#FFC0CB"], // Soft pink to light pink
    day: ["#87CEEB", "#B0E0E6"], // Sky blue to light blue
    midday: ["#FFE5B4", "#FFD700"], // Warm yellow to gold
    dusk: ["#FF7F50", "#FFA07A"], // Coral to light salmon
    night: ["#0A1128", "#1C2541"], // Deep blue to navy
    lateNight: ["#000022", "#000044"], // Much darker night theme
  };

  // Select base theme based on time
  let baseTheme: [ColorValue, ColorValue];
  if (isDawn) baseTheme = timeThemes.dawn;
  else if (isDusk) baseTheme = timeThemes.dusk;
  else if (isMidday) baseTheme = timeThemes.midday;
  else if (isDay) baseTheme = timeThemes.day;
  else if (isLateNight) baseTheme = timeThemes.lateNight;
  else baseTheme = ["#0A1128", "#1C2541"]; // Slightly darker night theme

  // Apply weather adjustments
  if (!code && code !== 0) return baseTheme;
  if (code === 0)
    return isDay
      ? isMidday
        ? ["#FFE5B4", "#FFD700"]
        : ["#FFE5B4", "#FFD700"]
      : baseTheme;
  if ([1, 2, 3].includes(code))
    return isDay ? ["#708090", "#A9A9A9"] : baseTheme;
  if ([45, 48].includes(code))
    return isDay ? ["#708090", "#A9A9A9"] : baseTheme;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return isDay ? ["#2F4F4F", "#4A766E"] : ["#1A237E", "#283593"];
  if ([71, 73, 75, 85, 86].includes(code))
    return isDay ? ["#E0FFFF", "#F0F8FF"] : baseTheme;
  if ([95, 96, 99].includes(code))
    return isDay ? ["#483D8B", "#2F4F4F"] : ["#1A237E", "#0D47A1"];

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
  if (Math.abs(diff) < 2)
    return "🌡️ Temperature twins! Like two peas in a pod!";
  if (diff > 5) return "🔥 Hotter than a summer romance!";
  if (diff > 2) return "☀️ Warming up like a morning coffee!";
  if (diff < -5) return "❄️ Colder than my ex's heart!";
  if (diff < -2) return "🧊 Chilling like a polar bear!";
  return "🌡️ Temperature twins! Like two peas in a pod!";
};

// Add new components for weather effects
const Star = ({
  delay,
  size,
  opacity,
  isMoving = false,
}: {
  delay: number;
  size: number;
  opacity: number;
  isMoving?: boolean;
}) => {
  const twinkle = useRef(new Animated.Value(opacity)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const translateY = useRef(new Animated.Value(Math.random() * height)).current;

  useEffect(() => {
    const twinkleAnimation = Animated.sequence([
      Animated.timing(twinkle, {
        toValue: opacity * 0.3,
        duration: 1000 + Math.random() * 1000,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(twinkle, {
        toValue: opacity,
        duration: 1000 + Math.random() * 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(twinkleAnimation).start();

    if (isMoving) {
      const moveAnimation = Animated.sequence([
        Animated.timing(translateX, {
          toValue: Math.random() * width,
          duration: 5000 + Math.random() * 5000,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(translateY, {
          toValue: Math.random() * height,
          duration: 5000 + Math.random() * 5000,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(moveAnimation).start();
    }
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#fff",
        opacity: twinkle,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
};

const RainDrop = ({
  delay,
  duration,
  startX,
}: {
  delay: number;
  duration: number;
  startX: number;
}) => {
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: height + 20,
          duration,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        transform: [{ translateY }],
        width: 2,
        height: 20,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 1,
      }}
    />
  );
};

const ShootingStar = () => {
  const translateX = useRef(new Animated.Value(width)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      translateX.setValue(width);
      translateY.setValue(Math.random() * height * 0.3);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -100,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height * 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(startAnimation, Math.random() * 5000 + 5000);
      });
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 100,
        height: 2,
        backgroundColor: "#fff",
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: "45deg" }],
      }}
    >
      <View
        style={{
          position: "absolute",
          right: 0,
          width: 20,
          height: 2,
          backgroundColor: "#fff",
          opacity: 0.5,
        }}
      />
    </Animated.View>
  );
};

const WeatherEffects = ({
  weatherCode,
  isNight,
  isLateNight,
}: {
  weatherCode: number;
  isNight: boolean;
  isLateNight: boolean;
}) => {
  if (isNight) {
    return (
      <View style={StyleSheet.absoluteFill}>
        {[...Array(isLateNight ? 100 : 50)].map((_, i) => (
          <Star
            key={i}
            delay={i * 100}
            size={1 + Math.random() * 2}
            opacity={0.3 + Math.random() * 0.7}
            isMoving={isLateNight}
          />
        ))}
        {isLateNight && <ShootingStar />}
      </View>
    );
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return (
      <View style={StyleSheet.absoluteFill}>
        {[...Array(30)].map((_, i) => (
          <RainDrop
            key={i}
            delay={i * 100}
            duration={1000 + Math.random() * 1000}
            startX={Math.random() * width}
          />
        ))}
      </View>
    );
  }

  return null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { isCelsius, toggleUnit, convertTemp, getTempUnit } = useTemperature();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [historicalWeather, setHistoricalWeather] =
    useState<HistoricalWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const spinValue = new Animated.Value(0);
  const [isLateNight, setIsLateNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour <= 6);
      setIsLateNight(hour >= 23 || hour <= 5);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,precipitation,apparent_temperature&timezone=auto`
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

  const theme = getWeatherTheme(weather.weathercode, isNight, undefined);
  const icon = getWeatherIcon(weather.weathercode);

  return (
    <LinearGradient colors={theme} style={styles.container}>
      <WeatherEffects
        weatherCode={weather.weathercode}
        isNight={isNight}
        isLateNight={isLateNight}
      />
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.4)"]}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.tempUnitButton}
                onPress={toggleUnit}
              >
                <Text style={styles.tempUnitText}>{getTempUnit()}</Text>
              </TouchableOpacity>
            </View>
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
              <Ionicons name={icon} size={80} color="#fff" />
              <Text style={styles.temp}>
                {convertTemp(weather.temperature_2m).toFixed(1)}
                {getTempUnit()}
              </Text>
              <View style={styles.feelsLikeContainer}>
                <Ionicons name="thermometer-outline" size={16} color="#fff" />
                <Text style={styles.feelsLikeText}>
                  Feels like{" "}
                  {convertTemp(weather.apparent_temperature).toFixed(1)}
                  {getTempUnit()}
                </Text>
              </View>
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
              <Text style={styles.factTitle}>Temperature Time Machine</Text>
              <View style={styles.tempComparison}>
                <View style={styles.tempBox}>
                  <Text style={styles.tempLabel}>Last Year</Text>
                  <Text style={styles.tempValue}>
                    {convertTemp(historicalWeather.temperature).toFixed(1)}
                    {getTempUnit()}
                  </Text>
                </View>
                <Text style={styles.tempArrow}>→</Text>
                <View style={styles.tempBox}>
                  <Text style={styles.tempLabel}>Today</Text>
                  <Text style={styles.tempValue}>
                    {convertTemp(weather.temperature_2m).toFixed(1)}
                    {getTempUnit()}
                  </Text>
                </View>
              </View>
              <Text style={styles.factText}>
                {getHistoricalComparison(
                  convertTemp(weather.temperature_2m),
                  convertTemp(historicalWeather.temperature)
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
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
  },
  tempUnitButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tempUnitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.9,
  },
  city: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  time: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
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
    marginBottom: 15,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
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
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  factText: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.9,
    textAlign: "center",
    lineHeight: 18,
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
    padding: 15,
    borderRadius: 20,
    marginTop: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  tempComparison: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  tempBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 100,
  },
  tempLabel: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  tempValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  tempArrow: {
    color: "#fff",
    fontSize: 24,
    marginHorizontal: 10,
    opacity: 0.7,
  },
  feelsLikeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  feelsLikeText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.9,
  },
});
