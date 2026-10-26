module.exports = {
  preset: "@react-native/jest-preset",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.(ts|tsx|js)", "**/*.(test|spec).(ts|tsx|js)"],
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "stores/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@components/(.*)$": "<rootDir>/components/$1",
    "^@constants/(.*)$": "<rootDir>/constants/$1",
    "^@config/(.*)$": "<rootDir>/config/$1",
    "^@types/(.*)$": "<rootDir>/types/$1",
    "^@stores/(.*)$": "<rootDir>/stores/$1",
    "^@services/(.*)$": "<rootDir>/services/$1",
    "^@utils/(.*)$": "<rootDir>/utils/$1",
    "^@mocks/(.*)$": "<rootDir>/mocks/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo|@expo|expo-haptics|expo-auth-session|expo-web-browser|expo-modules-core|expo-file-system|expo-image-picker|expo-constants|expo-linking|expo-crypto|expo-device|expo-notifications|expo-sharing|expo-splash-screen|expo-status-bar|expo-media-library|expo-image-manipulator|expo-router|@supabase|zustand|lucide-react-native|react-native-svg|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-view-shot|react-native-web)/)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
};
