module.exports = {
  name: "Shaadi Bazaar",
  slug: "shaadi-bazaar",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./public/logo512.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./public/logo512.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.shaadibazaar.app",
    buildNumber: "1.0.0"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./public/logo512.png",
      backgroundColor: "#ffffff"
    },
    package: "com.shaadibazaar.app",
    versionCode: 1,
    softwareKeyboardLayoutMode: "resize"
  },
  web: {
    favicon: "./public/favicon.ico"
  },
  plugins: [
    "expo-router",
    "expo-sharing",
    "expo-splash-screen",
    "expo-web-browser"
  ],
  scheme: "shaadibazaar",
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    }
  }
};
