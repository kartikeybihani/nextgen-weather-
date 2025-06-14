import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

interface WeatherBottomSheetProps {
  city: string;
  state: string;
  country: string;
  weatherData: WeatherData;
  onClose: () => void;
}

const getWeatherOneLiner = (description: string, temp: number): string => {
  const oneLiners = {
    sunny: [
      "Time to break out the sunglasses and sunscreen! 😎",
      "Perfect weather for a beach day! 🏖️",
      "Don't forget your SPF 1000! 🌞",
    ],
    cloudy: [
      "Cloudy with a chance of... coffee? ☕",
      "The sky's having a bad hair day! ☁️",
      "Clouds are just sky pillows! 💭",
    ],
    rainy: [
      "Singing in the rain? More like running! 🌧️",
      "Time to test your umbrella's loyalty! ☔",
      "The plants are having a party! 🌱",
    ],
    snowy: [
      "Winter is coming... and it's here! ❄️",
      "Time to build a snowman! ⛄",
      "Hot chocolate weather! 🍫",
    ],
    default: [
      "Weather's being indecisive today! 🤔",
      "Mother Nature's mood swings! 🌪️",
      "Weather forecast: ¯\\_(ツ)_/¯",
    ],
  };

  const getCategory = (desc: string, temp: number) => {
    const lowerDesc = desc.toLowerCase();
    if (lowerDesc.includes("sun") || lowerDesc.includes("clear"))
      return "sunny";
    if (lowerDesc.includes("cloud")) return "cloudy";
    if (lowerDesc.includes("rain") || lowerDesc.includes("drizzle"))
      return "rainy";
    if (lowerDesc.includes("snow") || lowerDesc.includes("sleet"))
      return "snowy";
    return "default";
  };

  const category = getCategory(description, temp);
  const lines = oneLiners[category];
  return lines[Math.floor(Math.random() * lines.length)];
};

const WeatherBottomSheet: React.FC<WeatherBottomSheetProps> = ({
  city,
  state,
  country,
  weatherData,
  onClose,
}) => {
  const translateY = useSharedValue(200);
  const progress = useSharedValue(0);
  const oneLinerOpacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
    progress.value = withTiming(1, { duration: 800 });
    oneLinerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const weatherLineStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0, 1]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const oneLinerStyle = useAnimatedStyle(() => ({
    opacity: oneLinerOpacity.value,
    transform: [
      {
        translateY: interpolate(oneLinerOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const oneLiner = getWeatherOneLiner(
    weatherData.description,
    weatherData.temperature
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.handle} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Text style={styles.locationText}>
              {city}, {state}, {country}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.weatherLine, weatherLineStyle]} />

        <View style={styles.weatherContainer}>
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperature}>
              {Math.round(weatherData.temperature)}°
            </Text>
            <Text style={styles.weatherDescription}>
              {weatherData.description}
            </Text>
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MaterialIcons name="water-drop" size={20} color="#666" />
              <Text style={styles.detailText}>{weatherData.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="air" size={20} color="#666" />
              <Text style={styles.detailText}>
                {weatherData.windSpeed} km/h
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="thermostat" size={20} color="#666" />
              <Text style={styles.detailText}>
                Feels {Math.round(weatherData.feelsLike)}°
              </Text>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.oneLinerContainer, oneLinerStyle]}>
          <View style={styles.quoteIcon}>
            <MaterialIcons name="format-quote" size={24} color="#FFC107" />
          </View>
          <Text style={styles.oneLinerText}>{oneLiner}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: "blur(10px)",
    minHeight: 240,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
  },
  weatherLine: {
    height: 3,
    width: "100%",
    backgroundColor: "rgba(255, 193, 7, 0.8)",
    borderRadius: 2,
    marginBottom: 20,
    shadowColor: "#FFC107",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  weatherContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    padding: 16,
    borderRadius: 16,
  },
  temperatureContainer: {
    alignItems: "flex-start",
  },
  temperature: {
    fontSize: 42,
    fontWeight: "700",
    color: "#333",
  },
  weatherDescription: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    textTransform: "capitalize",
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  detailItem: {
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 6,
    borderRadius: 10,
    minWidth: 60,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  oneLinerContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 193, 7, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.15)",
    position: "relative",
    overflow: "hidden",
  },
  quoteIcon: {
    position: "absolute",
    top: -8,
    left: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#FFC107",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  oneLinerText: {
    fontSize: 15,
    color: "#555",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    fontWeight: "500",
  },
});

export default WeatherBottomSheet;
