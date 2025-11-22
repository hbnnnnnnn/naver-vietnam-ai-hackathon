// Product image caching utilities - Frontend localStorage cache (L1)
// Backend will handle database cache (L2) and external API calls (L3)
const CACHE_KEY_PREFIX = "productImage_";
const CACHE_EXPIRY_DAYS = 7; // Cache for 7 days

export const getCachedImage = (query) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + btoa(query); // Base64 encode query for safe key
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { imageUrl, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert to milliseconds

      if (now - timestamp < expiryTime) {
        console.log("Frontend cache HIT for:", query);
        return imageUrl;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
        console.log("Frontend cache EXPIRED for:", query);
      }
    }
    return null;
  } catch (error) {
    console.error("Error reading image cache:", error);
    return null;
  }
};

export const setCachedImage = (query, imageUrl) => {
  try {
    const cacheKey = CACHE_KEY_PREFIX + btoa(query);
    const cacheData = {
      imageUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching image:", error);
  }
};

export const getProductImage = async (query) => {
  try {
    // Check frontend cache first (L1 - ultra fast)
    const cachedImage = getCachedImage(query);
    if (cachedImage) {
      return cachedImage;
    }

    console.log("Frontend cache MISS - fetching from backend:", query);
    const apiUrl = "http://localhost:5731";
    const res = await fetch(
      `${apiUrl}/api/product-image?q=${encodeURIComponent(query)}`
    );

    console.log("Backend API response status:", res.status);
    if (!res.ok) return null;

    const data = await res.json();
    console.log("Backend API response data:", data);

    if (data.imageUrl) {
      console.log("Found image from backend:", data.imageUrl);
      // Cache in frontend for next time
      setCachedImage(query, data.imageUrl);
      return data.imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Error fetching product image:", error);
    return null;
  }
};

// Preload images for routine steps
export const preloadRoutineImages = async (routine) => {
  try {
    console.log(
      "Preloading images for routine:",
      routine.routineName || routine.name
    );

    const allSteps = [
      ...(routine.morningRoutine?.steps || []),
      ...(routine.eveningRoutine?.steps || []),
    ];

    // Extract unique categories
    const categories = [...new Set(allSteps.map((step) => step.category))];

    for (const category of categories) {
      // Create a generic query for the category
      const query = `${category} skincare product`;

      // Check if we already have this cached
      const cached = getCachedImage(query);
      if (!cached) {
        console.log("Preloading image for category:", category);
        await getProductImage(query);
      }
    }
  } catch (error) {
    console.error("Error preloading routine images:", error);
  }
};

// Clean up expired cache entries
export const cleanupImageCache = () => {
  try {
    const keysToRemove = [];
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          const { timestamp } = JSON.parse(cached);
          if (now - timestamp >= expiryTime) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Invalid cache entry, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log("Cleaned up", keysToRemove.length, "expired cache entries");
  } catch (error) {
    console.error("Error cleaning up image cache:", error);
  }
};
