import Routine from "../models/Routine.js";
import Product from "../models/Product.js";

const STRATEGY_ORDER = {
  minimal: 1,
  complete: 2,
  focus_treatment: 3,
  focus_hydration: 4,
  anti_aging: 5,
};

// Helper function to select the single best morning/night pair
const groupRoutinesByMorningNight = (routines, maxBudget = null) => {
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

        // If maxBudget is provided, only include pairs within budget
        if (maxBudget !== null && combinedPrice > maxBudget) {
          continue;
        }

        pairs.push({
          strategy: morning.strategy,
          priceBracket: morning.priceBracket,
          morning: morning,
          night: night,
          combinedPrice: combinedPrice,
          combinedRank: (morning.avgRank + night.avgRank) / 2,
        });
      }
    }
  }

  if (pairs.length === 0) return null;

  // Sort pairs by combined price (highest first), then by combined rank (highest second)
  pairs.sort((a, b) => {
    if (a.combinedPrice !== b.combinedPrice) {
      return b.combinedPrice - a.combinedPrice; // Higher price is better
    }
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

    // Filter routines to only include those where ALL products are within the price range
    const filteredRoutines = routines.filter((routine) => {
      // Check if all products in all steps are within the price range
      return routine.steps.every((step) => {
        return step.products.every((product) => {
          return product.price >= min && product.price <= max;
        });
      });
    });

    if (filteredRoutines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found where all products are within the specified price range",
      });
    }

    // Get the best morning/night pair
    const bestPair = groupRoutinesByMorningNight(filteredRoutines);

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
