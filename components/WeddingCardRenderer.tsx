import type {
WeddingCardData,
WeddingCardTemplate,
} from "@/types/wedding-card";
import { Dimensions,StyleSheet,Text,View } from "react-native";

interface WeddingCardRendererProps {
  template: WeddingCardTemplate;
  data: WeddingCardData;
  scale?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function WeddingCardRenderer({
  template,
  data,
  scale = 1,
}: WeddingCardRendererProps) {
  const styles = createStyles(template, scale);

  return (
    <View style={styles.card}>
      {/* Background Pattern */}
      {template.elements.showPattern && (
        <View style={styles.patternOverlay}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Text
              key={i}
              style={[
                styles.patternDot,
                {
                  top: `${(i * 13) % 100}%`,
                  left: `${(i * 17 + 5) % 100}%`,
                },
              ]}
            >
              ◆
            </Text>
          ))}
        </View>
      )}

      {/* Border Frame */}
      {template.elements.showBorder && (
        <View style={styles.borderFrame}>
          <View style={styles.innerBorder} />
        </View>
      )}

      {/* Floral Corners */}
      {template.elements.showFloralCorner && (
        <>
          <Text style={[styles.cornerDecoration, styles.topLeft]}>❀</Text>
          <Text style={[styles.cornerDecoration, styles.topRight]}>❀</Text>
          <Text style={[styles.cornerDecoration, styles.bottomLeft]}>❀</Text>
          <Text style={[styles.cornerDecoration, styles.bottomRight]}>❀</Text>
        </>
      )}

      {/* Mandala Top */}
      {template.elements.showMandala && (
        <View style={styles.mandalaContainer}>
          <Text style={styles.mandala}>✦</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.invitationText}>Wedding Invitation</Text>

        {/* Parents Names */}
        {data.parentNames && (
          <View style={styles.parentsContainer}>
            <Text style={styles.parentsText}>
              {data.parentNames.groomParents}
            </Text>
            <Text style={styles.parentsText}> & </Text>
            <Text style={styles.parentsText}>
              {data.parentNames.brideParents}
            </Text>
          </View>
        )}

        {/* Request Line */}
        <Text style={styles.requestLine}>
          request the pleasure of your company at the wedding of their children
        </Text>

        {/* Couple Names */}
        <View style={styles.coupleContainer}>
          <Text style={styles.groomName}>{data.groomName}</Text>
          <Text style={styles.andText}>&</Text>
          <Text style={styles.brideName}>{data.brideName}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerIcon}>❦</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Message */}
        <Text style={styles.message}>{data.message}</Text>

        {/* Date & Time */}
        <View style={styles.detailsContainer}>
          <Text style={styles.dateText}>{data.date}</Text>
          <Text style={styles.timeText}>{data.time}</Text>
        </View>

        {/* Venue */}
        <View style={styles.venueContainer}>
          <Text style={styles.venueName}>{data.venue}</Text>
          <Text style={styles.venueAddress}>{data.venueAddress}</Text>
        </View>

        {/* RSVP */}
        <View style={styles.rsvpContainer}>
          <Text style={styles.rsvpLabel}>RSVP</Text>
          <Text style={styles.rsvpContact}>{data.rsvpContact}</Text>
          <Text style={styles.rsvpDate}>by {data.rsvpDate}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(template: WeddingCardTemplate, scale: number) {
  const w = CARD_WIDTH * scale;
  const h = CARD_HEIGHT * scale;
  const { colors } = template;

  return StyleSheet.create({
    card: {
      width: w,
      height: h,
      backgroundColor: colors.background,
      borderRadius: 16 * scale,
      overflow: "hidden",
      position: "relative",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    patternOverlay: {
      ...StyleSheet.absoluteFill,
      opacity: 0.08,
    },
    patternDot: {
      position: "absolute",
      color: colors.secondary,
      fontSize: 12 * scale,
    },
    borderFrame: {
      ...StyleSheet.absoluteFill,
      margin: 12 * scale,
      borderWidth: 2 * scale,
      borderColor: colors.secondary,
      borderRadius: 12 * scale,
      opacity: 0.6,
    },
    innerBorder: {
      flex: 1,
      margin: 4 * scale,
      borderWidth: 1 * scale,
      borderColor: colors.secondary,
      borderRadius: 8 * scale,
      opacity: 0.4,
    },
    cornerDecoration: {
      position: "absolute",
      fontSize: 24 * scale,
      color: colors.secondary,
      opacity: 0.7,
    },
    topLeft: { top: 8 * scale, left: 8 * scale },
    topRight: { top: 8 * scale, right: 8 * scale },
    bottomLeft: { bottom: 8 * scale, left: 8 * scale },
    bottomRight: { bottom: 8 * scale, right: 8 * scale },
    mandalaContainer: {
      position: "absolute",
      top: 20 * scale,
      alignSelf: "center",
    },
    mandala: {
      fontSize: 40 * scale,
      color: colors.secondary,
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: 24 * scale,
      justifyContent: "center",
      alignItems: "center",
    },
    invitationText: {
      fontSize: 14 * scale,
      color: colors.secondary,
      letterSpacing: 4 * scale,
      textTransform: "uppercase" as const,
      marginBottom: 16 * scale,
      fontWeight: "600",
    },
    parentsContainer: {
      alignItems: "center",
      marginBottom: 12 * scale,
    },
    parentsText: {
      fontSize: 12 * scale,
      color: colors.text,
      opacity: 0.8,
      textAlign: "center",
    },
    requestLine: {
      fontSize: 11 * scale,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: 20 * scale,
      paddingHorizontal: 20 * scale,
    },
    coupleContainer: {
      alignItems: "center",
      marginBottom: 16 * scale,
    },
    groomName: {
      fontSize: 28 * scale,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    andText: {
      fontSize: 20 * scale,
      color: colors.secondary,
      fontWeight: "600",
      marginVertical: 4 * scale,
    },
    brideName: {
      fontSize: 28 * scale,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16 * scale,
      width: "60%",
    },
    dividerLine: {
      flex: 1,
      height: 1 * scale,
      backgroundColor: colors.secondary,
      opacity: 0.5,
    },
    dividerIcon: {
      fontSize: 16 * scale,
      color: colors.secondary,
      marginHorizontal: 12 * scale,
    },
    message: {
      fontSize: 13 * scale,
      color: colors.text,
      opacity: 0.85,
      textAlign: "center",
      marginBottom: 20 * scale,
      paddingHorizontal: 16 * scale,
      lineHeight: 18 * scale,
    },
    detailsContainer: {
      alignItems: "center",
      marginBottom: 16 * scale,
    },
    dateText: {
      fontSize: 18 * scale,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    timeText: {
      fontSize: 14 * scale,
      color: colors.secondary,
      fontWeight: "600",
      marginTop: 4 * scale,
    },
    venueContainer: {
      alignItems: "center",
      marginBottom: 16 * scale,
    },
    venueName: {
      fontSize: 16 * scale,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    venueAddress: {
      fontSize: 12 * scale,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
      marginTop: 2 * scale,
    },
    rsvpContainer: {
      alignItems: "center",
      paddingTop: 12 * scale,
      borderTopWidth: 1 * scale,
      borderTopColor: colors.secondary,
      opacity: 0.6,
      width: "70%",
    },
    rsvpLabel: {
      fontSize: 11 * scale,
      color: colors.secondary,
      fontWeight: "700",
      letterSpacing: 2 * scale,
      marginBottom: 4 * scale,
    },
    rsvpContact: {
      fontSize: 13 * scale,
      color: colors.text,
      fontWeight: "600",
    },
    rsvpDate: {
      fontSize: 11 * scale,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2 * scale,
    },
  });
}
