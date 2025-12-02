import Routine from "../models/Routine.js";
import Product from "../models/Product.js";

const STRATEGY_ORDER = {
  minimal: 1,
  complete: 2,
  focus_treatment: 3,
  focus_hydration: 4,
  anti_aging: 5,
};

// In-memory cache for price ranges with TTL
const priceRangeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper function to select the single best morning/night pair
const groupRoutinesByMorningNight = (routines, maxBudget = null, enforceMaxBudget = true) => {
  // Separate morning and night routines
  const morningRoutines = routines.filter(r => r.name === "morning");
  const nightRoutines = routines.filter(r => r.name === "night");

  // Find all possible pairs and calculate combined metrics
  const pairs = [];

  for (const morning of morningRoutines) {
    for (const night of nightRoutines) {
      // Only pair routines with same strategy and priceBracket
      if (morning.strategy === night.strategy && morning.priceBracket === night.priceBracket) {
        const combinedPrice = morning.totalPrice + night.totalPrice;

        // If maxBudget is provided and enforceMaxBudget is true, only include pairs within budget
        if (enforceMaxBudget && maxBudget !== null && combinedPrice > maxBudget) {
          continue;
        }

        // Calculate combined product count if available
        const combinedProductCount =
          (morning.totalProductsInRange || 0) + (night.totalProductsInRange || 0);

        pairs.push({
          strategy: morning.strategy,
          priceBracket: morning.priceBracket,
          morning: morning,
          night: night,
          combinedPrice: combinedPrice,
          combinedRank: (morning.avgRank + night.avgRank) / 2,
          combinedProductCount: combinedProductCount,
        });
      }
    }
  }

  if (pairs.length === 0) return null;

  // Sort pairs prioritizing:
  // 1. Closest to max budget (if maxBudget is provided)
  // 2. Higher combined price (better quality)
  // 3. Higher rank (better ranking)
  pairs.sort((a, b) => {
    // If maxBudget is provided, prioritize pairs closest to the max budget
    if (maxBudget !== null) {
      const distanceA = Math.abs(maxBudget - a.combinedPrice);
      const distanceB = Math.abs(maxBudget - b.combinedPrice);

      if (distanceA !== distanceB) {
        return distanceA - distanceB; // Closer to max budget is better
      }
    }

    // Then by price
    if (a.combinedPrice !== b.combinedPrice) {
      return b.combinedPrice - a.combinedPrice; // Higher price is better
    }

    // Finally by rank
    return b.combinedRank - a.combinedRank; // Higher rank is better
  });

  // Return only the top pair
  const bestPair = pairs[0];
  return {
    strategy: bestPair.strategy,
    priceBracket: bestPair.priceBracket,
    morning: bestPair.morning,
    night: bestPair.night,
    combinedPrice: bestPair.combinedPrice,
    combinedRank: bestPair.combinedRank,
    combinedProductCount: bestPair.combinedProductCount,
  };
};

export const getRoutine = async (req, res) => {
  try {
    const { skinType, priceBracket, strategy } = req.query;

    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const normalizedSkinType = skinType.toLowerCase();
    const query = { skinType: normalizedSkinType };

    if (priceBracket) {
      query.priceBracket = priceBracket;
    }
    if (strategy) {
      query.strategy = strategy;
    }

    // Populate products to get full product data instead of just IDs
    let routines = await Routine.find(query).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found for the specified criteria. Please ensure routines are seeded in the database.",
        query: query,
      });
    }

    // Get the best morning/night pair
    const bestPair = groupRoutinesByMorningNight(routines);

    if (!bestPair) {
      return res.status(404).json({
        message: "No matching morning/night routine pairs found",
      });
    }

    res.status(200).json({ routine: bestPair });
  } catch (error) {
    console.error("Error in getRoutine:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routine", error: error.message });
  }
};

