import Colors from "@/constants/colors";
import { supabase } from "@/config/supabase";
import type { ChatMessage } from "@/schemas/wedding";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useToastStore } from "@/stores/toast-store";
import { FontWeight } from "@/types/styles";
import { useLocalSearchParams,useNavigation,useRouter } from "expo-router";
import { ChevronLeft,Send } from "lucide-react-native";
import { useEffect,useLayoutEffect,useRef,useState } from "react";
import {
FlatList,
KeyboardAvoidingView,
Platform,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const {
    messages,
    conversations,
    loadMessages,
    sendMessage,
    markAsRead,
    subscribeToMessages,
  } = useChatStore();

  const conversationId = Array.isArray(id) ? id[0] : id ?? "";
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  // M3/L10 fix: vendor owners must send with sender_type='vendor' (the
  // RLS policies enforce it). Detect ownership once per conversation.
  const [isVendorOwner, setIsVendorOwner] = useState(false);

  const conversation = conversations.find((c) => c.id === conversationId);
  const chatMessages = messages[conversationId] ?? [];

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId, loadMessages, markAsRead]);

  useEffect(() => {
    if (!conversationId || !user?.id || !conversation) return;
    let cancelled = false;
    supabase
      .from("vendors")
      .select("id")
      .eq("id", conversation.vendorId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsVendorOwner(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, conversation, user?.id]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId);
    return unsubscribe;
  }, [conversationId, subscribeToMessages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={Colors.light.white} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTextContainer}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {conversation?.vendorName ?? "Chat"}
            </Text>
            {conversation?.vendorCategory ? (
              <Text
                style={styles.headerSubtitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {conversation.vendorCategory}
              </Text>
            ) : null}
          </View>
        </View>
      ),
    });
  }, [navigation, conversation, router]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || !user?.id || !conversationId || sending) return;

    setSending(true);
    setInputText("");
    const result = await sendMessage(
      conversationId,
      content,
      user.id,
      isVendorOwner ? "vendor" : "user"
    );
    if (!result.success && result.error) {
      useToastStore.getState().showToast(result.error, "error");
      setInputText(content);
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.vendorMessage,
        ]}
        accessible
        accessibilityLabel={`${
          isUser ? "You" : conversation?.vendorName ?? "Vendor"
        } said: ${item.content}`}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.vendorMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTimestamp,
            isUser ? styles.userTimestamp : styles.vendorTimestamp,
          ]}
        >
          {formatMessageTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Conversation not found</Text>
          <Text style={styles.errorSubtitle}>
            This conversation may have been deleted.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={Colors.light.textLight}
          multiline
          maxLength={1000}
          editable={!sending}
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Send size={20} color={Colors.light.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
    marginLeft: -4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600" as FontWeight,
    color: Colors.light.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  backButton: {
    marginLeft: 16,
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  vendorMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.backgroundAlt,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 2,
  },
  userMessageText: {
    color: Colors.light.white,
  },
  vendorMessageText: {
    color: Colors.light.text,
  },
  messageTimestamp: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  vendorTimestamp: {
    color: Colors.light.textLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.light.white,
    fontWeight: "600",
  },
});
