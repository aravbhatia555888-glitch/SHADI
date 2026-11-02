import IconWrapper from "@/components/IconWrapper";
import { Tabs } from "expo-router";
import {
ClipboardList,
Home,
MessageCircle,
Store,
User,
} from "lucide-react-native";
import Colors from "../../constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.light.headerBackground,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors.light.background,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textLight,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarButtonTestID: "tab-home",
          headerStyle: {
            backgroundColor: Colors.light.headerBackground,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            color: Colors.light.background,
            fontWeight: "600",
          },
          tabBarIcon: ({ color, focused }) => (
            <IconWrapper
              icon={Home}
              size={focused ? 26 : 24}
              color={color}
              accessibilityLabel="Home tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: "Checklist",
          tabBarButtonTestID: "tab-checklist",
          tabBarIcon: ({ color, focused }) => (
            <IconWrapper
              icon={ClipboardList}
              size={focused ? 26 : 24}
              color={color}
              accessibilityLabel="Checklist tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarButtonTestID: "tab-messages",
          tabBarIcon: ({ color, focused }) => (
            <IconWrapper
              icon={MessageCircle}
              size={focused ? 26 : 24}
              color={color}
              accessibilityLabel="Messages tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: "Vendors",
          tabBarButtonTestID: "tab-vendors",
          tabBarIcon: ({ color, focused }) => (
            <IconWrapper
              icon={Store}
              size={focused ? 26 : 24}
              color={color}
              accessibilityLabel="Vendors tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButtonTestID: "tab-profile",
          tabBarIcon: ({ color, focused }) => (
            <IconWrapper
              icon={User}
              size={focused ? 26 : 24}
              color={color}
              accessibilityLabel="Profile tab"
            />
          ),
        }}
      />
    </Tabs>
  );
}
