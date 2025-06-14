import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, G, Path, Svg } from "react-native-svg";
import WeatherDetailModal from "./components/WeatherDetailModal";
import { useTemperature } from "./lib/TemperatureContext";

const { width, height } = Dimensions.get("window");
const STATUS_BAR_HEIGHT =
  Platform.OS === "ios" ? 47 : StatusBar.currentHeight || 0;

const WeatherIcon = ({
  type,
  size = 24,
}: {
  type: "sunny" | "rainy";
  size?: number;
}) => {
  if (type === "sunny") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G>
          <Circle cx="12" cy="12" r="6" fill="#FFD700" />
          <Path
            d="M12 2 L12 4 M2 12 L4 12 M12 20 L12 22 M20 12 L22 12"
            stroke="#FFD700"
            strokeWidth="2"
          />
          <Path
            d="M4.93 4.93 L6.34 6.34 M17.66 17.66 L19.07 19.07 M4.93 19.07 L6.34 17.66 M17.66 6.34 L19.07 4.93"
            stroke="#FFD700"
            strokeWidth="2"
          />
        </G>
      </Svg>
    );
  }

  if (type === "rainy") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G>
          <Path
            d="M4 10 Q12 4 20 10"
            stroke="#87CEEB"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M8 14 L7 18 M12 14 L11 18 M16 14 L15 18"
            stroke="#87CEEB"
            strokeWidth="2"
          />
        </G>
      </Svg>
    );
  }

  return null;
};

const ForecastScreen = () => {
  const router = useRouter();
  const { convertTemp, getTempUnit } = useTemperature();
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const scrollY = new Animated.Value(0);
  const refreshRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    // StatusBar.setBackgroundColor("transparent");
  }, []);

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,windspeed_10m_max&timezone=auto`
      );
      setForecast(res.data.daily);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Animated.loop(
      Animated.timing(refreshRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    if (location) {
      await fetchForecast(location.latitude, location.longitude);
    }

    setRefreshing(false);
    refreshRotation.setValue(0);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
      await fetchForecast(latitude, longitude);
    })();
  }, []);

  if (loading || !forecast) {
    return (
      <View style={styles.centered}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 1000 }}
        >
          <Text style={styles.loading}>Loading your week's vibe...</Text>
        </MotiView>
      </View>
    );
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const spin = refreshRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getWeatherEmoji = (precipitation: number, uvIndex: number) => {
    if (precipitation > 0) return "🌧️";
    if (uvIndex > 5) return "☀️";
    return "⛅";
  };

  const getMoodEmoji = (temp: number) => {
    if (temp > 30) return "🥵";
    if (temp > 25) return "😎";
    if (temp > 20) return "😊";
    if (temp > 15) return "😌";
    return "🥶";
  };

  return (
    <LinearGradient
      colors={["#1A1A2E", "#16213E", "#0F3460"]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Animated.View
          style={[styles.headerBg, { opacity: headerBgOpacity }]}
        />
        <BlurView intensity={50} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Mood for the week</Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <ActivityIndicator color="#fff" size="small" />
                </Animated.View>
              ) : (
                <Ionicons name="refresh" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {forecast.time.map((date: string, idx: number) => {
          const avgTemp =
            (forecast.temperature_2m_max[idx] +
              forecast.temperature_2m_min[idx]) /
            2;
          const weatherEmoji = getWeatherEmoji(
            forecast.precipitation_sum[idx],
            forecast.uv_index_max[idx]
          );
          return (
            <TouchableOpacity
              key={date}
              onPress={() =>
                setSelectedDay({
                  date,
                  minTemp: forecast.temperature_2m_min[idx],
                  maxTemp: forecast.temperature_2m_max[idx],
                  precipitation: forecast.precipitation_sum[idx],
                  uvIndex: forecast.uv_index_max[idx],
                  windSpeed: forecast.windspeed_10m_max[idx],
                })
              }
            >
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: idx * 100 }}
                style={styles.forecastCard}
              >
                <BlurView intensity={80} tint="dark" style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
                    <View style={styles.dateContainer}>
                      <Text style={styles.date}>
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </Text>
                      <Text style={styles.dateNumber}>
                        {new Date(date).getDate()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <View style={styles.tempContainer}>
                      <Text style={styles.temp}>
                        {Math.round(forecast.temperature_2m_min[idx])}° →{" "}
                        {Math.round(forecast.temperature_2m_max[idx])}°
                      </Text>
                      <Text style={styles.moodEmoji}>
                        {getMoodEmoji(avgTemp)}
                      </Text>
                    </View>

                    <View style={styles.detailsContainer}>
                      <View style={styles.detailItem}>
                        <Ionicons name="water" size={16} color="#fff" />
                        <Text style={styles.detailText}>
                          {forecast.precipitation_sum[idx]}mm
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="sunny" size={16} color="#fff" />
                        <Text style={styles.detailText}>
                          {forecast.uv_index_max[idx]}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Feather name="wind" size={16} color="#fff" />
                        <Text style={styles.detailText}>
                          {forecast.windspeed_10m_max[idx]}km/h
                        </Text>
                      </View>
                    </View>
                  </View>
                </BlurView>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {selectedDay && (
        <WeatherDetailModal
          visible={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          date={selectedDay.date}
          minTemp={selectedDay.minTemp}
          maxTemp={selectedDay.maxTemp}
          precipitation={selectedDay.precipitation}
          uvIndex={selectedDay.uvIndex}
          windSpeed={selectedDay.windSpeed}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  headerBlur: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  scrollContent: {
    paddingTop: STATUS_BAR_HEIGHT + 80,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: STATUS_BAR_HEIGHT + 15,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  forecastCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
  },
  cardLeft: {
    width: 70,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    paddingRight: 16,
  },
  cardRight: {
    flex: 1,
    marginLeft: 16,
  },
  dateContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  date: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  dateNumber: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  weatherEmoji: {
    fontSize: 28,
  },
  tempContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  temp: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  moodEmoji: {
    fontSize: 26,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
  },
  detailText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
  },
  loading: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1A1A2E",
  },
});

export default ForecastScreen;
