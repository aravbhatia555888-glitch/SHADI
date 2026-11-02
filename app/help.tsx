import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { FontWeight } from "@/types/styles";
import { Stack,useRouter } from "expo-router";
import {
ChevronLeft,
ChevronRight,
FileText,
Mail,
MessageCircle,
Phone,
} from "lucide-react-native";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FAQ_ITEMS = [
  {
    id: "1",
    question: "How do I add a new vendor?",
    answer: "Go to the Vendors tab and tap the '+' button to add a new vendor.",
  },
  {
    id: "2",
    question: "Can I share my wedding details with others?",
    answer: "Yes, you can share your wedding details from the Profile screen.",
  },
  {
    id: "3",
    question: "How do I track my budget?",
    answer: "Use the Budget tab to add expenses and track your spending.",
  },
  {
    id: "4",
    question: "Can I export my checklist?",
    answer:
      "Yes, you can export your checklist as a PDF from the Checklist tab.",
  },
];

const CONTACT_OPTIONS = [
  {
    id: "email",
    title: "Email Support",
    subtitle: "support@shaadibazaar.com",
    icon: Mail,
  },
  {
    id: "phone",
    title: "Phone Support",
    subtitle: "+91 1800-123-4567",
    icon: Phone,
  },
  {
    id: "chat",
    title: "Live Chat",
    subtitle: "Chat with our support team",
    icon: MessageCircle,
  },
];

export default function HelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {CONTACT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactItem}
              onPress={() => {
                if (option.id === "email") {
                  Linking.openURL("mailto:support@shaadibazaar.com");
                } else if (option.id === "phone") {
                  Linking.openURL("tel:+918001234567");
                } else if (option.id === "chat") {
                  router.push("/(tabs)/messages");
                }
              }}
            >
              <View style={styles.contactLeft}>
                <option.icon size={20} color={Colors.light.primary} />
                <View style={styles.contactText}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.light.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => router.push("/(tabs)/home")}
          >
            <FileText size={20} color={Colors.light.textLight} />
            <Text style={styles.resourceText}>User Guide</Text>
            <ChevronRight size={20} color={Colors.light.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL("https://shaadibazaar.com/terms")}
          >
            <FileText size={20} color={Colors.light.textLight} />
            <Text style={styles.resourceText}>Terms of Service</Text>
            <ChevronRight size={20} color={Colors.light.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL("https://shaadibazaar.com/privacy")}
          >
            <FileText size={20} color={Colors.light.textLight} />
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <ChevronRight size={20} color={Colors.light.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.headerBackground,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.textLight,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    gap: 2,
  },
  contactTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "500" as FontWeight,
    color: Colors.light.text,
  },
  contactSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  faqQuestion: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  resourceText: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
});
