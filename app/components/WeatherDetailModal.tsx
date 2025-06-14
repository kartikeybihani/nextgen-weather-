import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const { width, height } = Dimensions.get("window");

interface WeatherDetailModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  minTemp: number;
  maxTemp: number;
  precipitation: number;
  uvIndex: number;
  windSpeed: number;
}

const WeatherDetailModal = ({
  visible,
  onClose,
  date,
  minTemp,
  maxTemp,
  precipitation,
  uvIndex,
  windSpeed,
}: WeatherDetailModalProps) => {
  const [hourlyData, setHourlyData] = useState<number[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    // Generate sample hourly temperature data
    const generateHourlyData = () => {
      const data = [];
      for (let i = 0; i < 24; i++) {
        const baseTemp = (minTemp + maxTemp) / 2;
        const variation =
          Math.sin((i / 24) * Math.PI) * ((maxTemp - minTemp) / 2);
        data.push(Math.round((baseTemp + variation) * 10) / 10);
      }
      return data;
    };
    setHourlyData(generateHourlyData());
  }, [minTemp, maxTemp]);

  const chartData = {
    labels: ["00:00", "06:00", "12:00", "18:00", "24:00"],
    datasets: [
      {
        data: hourlyData,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "rgba(15, 32, 39, 0.8)",
    backgroundGradientTo: "rgba(44, 83, 100, 0.8)",
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4A90E2",
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: "500",
    },
    fillShadowGradient: "#4A90E2",
    fillShadowGradientOpacity: 0.3,
    decimalPlaces: 0,
    formatYLabel: (value: string) => `${value}°`,
    count: 5,
    yAxisLabel: "°C",
    yAxisSuffix: "°",
    yAxisInterval: 1,
    paddingRight: 40,
    paddingTop: 20,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
        <MotiView
          from={{ translateY: height }}
          animate={{ translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={styles.modalContent}
        >
          <LinearGradient
            colors={[
              "rgba(15, 32, 39, 0.95)",
              "rgba(32, 58, 67, 0.95)",
              "rgba(44, 83, 100, 0.95)",
            ]}
            style={styles.gradient}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurView}>
              <View style={styles.handle} />

              <ScrollView style={styles.scrollContent}>
                <View style={styles.header}>
                  <Text style={styles.date}>
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.temperatureSection}>
                  <View style={styles.temperatureContainer}>
                    <View style={styles.temperatureLeft}>
                      <Text style={styles.temperature}>
                        {Math.round((minTemp + maxTemp) / 2)}°
                      </Text>
                      <View style={styles.temperatureRangeContainer}>
                        <Text style={styles.temperatureRange}>
                          {Math.round(minTemp)}° - {Math.round(maxTemp)}°
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weatherStats}>
                      <View style={styles.statsTopRow}>
                        <View style={styles.statItem}>
                          <View style={styles.statIconContainer}>
                            <Ionicons name="water" size={20} color="#4A90E2" />
                          </View>
                          <Text style={styles.statValue}>
                            {precipitation}mm
                          </Text>
                          <Text style={styles.statLabel}>Rain</Text>
                        </View>
                        <View style={styles.statItem}>
                          <View style={styles.statIconContainer}>
                            <Ionicons name="sunny" size={20} color="#4A90E2" />
                          </View>
                          <Text style={styles.statValue}>{uvIndex}</Text>
                          <Text style={styles.statLabel}>UV</Text>
                        </View>
                      </View>
                      <View style={styles.statsBottomRow}>
                        <View style={styles.windStatItem}>
                          <View style={styles.windIconContainer}>
                            <MotiView
                              from={{ rotate: "0deg" }}
                              animate={{ rotate: "360deg" }}
                              transition={{
                                type: "timing",
                                duration: 3000,
                                loop: true,
                              }}
                            >
                              <Ionicons
                                name="speedometer-outline"
                                size={24}
                                color="#4A90E2"
                              />
                            </MotiView>
                          </View>
                          <View style={styles.windStatText}>
                            <Text style={styles.statValue}>
                              {windSpeed}{" "}
                              <Text style={{ fontSize: 10 }}>km/h</Text>
                            </Text>
                            <Text style={styles.statLabel}>Wind</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.chartContainer}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>
                      Temperature Throughout the Day
                    </Text>
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View style={styles.legendColor} />
                        <Text style={styles.legendText}>Temperature</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={chartData}
                      width={width - 48}
                      height={180}
                      chartConfig={chartConfig}
                      bezier
                      style={styles.chart}
                      onDataPointClick={({ index }) => setSelectedPoint(index)}
                      decorator={() =>
                        selectedPoint !== null ? (
                          <View
                            style={[
                              styles.tooltip,
                              {
                                left: selectedPoint * ((width - 48) / 24),
                                top: 10,
                              },
                            ]}
                          >
                            <Text style={styles.tooltipText}>
                              {hourlyData[selectedPoint]}°
                            </Text>
                          </View>
                        ) : null
                      }
                      yAxisSuffix="°"
                      yAxisInterval={1}
                      segments={4}
                    />
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="sunny-outline" size={24} color="#FFD700" />
                    <Text style={styles.detailLabel}>Sunrise</Text>
                    <Text style={styles.detailValue}>6:30 AM</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="moon-outline" size={24} color="#4A90E2" />
                    <Text style={styles.detailLabel}>Sunset</Text>
                    <Text style={styles.detailValue}>7:45 PM</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="water-outline" size={24} color="#fff" />
                    <Text style={styles.detailLabel}>Humidity</Text>
                    <Text style={styles.detailValue}>65%</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="speedometer-outline"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.detailLabel}>Pressure</Text>
                    <Text style={styles.detailValue}>1013 hPa</Text>
                  </View>
                </View>
              </ScrollView>
            </BlurView>
          </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    height: height * 0.85,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
  blurView: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  date: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  temperatureSection: {
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  temperatureContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    borderRadius: 24,
    width: "100%",
  },
  temperatureLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  temperature: {
    fontSize: 64,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },
  temperatureRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  temperatureRange: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "600",
  },
  weatherStats: {
    flex: 1,
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
  },
  statsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsBottomRow: {
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  windStatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    padding: 12,
    borderRadius: 16,
    width: "100%",
  },
  windIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  windStatText: {
    marginLeft: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  chartContainer: {
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  chartTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingRight: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  legendColor: {
    width: 12,
    height: 3,
    backgroundColor: "#4A90E2",
    marginRight: 8,
  },
  legendText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  chartWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  detailItem: {
    width: "48%",
    padding: 12,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 8,
  },
  detailValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  tooltip: {
    backgroundColor: "#FFD700",
    padding: 8,
    borderRadius: 8,
    position: "absolute",
  },
  tooltipText: {
    color: "#000",
    fontWeight: "600",
  },
});

export default WeatherDetailModal;
