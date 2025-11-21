import express from "express";

const router = express.Router();
// Cache to store search results
const imageCache = new Map();

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "Image API working!",
    timestamp: new Date().toISOString(),
    cacheSize: imageCache.size,
  });
});

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

    // Check cache first
    if (imageCache.has(q)) {
      console.log("Cache HIT - returning cached result");
      return res.json({ imageUrl: imageCache.get(q) });
    }

    console.log("Cache MISS - searching Google API");

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
        } else {
          console.log("No results from Pexels either");
        }
      } catch (error) {
        console.log("Pexels API error:", error.message);
      }
    }

    if (!imageUrl) {
      console.log("All APIs failed - no image found");
    }

    // Cache the result
    imageCache.set(q, imageUrl);
    console.log("Cached result for query:", q);

    console.log("Extracted image URL:", imageUrl);
    console.log("Cache size:", imageCache.size);
    console.log("=== END IMAGE SEARCH ===");

    res.json({ imageUrl });
  } catch (error) {
    console.error("Image search error:", error);
    res.json({ imageUrl: null });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "Image API is working",
    timestamp: new Date().toISOString(),
    env: {
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      hasSearchEngine: !!process.env.GOOGLE_CSE_ID,
    },
  });
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
        break;
      }
    }

    return res.json({ imageUrl });
  } catch (error) {
    console.error("Pexels search error:", error);
    return res.json({ imageUrl: null });
  }
}