export const createRoutine = async (req, res) => {
  try {
    const { skinType, strategy, priceBracket } = req.body;

    if (!skinType) {
      return res.status(400).json({ message: "skinType is required" });
    }

    const query = { skinType: skinType.toLowerCase() };

    if (strategy) query.strategy = strategy;
    if (priceBracket) query.priceBracket = priceBracket;

    const routines = await Routine.find(query).populate("steps.products").lean();

    routines.sort((a, b) => {
      const orderA = STRATEGY_ORDER[a.strategy] || 999;
      const orderB = STRATEGY_ORDER[b.strategy] || 999;
      return orderA - orderB;
    });

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found. Please ensure routines are seeded in the database.",
      });
    }

    const morning = routines.filter((r) => r.name === "morning");
    const night = routines.filter((r) => r.name === "night");

    res.status(200).json({
      message: "Routines retrieved successfully",
      morning,
      night,
    });
  } catch (error) {
    console.error("Error in createRoutine:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routine", error: error.message });
  }
};

export const getRoutineByBudgetRange = async (req, res) => {
  try {
    const { priceBracket, skinType } = req.query;

    if (!priceBracket) {
      return res.status(400).json({
        message:
          "priceBracket query parameter is required (budget, affordable, mid-range, premium, luxury, or ultra-luxury)",
      });
    }
    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const validPriceBrackets = ["budget", "affordable", "mid-range", "premium", "luxury", "ultra-luxury"];
    if (!validPriceBrackets.includes(priceBracket)) {
      return res.status(400).json({
        message: `Invalid priceBracket. Must be one of: ${validPriceBrackets.join(
          ", "
        )}`,
      });
    }

    const routines = await Routine.find({
      priceBracket: priceBracket,
      skinType: skinType.toLowerCase(),
    }).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found for the specified budget range and skin type.",
      });
    }

    // Get the best morning/night pair
    const bestPair = groupRoutinesByMorningNight(routines);

    if (!bestPair) {
      return res.status(404).json({
        message: "No matching morning/night routine pairs found",
      });
    }

    res.status(200).json({ routine: bestPair });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving routines", error: error.message });
  }
};

export const getRoutineByPrice = async (req, res) => {
  try {
    const { price, skinType } = req.query;
    if (!price) {
      return res
        .status(400)
        .json({ message: "Price query parameter is required" });
    }
    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const priceNum = parseFloat(price);
    let priceBracket;
    if (priceNum <= 894200) {
      priceBracket = "budget";
    } else if (priceNum <= 1157200) {
      priceBracket = "affordable";
    } else if (priceNum <= 1630600) {
      priceBracket = "mid-range";
    } else if (priceNum <= 2314400) {
      priceBracket = "premium";
    } else if (priceNum <= 4602500) {
      priceBracket = "luxury";
    } else {
      priceBracket = "ultra-luxury";
    }

    const routines = await Routine.find({
      priceBracket: priceBracket,
      skinType: skinType.toLowerCase(),
    }).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found for the specified price range and skin type.",
      });
    }

    // Get the best morning/night pair
    const bestPair = groupRoutinesByMorningNight(routines);

    if (!bestPair) {
      return res.status(404).json({
        message: "No matching morning/night routine pairs found",
      });
    }

    res.status(200).json({ routine: bestPair });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving routines", error: error.message });
  }
};

export const deleteRoutineById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRoutine = await Routine.findByIdAndDelete(id);
    if (!deletedRoutine) {
      return res.status(404).json({ message: "Routine not found" });
    }
    res.status(200).json({
      message: "Routine deleted successfully",
      routine: deletedRoutine,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting routine", error: error.message });
  }
};

export const getRoutinesByPriceRange = async (req, res) => {
  try {
    const { minPrice, maxPrice, skinType, strategy } = req.query;

    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    if (!maxPrice) {
      return res
        .status(400)
        .json({ message: "maxPrice query parameter is required" });
    }

    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = parseFloat(maxPrice);

    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({ message: "Invalid price values" });
    }

    // Find all routines up to the max budget (we'll check combined price when pairing)
    const query = {
      skinType: skinType.toLowerCase(),
      totalPrice: { $lte: max },
    };

    if (strategy) {
      query.strategy = strategy;
    }

    // Get all matching routines and populate products
    let routines = await Routine.find(query).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message: "No routines found for the specified price range and criteria",
      });
    }

    // Get the best morning/night pair within the combined budget
    const bestPair = groupRoutinesByMorningNight(routines, max);

    if (!bestPair) {
      return res.status(404).json({
        message: "No matching morning/night routine pairs found within budget",
      });
    }

    res.status(200).json({
      routine: bestPair,
    });
  } catch (error) {
    console.error("Error in getRoutinesByPriceRange:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routines", error: error.message });
  }
};

