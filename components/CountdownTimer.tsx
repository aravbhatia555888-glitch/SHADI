import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { useEffect,useState } from "react";
import { StyleSheet,Text,View } from "react-native";

interface CountdownTimerProps {
  weddingDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ weddingDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(weddingDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : num.toString();
  };

  const timerLabel = `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds until wedding`;

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityLabel={timerLabel}
    >
      <View style={styles.timerContainer}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.days)}</Text>
          <Text style={styles.timeLabel}>Days</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.hours)}</Text>
          <Text style={styles.timeLabel}>Hours</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.minutes)}</Text>
          <Text style={styles.timeLabel}>Mins</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeValue}>{formatNumber(timeLeft.seconds)}</Text>
          <Text style={styles.timeLabel}>Secs</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  timeUnit: {
    alignItems: "center",
    minWidth: 60,
  },
  timeValue: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.primary,
    lineHeight: Typography.fontSizes.xxxl * 1.2,
  },
  timeLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  separator: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.primary,
    marginHorizontal: 4,
    lineHeight: Typography.fontSizes.xxxl * 1.2,
    marginTop: 0,
  },
});
