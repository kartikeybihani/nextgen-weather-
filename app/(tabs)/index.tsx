import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WeatherData {
  temperature_2m: number;
  weathercode: number;
}

const HomeScreen = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  const getLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });
      setLocation(location);
      fetchWeather(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      setLocationError("Failed to get location");
      console.error(error);
    }
  };

  useEffect(() => {
    getLocation();
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/bg.jpeg")}
      style={styles.container}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
        style={styles.overlay}
      >
        <BlurView intensity={70} tint="light" style={styles.glassCard}>
          <Text style={styles.city}>
            {locationError ? "Location Error" : "Your Location"}
          </Text>
          <Text style={styles.temp}>{weather?.temperature_2m}°C</Text>
          <Text style={styles.desc}>Weather Code: {weather?.weathercode}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={getLocation}>
            <Text style={styles.refreshText}>Refresh Location</Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glassCard: {
    width: "80%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    alignItems: "center",
  },
  city: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
  },
  temp: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  desc: {
    fontSize: 16,
    color: "#eee",
    marginTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  refreshButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
  },
  refreshText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default HomeScreen;
