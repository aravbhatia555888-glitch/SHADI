import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import Typography from "@/constants/typography";
import type { ChatConversation } from "@/schemas/wedding";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useToastStore } from "@/stores/toast-store";
import { useFocusEffect,useNavigation,useRouter } from "expo-router";
import {
AlertCircle,
Ban,
Edit,
MessageCircle,
MoreVertical,
Search,
Trash2,
X,
} from "lucide-react-native";
import React,{ useEffect,useLayoutEffect,useMemo,useState } from "react";
import {
Alert,
FlatList,
Modal,
Pressable,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";

const BLOCKED_VENDORS_KEY = "blocked-vendors";

function formatTimestamp(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function MessagesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { conversations, loading, loadConversations, deleteConversation } =
    useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [blockedVendors, setBlockedVendors] = useState<string[]>([]);

  // Load locally-blocked vendors so blocked senders stay hidden across restarts
  useEffect(() => {
    AsyncStorage.getItem(BLOCKED_VENDORS_KEY)
      .then((raw) => {
        if (raw) setBlockedVendors(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadConversations(user.id);
    }
  }, [loadConversations, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadConversations(user.id);
      }
    }, [loadConversations, user?.id])
  );

  const filteredConversations = useMemo(() => {
    const visible = conversations.filter(
      (conv) => !blockedVendors.includes(conv.vendorId)
    );
    if (!searchQuery.trim()) return visible;
    const query = searchQuery.toLowerCase();
    return visible.filter(
      (conv) =>
        (conv.vendorName ?? "").toLowerCase().includes(query) ||
        (conv.vendorCategory ?? "").toLowerCase().includes(query)
    );
  }, [conversations, searchQuery, blockedVendors]);

  const _unreadCount = useMemo(
    () => conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    [conversations]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/vendors")}
            accessibilityRole="button"
            accessibilityLabel="Browse vendors"
          >
            <Edit size={20} color={Colors.light.background} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, router]);

  const openChat = (conversation: ChatConversation) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleLongPress = (item: ChatConversation) => {
    setSelectedConversation(item);
    setShowOptionsModal(true);
  };

  const handleDeleteConversation = () => {
    setShowOptionsModal(false);
    setTimeout(() => {
      Alert.alert(
        "Delete Conversation",
        `Delete conversation with ${
          selectedConversation?.vendorName ?? "this vendor"
        }?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (selectedConversation?.id) {
                await deleteConversation(selectedConversation.id);
              }
            },
          },
        ]
      );
    }, 300);
  };

  const handleBlockVendor = () => {
    setShowOptionsModal(false);
    setTimeout(() => {
      Alert.alert(
        "Block Vendor",
        `Block ${selectedConversation?.vendorName ?? "this vendor"}? You won't see messages from them.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            style: "destructive",
            onPress: () => {
              const conv = selectedConversation;
              if (!conv) return;
              // Persist the block locally and hide + delete the conversation
              setBlockedVendors((prev) => {
                const next = prev.includes(conv.vendorId)
                  ? prev
                  : [...prev, conv.vendorId];
                AsyncStorage.setItem(
                  BLOCKED_VENDORS_KEY,
                  JSON.stringify(next)
                ).catch(() => {});
                return next;
              });
              deleteConversation(conv.id);
              useToastStore
                .getState()
                .showToast("Vendor blocked", "success");
            },
          },
        ]
      );
    }, 300);
  };

  const handleReport = () => {
    setShowOptionsModal(false);
    setTimeout(() => {
      Alert.alert("Report Vendor", "Why are you reporting this vendor?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Spam",
          onPress: () =>
            useToastStore
              .getState()
              .showToast("Report submitted. Our team will review it.", "success"),
        },
        {
          text: "Inappropriate",
          onPress: () =>
            useToastStore
              .getState()
              .showToast("Report submitted. Our team will review it.", "success"),
        },
      ]);
    }, 300);
  };

  const renderConversation = ({ item }: { item: ChatConversation }) => (
    <View style={styles.conversationWrapper}>
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => openChat(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Conversation with ${
          item.vendorName ?? "vendor"
        }, ${item.vendorCategory ?? ""}`}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <MessageCircle size={24} color={Colors.light.textLight} />
          </View>
          {item.unreadCount > 0 && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.topRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.vendorName ?? "Vendor"}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessageAt)}
            </Text>
          </View>

          <Text style={styles.vendorCategory}>{item.vendorCategory ?? ""}</Text>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage ?? "No messages yet"}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleLongPress(item)}
        activeOpacity={0.5}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${item.vendorName ?? "vendor"}`}
      >
        <MoreVertical size={24} color={Colors.light.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MessageCircle
          size={56}
          color={Colors.light.textLight}
          strokeWidth={1.5}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with vendors{"\n"}from the Vendors tab
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={Colors.light.textLight} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.textLight}
            accessibilityLabel="Search messages"
          />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filteredConversations.length === 0 ? styles.emptyContainer : undefined
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={loading}
        onRefresh={() => {
          if (user?.id) loadConversations(user.id);
        }}
      />

      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>
                {selectedConversation?.vendorName ?? "Vendor"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close options"
              >
                <X size={24} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleDeleteConversation}
              accessibilityRole="button"
              accessibilityLabel="Delete conversation"
            >
              <Trash2 size={20} color={Colors.light.error} />
              <Text style={[styles.optionText, styles.optionTextDanger]}>
                Delete Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleBlockVendor}
              accessibilityRole="button"
              accessibilityLabel="Block vendor"
            >
              <Ban size={20} color={Colors.light.error} />
              <Text style={[styles.optionText, styles.optionTextDanger]}>
                Block Vendor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleReport}
              accessibilityRole="button"
              accessibilityLabel="Report vendor"
            >
              <AlertCircle size={20} color={Colors.light.textLight} />
              <Text style={styles.optionText}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => setShowOptionsModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  conversationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  conversationItem: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: Colors.light.background,
  },
  moreButton: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
    minHeight: 48,
    backgroundColor: Colors.light.backgroundAlt,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 84,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  conversationContent: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  vendorName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: "500",
  },
  vendorCategory: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.textLight,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.background,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  optionsModal: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionsTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "600",
    color: Colors.light.text,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  optionText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.text,
    fontWeight: "500",
  },
  optionTextDanger: {
    color: Colors.light.error,
  },
  cancelOption: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.light.textLight,
    fontWeight: "600",
    textAlign: "center",
  },
});
