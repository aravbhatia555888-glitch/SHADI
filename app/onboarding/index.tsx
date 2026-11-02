import Button from "@/components/Button";
import DatePicker from "@/components/DatePicker";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { generateSmartChecklist } from "@/services/ai-checklist";
import { useAuthStore } from "@/stores/auth-store";
import { useWeddingStore } from "@/stores/wedding-store";
import { FontWeight } from "@/types/styles";
import { hapticError, hapticSelection, hapticSuccess } from "@/utils/haptics";
import { markOnboardingComplete } from "@/utils/onboarding";
import { useRouter } from "expo-router";
import {
ArrowRight,
Calendar,
Check,
ChevronLeft,
Heart,
IndianRupee,
MapPin,
Sparkles,
Users,
} from "lucide-react-native";
import { type ReactNode,useEffect,useMemo,useRef,useState } from "react";
import {
AccessibilityInfo,
ActivityIndicator,
Animated,
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FORM_STEPS = 4;

const CULTURES = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "Interfaith",
];

const GUEST_OPTIONS = [
  { label: "Under 100", value: 80 },
  { label: "100–300", value: 200 },
  { label: "300–500", value: 400 },
  { label: "500+", value: 700 },
];

const BUDGET_OPTIONS = [
  { label: "₹5L", value: 500000 },
  { label: "₹10L", value: 1000000 },
  { label: "₹25L", value: 2500000 },
  { label: "₹50L+", value: 5000000 },
];

const PERKS = [
  "A checklist built for your date and culture",
  "A budget that actually adds up",
  "India's best venues, photographers and more",
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Turns an AI "9 months before" style suggestion into a real YYYY-MM-DD date.
function resolveDueDate(suggestion: string | undefined, weddingDateISO: string): string {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);

  const base = new Date(`${weddingDateISO}T00:00:00`);
  if (!suggestion || isNaN(base.getTime())) return toISODate(fallback);

  const match = suggestion.match(/(\d+)\s*(month|week|day)s?\s*before/i);
  const target = new Date(base);

  if (match) {
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.startsWith("month")) target.setMonth(target.getMonth() - n);
    else if (unit.startsWith("week")) target.setDate(target.getDate() - 7 * n);
    else target.setDate(target.getDate() - n);
  } else if (/week\s*before/i.test(suggestion)) {
    target.setDate(target.getDate() - 7);
  } else if (/day\s*before/i.test(suggestion)) {
    target.setDate(target.getDate() - 1);
  } else if (/month\s*before/i.test(suggestion)) {
    target.setMonth(target.getMonth() - 1);
  } else {
    return toISODate(fallback);
  }

  return toISODate(target);
}

