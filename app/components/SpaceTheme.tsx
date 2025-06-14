import { AntDesign } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface SpaceThemeProps {
  onAnimationComplete: () => void;
}

const SpaceTheme: React.FC<SpaceThemeProps> = ({ onAnimationComplete }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const starOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in the background
    opacity.value = withTiming(1, { duration: 1000 });

    // Scale up the earth
    scale.value = withTiming(1, { duration: 1000 });

    // 3D rotation animation - faster speed
    rotationX.value = withRepeat(
      withTiming(360, {
        duration: 8000, // Faster rotation
        easing: Easing.linear,
      }),
      -1
    );

    rotationY.value = withRepeat(
      withTiming(360, {
        duration: 10000, // Faster rotation
        easing: Easing.linear,
      }),
      -1
    );

    // Animate stars with twinkling effect
    starOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1
    );

    starScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 })
      ),
      -1
    );

    // Animate dots
    dotsOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 })
      ),
      -1
    );

    // Trigger completion after animation
    setTimeout(onAnimationComplete, 4000);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const earthStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateX: `${rotationX.value}deg` },
      { rotateY: `${rotationY.value}deg` },
      { perspective: 1000 },
    ],
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
    transform: [{ scale: starScale.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const renderStars = () => {
    return [...Array(100)].map((_, i) => {
      const size = Math.random() * 3 + 1;
      const delay = Math.random() * 2000;
      const duration = Math.random() * 2000 + 1000;

      return (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: Math.random() * width,
              top: Math.random() * height,
              width: size,
              height: size,
              opacity: interpolate(starOpacity.value, [0, 1], [0.3, 1]),
              transform: [
                {
                  scale: interpolate(starScale.value, [0, 1], [0.8, 1.2]),
                },
              ],
            },
          ]}
        />
      );
    });
  };

  const renderDots = () => {
    return [...Array(3)].map((_, i) => (
      <Animated.Text
        key={i}
        style={[styles.dots, dotsStyle, { animationDelay: `${i * 200}ms` }]}
      >
        .
      </Animated.Text>
    ));
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Stars background */}
      <Animated.View style={[styles.starsContainer, starsStyle]}>
        {renderStars()}
      </Animated.View>

      {/* Earth icon */}
      <Animated.View style={[styles.earthContainer, earthStyle]}>
        <AntDesign name="earth" size={120} color="#4A90E2" />
      </Animated.View>

      {/* Text with animated dots */}
      <Animated.View style={[styles.textContainer, starsStyle]}>
        <Text style={styles.text}>
          Exploring the World
          <Animated.View style={styles.dotsContainer}>
            {renderDots()}
          </Animated.View>
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFF",
    borderRadius: 50,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  earthContainer: {
    marginBottom: 40,
    transform: [{ perspective: 1000 }],
  },
  textContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    marginLeft: 4,
  },
  dots: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "600",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default SpaceTheme;
