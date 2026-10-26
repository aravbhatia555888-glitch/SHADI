import Colors,{ ThemeColors,ThemeType } from "@/constants/colors";
import { useColorScheme } from "react-native";

export function useTheme(): { theme: ThemeType; colors: ThemeColors } {
  const colorScheme = useColorScheme();
  const theme: ThemeType = colorScheme === "dark" ? "dark" : "light";
  return {
    theme,
    colors: Colors[theme],
  };
}
