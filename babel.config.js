module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: [
            '.ios.js',
            '.android.js',
            '.js',
            '.ts',
            '.tsx',
            '.json',
          ],
          alias: {
            '@': './',
            '@components': './components',
            '@screens': './screens',
            '@assets': './assets',
            '@styles': './styles',
            '@lib': './lib',
            '@app': './app',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
