# Expo SDK 50 → 52 Upgrade Notes

## Pre-upgrade (already done)
- `package.json` updated with SDK 52 compatible versions
- Run `npm install --legacy-peer-deps` locally

## Post-install steps

### 1. Verify the upgrade
```bash
npx expo install --check
```
This reports any version mismatches. Fix with:
```bash
npx expo install --fix
```

### 2. Update metro.config.js (if needed)
SDK 52 uses `@expo/metro-config` internally. The current config should work, but if you see metro errors:
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

### 3. Update babel.config.js
Move `react-native-reanimated/plugin` to the END of the plugins array (it must be last).

### 4. Navigation changes (expo-router v4)
- `expo-router` v4 drops `@react-navigation/*` — the navigation is now built-in
- Remove `@react-navigation/bottom-tabs`, `@react-navigation/native`, `@react-navigation/stack` from dependencies
- Update any `useNavigation()` calls to use `expo-router` hooks instead
- The `app/_layout.tsx` file may need updates for the new layout system

### 5. Update Sentry
`sentry-expo` is deprecated in SDK 52. Use `@sentry/react-native` directly (already in deps).

### 6. Test critical paths
- Auth flow (sign up, sign in, Google/Apple OAuth)
- Vendor listing and search
- Booking creation and payment flow
- Subscription purchase
- AI features
- Image upload

### 7. Run npm audit fix
After the upgrade, peer dep conflicts should be resolved:
```bash
npm audit fix
npm audit --audit-level=high
```

## Known breaking changes (SDK 50 → 52)
- React Native 0.73 → 0.76 (New Architecture enabled by default)
- `expo-router` v3 → v4 (navigation API changes)
- `@react-navigation/*` packages removed from expo-router
- `expo-splash-screen` API changes
- `expo-status-bar` API changes
- Removed `@types/react-native` (types now bundled with RN)
