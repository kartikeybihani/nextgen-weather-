import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import CustomMarker from "./components/CustomMarker";
import GlassmorphicButton from "./components/GlassmorphicButton";
import RocketButton from "./components/RocketButton";
import SpaceTheme from "./components/SpaceTheme";
import WeatherBottomSheet from "./components/WeatherBottomSheet";
import ZoomControls from "./components/ZoomControls";

const { width, height } = Dimensions.get("window");

// Map zoom configuration
const MIN_ZOOM_DELTA = 0.005; // Neighborhood view
const MAX_ZOOM_DELTA = 120; // World view

interface SearchResult {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

const FAMOUS_CITIES = [
  {
    city: "New York",
    state: "New York",
    country: "USA",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    city: "London",
    state: "England",
    country: "UK",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    city: "Tokyo",
    state: "Tokyo",
    country: "Japan",
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    city: "Paris",
    state: "Île-de-France",
    country: "France",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    latitude: -33.8688,
    longitude: 151.2093,
  },
  {
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    city: "Singapore",
    state: "Singapore",
    country: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    city: "Cairo",
    state: "Cairo",
    country: "Egypt",
    latitude: 30.0444,
    longitude: 31.2357,
  },
  {
    city: "Rio de Janeiro",
    state: "Rio de Janeiro",
    country: "Brazil",
    latitude: -22.9068,
    longitude: -43.1729,
  },
];

const RANDOM_LOCATIONS = [
  { lat: 48.8566, lng: 2.3522, name: "Paris, France" },
  { lat: 51.5074, lng: -0.1278, name: "London, UK" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
  { lat: 40.7128, lng: -74.006, name: "New York, USA" },
  { lat: 37.7749, lng: -122.4194, name: "San Francisco, USA" },
  { lat: 55.7558, lng: 37.6173, name: "Moscow, Russia" },
  { lat: 39.9042, lng: 116.4074, name: "Beijing, China" },
  { lat: 28.6139, lng: 77.209, name: "New Delhi, India" },
  { lat: 19.076, lng: 72.8777, name: "Mumbai, India" },
  { lat: 31.2304, lng: 121.4737, name: "Shanghai, China" },
];

const CITY_SUGGESTIONS: { [key: string]: string[] } = {
  a: ["Amsterdam", "Athens", "Atlanta", "Austin"],
  b: ["Bangkok", "Barcelona", "Beijing", "Berlin", "Boston"],
  c: ["Cairo", "Chicago", "Copenhagen"],
  d: ["Delhi", "Denver", "Dubai"],
  h: ["Hamburg", "Helsinki", "Hong Kong"],
  i: ["Istanbul"],
  j: ["Jakarta", "Jerusalem"],
  l: ["London", "Los Angeles", "Lisbon"],
  m: ["Madrid", "Milan", "Moscow", "Mumbai"],
  n: ["New York", "New Delhi", "Nairobi"],
  p: ["Paris", "Prague"],
  r: ["Rome", "Rio de Janeiro"],
  s: ["San Francisco", "Seoul", "Shanghai", "Singapore", "Sydney"],
  t: ["Tokyo", "Toronto"],
  v: ["Vienna", "Vancouver"],
  w: ["Warsaw", "Washington"],
};

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(
    null
  );
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFamousCities, setShowFamousCities] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWidth = useSharedValue(0.85);
  const searchOpacity = useSharedValue(0);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showSpaceTheme, setShowSpaceTheme] = useState(false);
  const searchScale = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setCurrentRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);

    if (text.length > 2) {
      try {
        const results = await Location.geocodeAsync(text);
        const formattedResults = await Promise.all(
          results.map(async (result) => {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            return {
              latitude: result.latitude,
              longitude: result.longitude,
              city: address?.city || "Unknown City",
              state: address?.region || "Unknown State",
              country: address?.country || "Unknown Country",
            };
          })
        );
        setSearchResults(formattedResults);
      } catch (error) {
        console.error("Search error:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate the response data
      if (!data.current) {
        console.error("Invalid weather data received:", data);
        throw new Error("Invalid weather data format");
      }

      // Convert weather code to description
      const getWeatherDescription = (code: number): string => {
        const weatherCodes: { [key: number]: string } = {
          0: "Clear sky",
          1: "Mainly clear",
          2: "Partly cloudy",
          3: "Overcast",
          45: "Foggy",
          48: "Depositing rime fog",
          51: "Light drizzle",
          53: "Moderate drizzle",
          55: "Dense drizzle",
          61: "Slight rain",
          63: "Moderate rain",
          65: "Heavy rain",
          71: "Slight snow",
          73: "Moderate snow",
          75: "Heavy snow",
          77: "Snow grains",
          80: "Slight rain showers",
          81: "Moderate rain showers",
          82: "Violent rain showers",
          85: "Slight snow showers",
          86: "Heavy snow showers",
          95: "Thunderstorm",
          96: "Thunderstorm with slight hail",
          99: "Thunderstorm with heavy hail",
        };
        return weatherCodes[code] || "Unknown";
      };

      setWeatherData({
        temperature: data.current.temperature_2m,
        description: getWeatherDescription(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        feelsLike: data.current.apparent_temperature,
      });
    } catch (error) {
      console.error("Error fetching weather:", error);
      // Set default weather data in case of error
      setWeatherData({
        temperature: 25,
        description: "Unknown",
        humidity: 0,
        windSpeed: 0,
        feelsLike: 25,
      });
    }
  };

  const handleLocationSelect = (result: SearchResult) => {
    // Animate the selection
    searchScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setSelectedLocation(result);
    setShowBottomSheet(true);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setShowFamousCities(false);

    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    fetchWeatherData(result.latitude, result.longitude);
  };

  const handleSuggestionSelect = async (city: string) => {
    try {
      const results = await Location.geocodeAsync(city);
      if (results.length > 0) {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });

        handleLocationSelect({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          city: address?.city || city,
          state: address?.region || "Unknown State",
          country: address?.country || "Unknown Country",
        });
      }
    } catch (error) {
      console.error("Error selecting suggestion:", error);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    const [address] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (address) {
      setSelectedLocation({
        latitude,
        longitude,
        city: address.city || "Unknown City",
        state: address.region || "Unknown State",
        country: address.country || "Unknown Country",
      });
      setShowBottomSheet(true);
      fetchWeatherData(latitude, longitude);

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setCurrentRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const handleZoomIn = () => {
    if (currentRegion) {
      const newDelta = Math.max(
        currentRegion.latitudeDelta * 0.5,
        MIN_ZOOM_DELTA
      );
      const newRegion = {
        ...currentRegion,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };
      setCurrentRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 300);
    }
  };

  const handleZoomOut = () => {
    if (currentRegion) {
      const newDelta = Math.min(
        currentRegion.latitudeDelta * 2,
        MAX_ZOOM_DELTA
      );
      const newRegion = {
        ...currentRegion,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };
      setCurrentRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 300);
    }
  };

  const handleClose = () => {
    setShowBottomSheet(false);
    setSelectedLocation(null);

    // Perform 4 zoom outs with increasing delays
    handleZoomOut();
    setTimeout(handleZoomOut, 300);
    setTimeout(handleZoomOut, 600);
    setTimeout(handleZoomOut, 900);
  };

  const handleSearchFocus = () => {
    setIsSearching(true);
    setShowFamousCities(true);
    setIsSearchFocused(true);
    searchWidth.value = withSpring(1, { damping: 15, stiffness: 100 });
    searchOpacity.value = withTiming(1, { duration: 300 });
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setShowFamousCities(false);
    setIsSearchFocused(false);
    searchWidth.value = withSpring(0.85, { damping: 15, stiffness: 100 });
    searchOpacity.value = withTiming(0, { duration: 300 });
    Keyboard.dismiss();
    handleZoomOut();
    setTimeout(handleZoomOut, 300);
    setTimeout(handleZoomOut, 600);
    setTimeout(handleZoomOut, 900);
  };

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    width: `${searchWidth.value * 100}%`,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
  }));

  const handleRocketPress = () => {
    setShowSpaceTheme(true);
  };

  const handleSpaceAnimationComplete = () => {
    setShowSpaceTheme(false);
    const randomLocation =
      RANDOM_LOCATIONS[Math.floor(Math.random() * RANDOM_LOCATIONS.length)];

    const newRegion = {
      latitude: randomLocation.lat,
      longitude: randomLocation.lng,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);

    // Fetch weather for the new location
    fetchWeatherData(randomLocation.lat, randomLocation.lng);

    // Set selected location
    setSelectedLocation({
      latitude: randomLocation.lat,
      longitude: randomLocation.lng,
      city: randomLocation.name.split(",")[0],
      state: randomLocation.name.split(",")[1]?.trim() || "",
      country: randomLocation.name.split(",")[2]?.trim() || "",
    });
    setShowBottomSheet(true);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
        initialRegion={currentRegion || undefined}
        onRegionChangeComplete={setCurrentRegion}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
          >
            <CustomMarker />
          </Marker>
        )}
      </MapView>

      <View style={[styles.header, isSearchFocused && styles.headerExpanded]}>
        {!isSearchFocused && (
          <GlassmorphicButton
            icon="arrow-back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        )}
        <Animated.View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerExpanded,
            searchAnimatedStyle,
            { transform: [{ scale: searchScale }] },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {isSearchFocused && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {(isSearching || showFamousCities) && (
        <Animated.View style={[styles.searchOverlay, overlayAnimatedStyle]}>
          {showFamousCities && !searchQuery && (
            <View style={styles.famousCitiesContainer}>
              <Text style={styles.famousCitiesTitle}>Popular Cities</Text>
              <FlatList
                data={FAMOUS_CITIES}
                keyExtractor={(item) => `${item.city}-${item.country}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.famousCityItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <Text style={styles.famousCityText}>
                      {item.city}, {item.state}, {item.country}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) =>
                  `${item.latitude}-${item.longitude}-${index}`
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <Text style={styles.searchResultText}>
                      {item.city}, {item.state}, {item.country}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </Animated.View>
      )}

      {!isSearchFocused && (
        <>
          <View style={styles.exploreButtonContainer}>
            <RocketButton onPress={handleRocketPress} />
          </View>

          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            showBottomSheet={showBottomSheet}
          />
        </>
      )}

      {showBottomSheet && selectedLocation && weatherData && (
        <WeatherBottomSheet
          city={selectedLocation.city}
          state={selectedLocation.state}
          country={selectedLocation.country}
          weatherData={weatherData}
          onClose={handleClose}
        />
      )}

      {showSpaceTheme && (
        <SpaceTheme onAnimationComplete={handleSpaceAnimationComplete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 1000,
  },
  headerExpanded: {
    left: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainerExpanded: {
    marginTop: 0,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginRight: 10,
  },
  cancelButton: {
    paddingHorizontal: 10,
    height: "100%",
    justifyContent: "center",
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  searchOverlay: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: "white",
    zIndex: 999,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  searchResultText: {
    fontSize: 16,
    color: "#333",
  },
  famousCitiesContainer: {
    flex: 1,
    padding: 20,
  },
  famousCitiesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  famousCityItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  famousCityText: {
    fontSize: 16,
    color: "#333",
  },
  exploreButtonContainer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
