const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for React Native and Expo
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;