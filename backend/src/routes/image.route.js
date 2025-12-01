import express from "express";
import ProductImage from "../models/ProductImage.js";

const router = express.Router();
// In-memory cache for ultra-fast access (optional L1 cache)
const memoryCache = new Map();
const CACHE_EXPIRY_DAYS = 7;

// Get cached image from database - Check DB first, only call API if not found
const getCachedImageFromDB = async (query) => {
  try {
    // Always try to get Google images from DB first (highest priority)
    const googleCached = await ProductImage.findOne({
      query,
      source: "google",
      expiresAt: { $gt: new Date() },
    });

    if (googleCached) {
      console.log("Database cache HIT (Google) for:", query);
      // Also cache in memory for ultra-fast access
      memoryCache.set(query, {
        imageUrl: googleCached.imageUrl,
        timestamp: googleCached.createdAt,
        source: "google",
      });
      return { imageUrl: googleCached.imageUrl, source: "google" };
    }

    console.log("Database cache MISS (Google) for:", query);
    return null;
  } catch (error) {
    console.error("Error reading from database cache:", error);
    return null;
  }
};

// Save image to database cache - ONLY save Google images, NOT Pexels
const saveCachedImageToDB = async (query, imageUrl, source = "google") => {
  try {
    // Only save Google images to database
    if (source !== "google") {
      console.log(`Skipping database save for ${source} image:`, query);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);

    const productImage = new ProductImage({
      query,
      imageUrl,
      source,
      expiresAt,
    });

    await productImage.save();

    // Also cache in memory
    memoryCache.set(query, {
      imageUrl,
      timestamp: new Date(),
      source,
    });

    console.log(`Saved to database cache (${source}):`, query);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - image already exists
      console.log("Image already cached for query:", query);
    } else {
      console.error("Error saving to database cache:", error);
    }
  }
};

// Get product image
router.get("/product-image", async (req, res) => {
  try {
    const { q } = req.query;
    console.log("=== IMAGE SEARCH REQUEST ===");
    console.log("Query:", q);

    if (!q) {
      console.log("No query provided");
      return res.json({ imageUrl: null });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    const hasGoogleAPI = !!(GOOGLE_API_KEY && SEARCH_ENGINE_ID);
    console.log("Google API available:", hasGoogleAPI);

    // STEP 1: Check memory cache first (fastest)
    if (memoryCache.has(q)) {
      const cached = memoryCache.get(q);
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - new Date(cached.timestamp).getTime() < expiryTime) {
        console.log(`Memory cache HIT (${cached.source}) for:`, q);
        return res.json({ imageUrl: cached.imageUrl });
      } else {
        memoryCache.delete(q);
      }
    }

    // STEP 2: Check database cache (only Google images saved here)
    const cachedResult = await getCachedImageFromDB(q);
    if (cachedResult) {
      console.log(`Returning cached Google image for:`, q);
      return res.json({ imageUrl: cachedResult.imageUrl });
    }

    // STEP 3: No cache found - fetch from external APIs
    console.log("Fetching from external APIs for:", q);

    let imageUrl = null;
    let imageSource = null;

    // Try Google API first if available
    if (hasGoogleAPI) {
      console.log("Trying Google Custom Search API...");
      const searchQuery = `${q} -before -video -person`;

      // Try multiple search strategies
      const searchVariations = [
        searchQuery,
        `${q} skincare product -video`,
        `${q} cosmetic -person`,
        `${q.split(" ").slice(0, 2).join(" ")} product`,
        `${q.split(" ")[0]} skincare`,
        `cosmetic product ${q.split(" ")[0]}`,
      ];

      for (let i = 0; i < searchVariations.length && !imageUrl; i++) {
        const currentQuery = searchVariations[i];
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
          currentQuery
        )}&searchType=image&num=1&imgSize=medium&imgType=photo&safe=active`;

        console.log(`  Variation ${i + 1}: "${currentQuery}"`);

        try {
          const fetch = (await import("node-fetch")).default;
          const response = await fetch(url);
          const data = await response.json();

          if (data.items && data.items.length > 0) {
            imageUrl = data.items[0].link;
            imageSource = "google";
            console.log(`  SUCCESS with variation ${i + 1}`);
            break;
          }
        } catch (error) {
          console.log(`  Error with variation ${i + 1}:`, error.message);
        }
      }

      // Save Google image to database for future use
      if (imageUrl && imageSource === "google") {
        console.log("Saving Google image to database...");
        await saveCachedImageToDB(q, imageUrl, "google");
      }
    }

    // Fallback to Pexels if Google failed (but DON'T save to database)
    if (!imageUrl && PEXELS_API_KEY) {
      console.log("Google failed - trying Pexels fallback (NOT cached)...");
      try {
        const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          q + " cosmetic skincare product"
        )}&per_page=1&orientation=square`;
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(pexelsUrl, {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        });

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
          imageUrl = data.photos[0].src.medium;
          imageSource = "pexels";
          console.log("SUCCESS with Pexels (temporary, not cached)");
          // NOTE: We do NOT save Pexels images to database
        }
      } catch (error) {
        console.log("Pexels API error:", error.message);
      }
    }

    if (!imageUrl) {
      console.log("All APIs failed - no image found");
    } else {
      console.log(`Final result: ${imageSource} image`);
    }

    console.log("Memory cache size:", memoryCache.size);
    console.log("=== END IMAGE SEARCH ===\n");

    res.json({ imageUrl });
  } catch (error) {
    console.error("Image search error:", error);
    res.json({ imageUrl: null });
  }
});

// Clear Pexels cache endpoint (for debugging/migration)
router.delete("/clear-pexels-cache", async (req, res) => {
  try {
    const result = await ProductImage.deleteMany({ source: "pexels" });
    memoryCache.clear(); // Also clear memory cache
    console.log(`Cleared ${result.deletedCount} Pexels images from database`);
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Pexels cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing Pexels cache:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
