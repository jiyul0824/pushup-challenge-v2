const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow bundling .tflite model files as assets
config.resolver.assetExts.push("tflite");

/**
 * react-native-svg는 package.json의 "react-native": "src/index.ts" 때문에
 * Metro가 src를 따라가며 일부 서브경로(extractBrush 등) 해석에 실패할 수 있음.
 * 빌드된 lib/commonjs 진입점을 사용하도록 고정한다.
 */
const reactNativeSvgMain = path.resolve(
  __dirname,
  "node_modules/react-native-svg/lib/commonjs/index.js",
);

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg") {
    return {
      type: "sourceFile",
      filePath: reactNativeSvgMain,
    };
  }
  if (typeof upstreamResolveRequest === "function") {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
