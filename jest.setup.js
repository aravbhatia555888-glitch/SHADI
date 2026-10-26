import "react-native-gesture-handler/jestSetup";

// Mock expo modules
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  wrap: (component) => component,
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", granted: true })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted", granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://test-image.jpg" }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://test-camera-image.jpg" }],
    })
  ),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve("base64string")),
  EncodingType: {
    Base64: "base64",
  },
}));

// Mock expo-image-manipulator (used by services/imageUpload.ts)
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn((uri) =>
    Promise.resolve({ uri: uri + "_compressed", width: 1200, height: 900 })
  ),
  SaveFormat: {
    JPEG: "jpeg",
    PNG: "png",
    WEBP: "webp",
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Global variable that tests can set to make single() return specific data.
// Set via (global as any).__mockSingleData = { id: "...", ... }
global.__mockSingleData = null;

// Create a thenable mock chain for supabase queries.
// The chain itself is thenable (has .then), so any terminal await resolves to { error: null }.
// Key methods like single(), delete() return proper promises for explicit awaits.
const createMockChain = (responseOverrides = {}) => {
  const defaultResponse = { data: null, error: null, ...responseOverrides };
  
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    range: jest.fn(() => chain),
    or: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    returns: jest.fn(() => chain),
    // Terminal methods — return proper promises
    // single() reads from the dynamic global so tests can inject data
    single: jest.fn(() =>
      Promise.resolve({
        data: global.__mockSingleData,
        error: null,
      })
    ),
    maybeSingle: jest.fn(() =>
      Promise.resolve({
        data: global.__mockSingleData,
        error: null,
      })
    ),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => Promise.resolve(defaultResponse)),
    // Make the chain thenable so await supabase.from(...).eq(...).eq(...) works
    then: (resolve) => resolve(defaultResponse),
  };
  // Ensure select returns the chain for insert().select().single() patterns
  chain.select.mockReturnValue(chain);
  return chain;
};

// Mock Supabase
jest.mock("@/config/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() =>
          Promise.resolve({ data: { path: "test-path" }, error: null })
        ),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: "https://test-url.com/image.jpg" },
        })),
        remove: jest.fn(() => Promise.resolve({ error: null })),
      })),
    },
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: "test-user-id" } },
          error: null,
        })
      ),
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signUp: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      updateUser: jest.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => Promise.resolve()), // Simplified
    })),
    removeChannel: jest.fn(),
    from: jest.fn(() => createMockChain()),
  },
  handleSupabaseError: jest.fn((error) => error?.message || "Unknown error"),
}));

// Mock react-native-svg
jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Circle: View,
    Rect: View,
    Path: View,
    Line: View,
    Polygon: View,
    Polyline: View,
    G: View,
    Text: View,
    Defs: View,
    Use: View,
    LinearGradient: View,
    Stop: View,
    RadialGradient: View,
    ClipPath: View,
    Pattern: View,
    Mask: View,
    Symbol: View,
    Image: View,
    ForeignObject: View,
  };
});

// Mock lucide-react-native
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const createMockIcon = (name) => {
    const MockIcon = (props) =>
      React.createElement(View, {
        ...props,
        testID: props.testID || `icon-${name}`,
      });
    MockIcon.displayName = name;
    return MockIcon;
  };
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === "__esModule") return true;
        if (prop === "default") return createMockIcon("default");
        return createMockIcon(prop);
      },
    }
  );
});

// Mock base64-arraybuffer
jest.mock("base64-arraybuffer", () => ({
  decode: jest.fn(() => new ArrayBuffer(8)),
}));

// Mock expo-haptics (used by utils/haptics.ts)
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: "Light",
    Medium: "Medium",
    Heavy: "Heavy",
  },
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
    Error: "Error",
  },
}));

// Mock expo-auth-session (used by services/social-auth.ts)
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "https://redirect.uri"),
  AuthRequest: jest.fn().mockImplementation(() => ({
    makeAuthUrl: jest.fn(() => "https://auth.url"),
    dismiss: jest.fn(),
    presentAsync: jest.fn(() =>
      Promise.resolve({
        type: "success",
        params: {},
      })
    ),
  })),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  TokenResponse: {
    isTokenResponse: jest.fn(() => true),
    refreshAsync: jest.fn(),
    exchangeCodeAsync: jest.fn(),
  },
  getRedirectUrl: jest.fn(() => "https://redirect.uri"),
  getDefaultReturnUrl: jest.fn(() => "https://redirect.uri"),
}));

// Mock expo-web-browser (used by services/social-auth.ts)
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: "success" })),
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "success" })),
  maybeCompleteAuthSession: jest.fn(),
  WebBrowserResultType: {
    SUCCESS: "success",
    CANCEL: "cancel",
    DISMISS: "dismiss",
  },
}));

// Mock expo-crypto (used by services/social-auth.ts — prevents ESM import chain to expo-asset)
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid-1234-5678"),
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }),
  digestStringAsync: jest.fn(() => Promise.resolve("mock-base64-digest")),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  CryptoEncoding: { BASE64: "base64", HEX: "hex" },
}));

// Mock expo-modules-core as it's a dependency of many expo packages
jest.mock("expo-modules-core", () => ({
  Platform: {
    OS: "test",
  },
  UnavailabilityError: class extends Error {
    constructor(moduleName, propertyName) {
      super(`Unavailable: ${moduleName}.${propertyName}`);
    }
  },
  EventEmitter: jest.fn(),
  requireNativeModule: jest.fn(),
}));

// Mock Alert
global.alert = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup testing environment
process.env.NODE_ENV = "test";