export const getRoutinesByProductPriceRange = async (req, res) => {
  try {
    const { minPrice, maxPrice, skinType, strategy } = req.query;

    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    if (!maxPrice) {
      return res
        .status(400)
        .json({ message: "maxPrice query parameter is required" });
    }

    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = parseFloat(maxPrice);

    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({ message: "Invalid price values" });
    }

    // Find all routines for the given skin type
    const query = {
      skinType: skinType.toLowerCase(),
    };

    if (strategy) {
      query.strategy = strategy;
    }

    // Get all routines and populate products
    let routines = await Routine.find(query).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message: "No routines found for the specified criteria",
      });
    }

    // Filter products within each routine to only include those in the price range
    // AND only keep routines where each step has at least one product in range
    const filteredRoutines = routines
      .map((routine) => {
        // Filter products in each step
        const filteredSteps = routine.steps.map((step) => ({
          ...step,
          products: step.products.filter(
            (product) => product.price >= min && product.price <= max
          ),
        }));

        // Count total products after filtering
        const totalProductsInRange = filteredSteps.reduce(
          (sum, step) => sum + step.products.length,
          0
        );

        return {
          ...routine,
          steps: filteredSteps,
          totalProductsInRange,
        };
      })
      .filter((routine) => {
        // Only keep routines where each step has at least one product
        return routine.steps.every((step) => step.products.length > 0);
      });

    if (filteredRoutines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found where each step has at least one product within the specified price range",
      });
    }

    // Get the best morning/night pair (sorted by closeness to max budget, but don't enforce it)
    const bestPair = groupRoutinesByMorningNight(filteredRoutines, max, false);

    if (!bestPair) {
      return res.status(404).json({
        message: "No matching morning/night routine pairs found",
      });
    }

    res.status(200).json({
      routine: bestPair,
    });
  } catch (error) {
    console.error("Error in getRoutinesByProductPriceRange:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routines", error: error.message });
  }
};

export const getPriceRanges = async (req, res) => {
  try {
    const { skinType } = req.query;

    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const normalizedSkinType = skinType.toLowerCase();
    const cacheKey = `price_ranges_${normalizedSkinType}`;

    // Check cache first
    const cached = priceRangeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    const strategies = Object.keys(STRATEGY_ORDER);
    const priceRanges = {};

    // Process each strategy in parallel for better performance
    await Promise.all(
      strategies.map(async (strategy) => {
        // Aggregation for total routine price (min/max of totalPrice)
        const totalPriceAggregation = await Routine.aggregate([
          { $match: { skinType: normalizedSkinType, strategy: strategy } },
          {
            $group: {
              _id: null,
              minTotalPrice: { $min: "$totalPrice" },
              maxTotalPrice: { $max: "$totalPrice" },
            },
          },
        ]);

        // Aggregation for individual product prices
        // First unwind steps, then unwind products, then get min/max
        const productPriceAggregation = await Routine.aggregate([
          { $match: { skinType: normalizedSkinType, strategy: strategy } },
          { $unwind: "$steps" },
          { $unwind: "$steps.products" },
          {
            $lookup: {
              from: "products",
              localField: "steps.products",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          {
            $group: {
              _id: null,
              minProductPrice: { $min: "$productDetails.price" },
              maxProductPrice: { $max: "$productDetails.price" },
            },
          },
        ]);

        // Store results
        priceRanges[strategy] = {
          totalRoutinePrice: {
            min: totalPriceAggregation[0]?.minTotalPrice || 0,
            max: totalPriceAggregation[0]?.maxTotalPrice || 0,
          },
          individualProductPrice: {
            min: productPriceAggregation[0]?.minProductPrice || 0,
            max: productPriceAggregation[0]?.maxProductPrice || 0,
          },
        };
      })
    );

    const response = {
      skinType: normalizedSkinType,
      priceRanges,
    };

    // Cache the result
    priceRangeCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getPriceRanges:", error);
    res
      .status(500)
      .json({ message: "Error retrieving price ranges", error: error.message });
  }
};
