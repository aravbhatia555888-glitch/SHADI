import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import { captureError } from "@/services/sentry";
import { AlertTriangle,RotateCcw } from "lucide-react-native";
import { Component,ErrorInfo,ReactNode } from "react";
import {
SafeAreaView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from "react-native";

interface Props {
  children: ReactNode;
  screenName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error(`[ErrorBoundary${this.props.screenName ? `-${this.props.screenName}` : ""}]:`, error, errorInfo);
    }
    captureError(error, {
      screenName: this.props.screenName,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color={Colors.light.error} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.description}>
              {this.props.screenName
                ? `An error occurred in the ${this.props.screenName} screen.`
                : "We're sorry, but something unexpected happened."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <RotateCcw size={20} color={Colors.light.background} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.background,
  },
});
