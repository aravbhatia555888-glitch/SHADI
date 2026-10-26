import Colors from "@/constants/colors";
import { LucideIcon, LucideProps } from "lucide-react-native";
import { ColorValue, StyleProp, ViewStyle } from "react-native";

type IconProps = {
  icon: LucideIcon;
  size?: number;
  color?: string | ColorValue;
  fill?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export default function Icon({
  icon: IconComponent,
  size = 24,
  color = Colors.light.text,
  fill,
  strokeWidth = 2,
  absoluteStrokeWidth = false,
  style,
}: IconProps) {
  // For Expo 50 compatibility, we need to handle color differently
  const props: LucideProps = {
    size,
    color,
    fill,
    strokeWidth,
    absoluteStrokeWidth,
    style: style,
  };

  return <IconComponent {...props} />;
}
