/// <reference types="webpack-dev-server" />
import { fileURLToPath } from 'url';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

// `__dirname` is not available in ESM modules, so derive it from `import.meta.url`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('webpack').Configuration & { devServer?: import('webpack-dev-server').Configuration }} */
const config = {
  context: __dirname,
  mode: isProduction ? 'production' : 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
  },
  experiments: {
    css: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules[\\/](?!(expo|expo-router|expo-.*|@expo|@react-navigation|react-native|@react-native)[\\/]).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-expo'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico|ttf|woff|woff2|eot)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      crypto: false,
      stream: false,
      buffer: false,
    },
    alias: {
      'react-native$': 'react-native-web',
      '@': path.resolve(__dirname),
      '@components': path.resolve(__dirname, 'components'),
      '@constants': path.resolve(__dirname, 'constants'),
      '@screens': path.resolve(__dirname, 'screens'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@types': path.resolve(__dirname, 'types'),
      '@stores': path.resolve(__dirname, 'stores'),
      '@config': path.resolve(__dirname, 'config'),
      '@styles': path.resolve(__dirname, 'styles'),
      '@app': path.resolve(__dirname, 'app'),
    },
  },
  ignoreWarnings: [
    {
      module: /node_modules[\\/]expo-router/,
    },
  ],
  stats: {
    errorDetails: true,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendorReact: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-native-web)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 20,
        },
        vendorSupabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'vendor-supabase',
          chunks: 'all',
          priority: 15,
        },
        vendorUI: {
          test: /[\\/]node_modules[\\/](lucide-react-native|react-native-svg|react-native-gesture-handler|react-native-reanimated)[\\/]/,
          name: 'vendor-ui',
          chunks: 'all',
          priority: 10,
        },
        commons: {
          minChunks: 2,
          name: 'commons',
          chunks: 'all',
          priority: 5,
        },
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(!isProduction),
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 8081,
    hot: true,
    historyApiFallback: true,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
};

export default config;
