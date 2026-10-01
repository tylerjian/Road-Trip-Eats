const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default {
  expo: {
    name: "Road Trip Eats",
    slug: "road-trip-eats",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.roadtripeats.app",
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.roadtripeats.app",
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY
        }
      }
    },
    extra: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Road Trip Eats to use your location to find restaurants along your route."
        }
      ]
    ]
  }
};
