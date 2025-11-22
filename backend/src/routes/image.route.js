import express from "express";
import ProductImage from "../models/ProductImage.js";

const router = express.Router();
// In-memory cache for ultra-fast access (optional L1 cache)
const memoryCache = new Map();
const CACHE_EXPIRY_DAYS = 7;

// Get cached image from database - prioritize Google over Pexels
const getCachedImageFromDB = async (query) => {
  try {
    // First try to get Google images (highest priority)
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
      return googleCached.imageUrl;
    }

    // If Google not available but we have valid Google API credentials, try fresh Google search
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

    if (GOOGLE_API_KEY && SEARCH_ENGINE_ID) {
      // Check if we have Pexels cached but prefer to try Google first
      const pexelsCached = await ProductImage.findOne({
        query,
        source: "pexels",
        expiresAt: { $gt: new Date() },
      });

      if (pexelsCached) {
        console.log(
          "Found Pexels in cache, but Google API available - will try Google first"
        );
        return null; // Force fresh Google search
      }
    } else {
      // No Google API available, use Pexels if cached
      const pexelsCached = await ProductImage.findOne({
        query,
        source: "pexels",
        expiresAt: { $gt: new Date() },
      });

      if (pexelsCached) {
        console.log("Database cache HIT (Pexels - no Google API) for:", query);
        memoryCache.set(query, {
          imageUrl: pexelsCached.imageUrl,
          timestamp: pexelsCached.createdAt,
          source: "pexels",
        });
        return pexelsCached.imageUrl;
      }
    }

    console.log("Database cache MISS for:", query);
    return null;
  } catch (error) {
    console.error("Error reading from database cache:", error);
    return null;
  }
};

// Save image to database cache
const saveCachedImageToDB = async (query, imageUrl, source = "google") => {
  try {
    // If we're saving a Google image, remove any existing Pexels cache for this query
    if (source === "google") {
      await ProductImage.deleteMany({ query, source: "pexels" });
      console.log(
        "Removed Pexels cache for query (replaced with Google):",
        query
      );
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
      // Duplicate key error
      // Update existing record if it's from a lower priority source
      try {
        const existing = await ProductImage.findOne({ query });
        if (existing && existing.source !== "google" && source === "google") {
          // Replace Pexels with Google
          await ProductImage.deleteOne({ query });
          await saveCachedImageToDB(query, imageUrl, source);
        } else {
          console.log("Image already cached for query:", query);
        }
      } catch (updateError) {
        console.error("Error updating cache:", updateError);
      }
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

    // Check memory cache first (ultra-fast L1 cache)
    if (memoryCache.has(q)) {
      const cached = memoryCache.get(q);
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (Date.now() - new Date(cached.timestamp).getTime() < expiryTime) {
        // If it's Google image, return immediately
        if (cached.source === "google") {
          console.log("Memory cache HIT (Google) for:", q);
          return res.json({ imageUrl: cached.imageUrl });
        }

        // If it's Pexels but Google API is available, prefer fresh Google search
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

        if (GOOGLE_API_KEY && SEARCH_ENGINE_ID) {
          console.log(
            "Memory has Pexels but Google API available - trying Google first"
          );
          memoryCache.delete(q); // Remove Pexels from memory to force fresh search
        } else {
          console.log("Memory cache HIT (Pexels - no Google API) for:", q);
          return res.json({ imageUrl: cached.imageUrl });
        }
      } else {
        memoryCache.delete(q);
      }
    }

    // Check database cache (L2 cache)
    const cachedImageUrl = await getCachedImageFromDB(q);
    if (cachedImageUrl) {
      return res.json({ imageUrl: cachedImageUrl });
    }

    console.log("All caches MISS - searching external APIs for:", q);

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    console.log("API Key exists:", !!GOOGLE_API_KEY);
    console.log("Search Engine ID exists:", !!SEARCH_ENGINE_ID);
    console.log("Pexels API Key exists:", !!PEXELS_API_KEY);

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.log("Missing Google API credentials - trying Pexels fallback");
      if (PEXELS_API_KEY) {
        return await searchPexels(q, res);
      } else {
        console.log("No fallback API available");
        return res.json({ imageUrl: null });
      }
    }

    const searchQuery = `${q} -before -video -person`;

    // Try multiple search strategies if first one fails
    const searchVariations = [
      searchQuery,
      `${q} skincare product -video`,
      `${q} cosmetic -person`,
      `${q.split(" ").slice(0, 2).join(" ")} product`, // Just brand + first word
      `${q.split(" ")[0]} skincare`, // Just brand + skincare
      `cosmetic product ${q.split(" ")[0]}`, // Generic + brand
    ];

    let imageUrl = null;

    for (let i = 0; i < searchVariations.length && !imageUrl; i++) {
      const currentQuery = searchVariations[i];
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
        currentQuery
      )}&searchType=image&num=1&imgSize=medium&imgType=photo&safe=active`;

      console.log(`Trying search variation ${i + 1}: "${currentQuery}"`);

      try {
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(url);
        const data = await response.json();

        console.log(`Variation ${i + 1} - Status:`, response.status);
        console.log(
          `Variation ${i + 1} - Items found:`,
          data.items?.length || 0
        );

        if (data.items && data.items.length > 0) {
          imageUrl = data.items[0].link;
          console.log(`SUCCESS with variation ${i + 1}: ${imageUrl}`);
          break;
        } else {
          console.log(`No results for variation ${i + 1}`);
        }
      } catch (error) {
        console.log(`Error with variation ${i + 1}:`, error.message);
      }
    }

    // If Google API failed completely, try Pexels as fallback
    if (!imageUrl && PEXELS_API_KEY) {
      console.log("Google API failed - trying Pexels fallback");
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
        console.log("Pexels API response:", data);

        if (data.photos && data.photos.length > 0) {
          imageUrl = data.photos[0].src.medium;
          console.log("SUCCESS with Pexels:", imageUrl);
          // Save to database cache with source
          await saveCachedImageToDB(q, imageUrl, "pexels");
        } else {
          console.log("No results from Pexels either");
        }
      } catch (error) {
        console.log("Pexels API error:", error.message);
      }
    }

    if (!imageUrl) {
      console.log("All APIs failed - no image found");
    } else {
      // Save to database cache
      await saveCachedImageToDB(q, imageUrl, "google");
    }

    console.log("Final image URL:", imageUrl);
    console.log("Memory cache size:", memoryCache.size);
    console.log("=== END IMAGE SEARCH ===");

    res.json({ imageUrl });
  } catch (error) {
    console.error("Image search error:", error);
    res.json({ imageUrl: null });
  }
});

export default router;

// Pexels fallback function
async function searchPexels(query, res) {
  try {
    console.log("Using Pexels API for:", query);
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    const searchTerms = [
      `${query} cosmetic skincare product`,
      `${query} skincare`,
      `${query} cosmetic`,
      `skincare product`,
      `cosmetic product`,
    ];

    let imageUrl = null;

    for (let term of searchTerms) {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        term
      )}&per_page=1&orientation=square`;
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(url, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      const data = await response.json();
      console.log(
        `Pexels search for "${term}":`,
        data.photos?.length || 0,
        "results"
      );

      if (data.photos && data.photos.length > 0) {
        imageUrl = data.photos[0].src.medium;
        console.log("Found Pexels image:", imageUrl);
        // Save to database cache
        await saveCachedImageToDB(query, imageUrl, "pexels");
        break;
      }
    }

    return res.json({ imageUrl });
  } catch (error) {
    console.error("Pexels search error:", error);
    return res.json({ imageUrl: null });
  }
}