function formatBudget(amount: number): string {
  const lakhs = amount / 100000;
  return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { setWeddingDetails, addChecklistItem } = useWeddingStore();

  // 0 = welcome, 1..FORM_STEPS = form steps
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "saving" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [seededCount, setSeededCount] = useState(0);

  const [coupleName, setCoupleName] = useState("");
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [weddingLocation, setWeddingLocation] = useState("");
  const [guests, setGuests] = useState(200);
  const [budget, setBudget] = useState(1000000);
  const [culture, setCulture] = useState("Hindu");

  const [reduceMotion, setReduceMotion] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) =>
      setReduceMotion(value)
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      slide.setValue(0);
      return;
    }
    fade.setValue(0);
    slide.setValue(18);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [step, reduceMotion, fade, slide]);

  const daysLeft = useMemo(() => {
    if (!weddingDate) return null;
    const diff = Math.ceil(
      (weddingDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
    );
    return Math.max(0, diff);
  }, [weddingDate]);

  const goToStep = (next: number) => {
    setError(null);
    hapticSelection();
    setStep(next);
  };

  const handleSkip = async () => {
    if (user?.id) await markOnboardingComplete(user.id);
    router.replace("/(tabs)/home");
  };

  const validateAndContinue = () => {
    if (step === 1) {
      if (!coupleName.trim()) {
        setError("Add your names so we can personalise your plan.");
        hapticError();
        return;
      }
      if (!weddingDate) {
        setError("Pick your wedding date to build the right timeline.");
        hapticError();
        return;
      }
    }
    if (step === 2 && !weddingLocation.trim()) {
      setError("Add a city so we can suggest local vendors.");
      hapticError();
      return;
    }
    goToStep(step + 1);
  };

  const finish = async () => {
    setError(null);
    setPhase("saving");

    const weddingDateISO = toISODate(weddingDate ?? new Date());
    const location = weddingLocation.trim();
    const name = coupleName.trim();

    const saved = await setWeddingDetails({
      coupleName: name,
      weddingDate: weddingDateISO,
      weddingLocation: location,
      totalBudget: budget,
      culture,
    });

    if (!saved.success) {
      setPhase("form");
      setError(saved.error || "We couldn't save your details. Please try again.");
      hapticError();
      return;
    }

    let added = 0;
    try {
      const result = await generateSmartChecklist(
        weddingDateISO,
        culture,
        budget,
        location,
        guests
      );

      for (const task of result.tasks) {
        if (!task?.title) continue;
        const res = await addChecklistItem({
          title: task.title,
          description: task.description?.trim() || task.title,
          category: task.category || "General",
          dueDate: resolveDueDate(task.suggestedDueDate, weddingDateISO),
          priority: task.priority || "medium",
          completed: false,
        });
        if (res.success) added++;
      }
    } catch {
      // Checklist seeding is best-effort; the plan can be generated later.
    }

    setSeededCount(added);
    if (user?.id) await markOnboardingComplete(user.id);
    hapticSuccess();
    setPhase("done");

    setTimeout(() => router.replace("/(tabs)/home"), 1200);
  };

  // ── Saving / done overlay ─────────────────────────────────────
  if (phase !== "form") {
    return (
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        {phase === "saving" ? (
          <>
            <ActivityIndicator size="large" color={Colors.light.secondary} />
            <Text style={styles.overlayTitle}>Building your checklist…</Text>
            <Text style={styles.overlaySub}>
              Tailoring tasks to your date, culture and budget.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.doneBadge}>
              <Check size={40} color={Colors.light.headerBackground} strokeWidth={3} />
            </View>
            <Text style={styles.overlayTitle}>You&apos;re all set</Text>
            <Text style={styles.overlaySub}>
              {seededCount > 0
                ? `${seededCount} tasks added to your checklist.`
                : "Your plan is ready. Add tasks any time."}
            </Text>
          </>
        )}
      </View>
    );
  }

  // ── Welcome ───────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.welcome}>
        <View style={styles.ringLarge} pointerEvents="none" />
        <View style={styles.ringSmall} pointerEvents="none" />

        <View style={[styles.welcomeTop, { paddingTop: insets.top + 24 }]}>
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>SB</Text>
          </View>
          <Text style={styles.brand}>ShaadiBazaar</Text>
        </View>

        <Animated.View
          style={[
            styles.welcomeBody,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <Text style={styles.welcomeTitle}>Plan your wedding, beautifully.</Text>
          <Text style={styles.welcomeSub}>
            One calm place for your checklist, budget and India&apos;s best
            vendors.
          </Text>

          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <View style={styles.perkDot}>
                  <Check size={13} color={Colors.light.headerBackground} strokeWidth={3} />
                </View>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={[styles.welcomeFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Button
            title="Get started"
            variant="secondary"
            size="large"
            onPress={() => goToStep(1)}
            renderIcon={() => (
              <ArrowRight size={20} color={Colors.light.headerBackground} />
            )}
          />
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip setup and explore"
          >
            <Text style={styles.skipText}>I&apos;ll explore first</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stepMeta = getStepMeta(step);

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goToStep(step - 1)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ChevronLeft size={24} color={Colors.light.background} />
          </TouchableOpacity>
          <Text style={styles.stepCount}>
            Step {step} of {FORM_STEPS}
          </Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${(step / FORM_STEPS) * 100}%` }]}
          />
        </View>

        <Text style={styles.heroKicker}>{stepMeta.kicker}</Text>
        <Text style={styles.heroTitle}>{stepMeta.title}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: slide }] }}
          >
            {step === 1 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Couple names</Text>
                <TextInput
                  style={styles.input}
                  value={coupleName}
                  onChangeText={(text) => {
                    setCoupleName(text);
                    if (error) setError(null);
                  }}
                  placeholder="Aarav & Priya"
                  placeholderTextColor={Colors.light.textLight}
                  autoFocus
                  autoComplete="name"
                  accessibilityLabel="Couple names"
                />

                <Text style={[styles.label, styles.spaced]}>Wedding date</Text>
                <DatePicker
                  value={weddingDate}
                  onChange={(date) => {
                    setWeddingDate(date);
                    if (error) setError(null);
                  }}
                  placeholder="Select your wedding date"
                  label=""
                  minimumDate={new Date()}
                />
                {daysLeft !== null && (
                  <View style={styles.daysPill}>
                    <Heart size={14} color={Colors.light.primary} />
                    <Text style={styles.daysPillText}>
                      {daysLeft} days to go
                    </Text>
                  </View>
                )}
              </View>
            )}

            {step === 2 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Where&apos;s the wedding?</Text>
                <View style={styles.inputWithIcon}>
                  <MapPin size={18} color={Colors.light.textLight} />
                  <TextInput
                    style={styles.inputInner}
                    value={weddingLocation}
                    onChangeText={(text) => {
                      setWeddingLocation(text);
                      if (error) setError(null);
                    }}
                    placeholder="Jaipur, India"
                    placeholderTextColor={Colors.light.textLight}
                    accessibilityLabel="Wedding location"
                  />
                </View>

                <Text style={[styles.label, styles.spaced]}>Guest count</Text>
                <View style={styles.chipRow}>
                  {GUEST_OPTIONS.map((option) => (
                    <Chip
                      key={option.label}
                      label={option.label}
                      selected={guests === option.value}
                      onPress={() => {
                        hapticSelection();
                        setGuests(option.value);
                      }}
                    />
                  ))}
                </View>

                <Text style={[styles.label, styles.spaced]}>Total budget</Text>
                <View style={styles.chipRow}>
                  {BUDGET_OPTIONS.map((option) => (
                    <Chip
                      key={option.label}
                      label={option.label}
                      selected={budget === option.value}
                      onPress={() => {
                        hapticSelection();
                        setBudget(option.value);
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.hint}>
                  You can fine-tune every rupee in the Budget tab later.
                </Text>
              </View>
            )}

            {step === 3 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Which traditions should we plan for?</Text>
                <View style={styles.chipRow}>
                  {CULTURES.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      selected={culture === option}
                      onPress={() => {
                        hapticSelection();
                        setCulture(option);
                      }}
                    />
                  ))}
                </View>
                <View style={styles.noteCard}>
                  <Sparkles size={18} color={Colors.light.primary} />
                  <Text style={styles.noteText}>
                    We&apos;ll add the right ceremonies and rituals, from mehendi
                    to sangeet, to your checklist.
                  </Text>
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.summaryCard}>
                <SummaryRow
                  icon={<Heart size={18} color={Colors.light.primary} />}
                  label="Couple"
                  value={coupleName.trim() || "Your wedding"}
                />
                <SummaryRow
                  icon={<Calendar size={18} color={Colors.light.primary} />}
                  label="Date"
                  value={
                    weddingDate
                      ? `${weddingDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}${daysLeft !== null ? ` · ${daysLeft} days` : ""}`
                      : "Not set"
                  }
                />
                <SummaryRow
                  icon={<MapPin size={18} color={Colors.light.primary} />}
                  label="Location"
                  value={weddingLocation.trim() || "Not set"}
                />
                <SummaryRow
                  icon={<Users size={18} color={Colors.light.primary} />}
                  label="Guests"
                  value={`~${guests}`}
                />
                <SummaryRow
                  icon={<IndianRupee size={18} color={Colors.light.primary} />}
                  label="Budget"
                  value={formatBudget(budget)}
                />
                <SummaryRow
                  icon={<Sparkles size={18} color={Colors.light.primary} />}
                  label="Traditions"
                  value={culture}
                  last
                />
              </View>
            )}

            {error && (
              <Text
                style={styles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            title={step === 4 ? "Create my plan" : "Continue"}
            size="large"
            onPress={step === 4 ? finish : validateAndContinue}
            renderIcon={() =>
              step === 4 ? (
                <Sparkles size={20} color={Colors.light.background} />
              ) : (
                <ArrowRight size={20} color={Colors.light.background} />
              )
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getStepMeta(step: number): { kicker: string; title: string } {
  switch (step) {
    case 1:
      return { kicker: "The couple", title: "Who's getting married?" };
    case 2:
      return { kicker: "The setting", title: "Where and how big?" };
    case 3:
      return { kicker: "Traditions", title: "Make it yours." };
    default:
      return { kicker: "Almost done", title: "Here's your plan." };
  }
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {selected && <Check size={14} color={Colors.light.background} strokeWidth={3} />}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Welcome
  welcome: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    overflow: "hidden",
  },
  ringLarge: {
    position: "absolute",
    top: -140,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    opacity: 0.25,
  },
  ringSmall: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    opacity: 0.35,
  },
  welcomeTop: {
    alignItems: "center",
  },
  monogram: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  monogramText: {
    fontSize: 30,
    fontWeight: "800" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1,
  },
  brand: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "700" as FontWeight,
    color: Colors.light.background,
    letterSpacing: 0.5,
  },
  welcomeBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  welcomeTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800" as FontWeight,
    color: Colors.light.background,
    marginBottom: 14,
  },
  welcomeSub: {
    fontSize: Typography.fontSizes.md,
    lineHeight: 24,
    color: "rgba(255, 245, 228, 0.85)",
    marginBottom: 32,
  },
  perks: {
    gap: 16,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  perkDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    color: Colors.light.background,
    fontWeight: "500" as FontWeight,
  },
  welcomeFooter: {
    paddingHorizontal: 24,
    gap: 12,
  },
  skipButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: "rgba(255, 245, 228, 0.85)",
  },

  // Form steps
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 245, 228, 0.25)",
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Colors.light.secondary,
  },
  heroKicker: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700" as FontWeight,
    color: Colors.light.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800" as FontWeight,
    color: Colors.light.background,
  },
  body: {
    padding: 24,
    flexGrow: 1,
  },
  fieldGroup: {
    gap: 0,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
    marginBottom: 8,
  },
  spaced: {
    marginTop: 24,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 16,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 16,
  },
  inputInner: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
  },
  daysPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.light.surfaceSoft,
  },
  daysPillText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.primary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  chipTextSelected: {
    color: Colors.light.background,
  },
  hint: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.light.textLight,
    marginTop: 12,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSoft,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    color: Colors.light.text,
  },
  summaryCard: {
    backgroundColor: Colors.light.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    width: 84,
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600" as FontWeight,
    color: Colors.light.text,
  },
  error: {
    marginTop: 20,
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.error,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },

  // Overlay (saving / done)
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 18,
  },
  overlayTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "800" as FontWeight,
    color: Colors.light.background,
    textAlign: "center",
  },
  overlaySub: {
    fontSize: Typography.fontSizes.md,
    lineHeight: 24,
    color: "rgba(255, 245, 228, 0.85)",
    textAlign: "center",
  },
  doneBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
