import CountdownTimer from "@/components/CountdownTimer";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { Calendar,MapPin,Sparkles } from "lucide-react-native";
import React from "react";
import {
Animated,
Image,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface HomeHeaderProps {
  coupleName: string;
  weddingDate: string;
  weddingLocation: string;
  onNotificationPress: () => void;
  onSearchPress: () => void;
  onProfilePress: () => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

function HomeHeader({
  coupleName,
  weddingDate,
  weddingLocation,
  onNotificationPress: _onNotificationPress,
  onSearchPress: _onSearchPress,
  onProfilePress,
  fadeAnim,
  slideAnim,
}: HomeHeaderProps) {
  const formattedDate = new Date(weddingDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1296&q=80",
          }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerBadge}>
            <Sparkles
              size={14}
              color={Colors.light.secondary}
              strokeWidth={1.5}
            />
            <Text style={styles.bannerBadgeText}>Your Big Day</Text>
          </View>
          <Text style={styles.coupleNames}>{coupleName}</Text>
          <View style={styles.weddingInfoContainer}>
            <TouchableOpacity
              style={styles.weddingInfoChip}
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel={`Wedding date: ${formattedDate}`}
            >
              <Calendar
                size={14}
                color={Colors.light.background}
                strokeWidth={1.5}
              />
              <Text style={styles.weddingInfoText}>{formattedDate}</Text>
            </TouchableOpacity>
            <View style={styles.weddingInfoChip}>
              <MapPin
                size={14}
                color={Colors.light.background}
                strokeWidth={1.5}
              />
              <Text style={styles.weddingInfoText}>{weddingLocation}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.countdownContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <CountdownTimer weddingDate={weddingDate} />
      </Animated.View>
    </>
  );
}

export default React.memo(HomeHeader);

const styles = StyleSheet.create({
  banner: {
    height: 240,
    position: "relative",
    overflow: "hidden",
    backgroundColor: Colors.light.headerBackground,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.light.headerBackground,
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
    gap: 6,
  },
  bannerBadgeText: {
    color: Colors.light.background,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  coupleNames: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.light.background,
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  weddingInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weddingInfoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  weddingInfoText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.background,
    fontWeight: "600",
  },
  countdownContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
});
