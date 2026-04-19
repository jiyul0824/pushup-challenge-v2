module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-worklets-core must come before reanimated
      "react-native-worklets-core/plugin",
      // reanimated must be last
      "react-native-reanimated/plugin",
    ],
  };
};
