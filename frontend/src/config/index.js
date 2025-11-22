/**
 * App Configuration
 */

export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5731/api",
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // Feature Flags
  features: {
    useRealAPI:
      import.meta.env.MODE === "production" ||
      import.meta.env.VITE_USE_REAL_API === "true",
    enableAnalytics: import.meta.env.MODE === "production",
    showDebugInfo: import.meta.env.MODE === "development",
  },

  // Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    quality: 0.8, // Image compression quality
  },

  // Analysis Configuration
  analysis: {
    progressUpdateInterval: 500, // ms
    fallbackToMockOnError: true,
    enableErrorReporting: true,
  },
};

export default config;
