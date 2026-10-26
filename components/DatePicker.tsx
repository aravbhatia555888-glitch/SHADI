import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { FontWeight } from "@/types/styles";
import DateTimePicker,{
DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
Platform,
StyleProp,
StyleSheet,
Text,
TouchableOpacity,
View,
ViewStyle,
} from "react-native";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  style,
  label,
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShow(true)}
        accessibilityLabel={label || placeholder}
        accessibilityRole="button"
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 6,
  },
  container: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.light.white,
  },
  text: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  placeholder: {
    color: Colors.light.textLight,
  },
});
