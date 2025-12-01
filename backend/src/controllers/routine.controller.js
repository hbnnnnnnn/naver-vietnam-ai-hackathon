import Routine from "../models/Routine.js";
import Product from "../models/Product.js";

const STRATEGY_ORDER = {
  minimal: 1,
  complete: 2,
  focus_treatment: 3,
  focus_hydration: 4,
  anti_aging: 5,
};

export const getRoutine = async (req, res) => {
  try {
    const { skinType, budgetRange, strategy } = req.query;

    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const normalizedSkinType = skinType.toLowerCase();
    const query = { skinType: normalizedSkinType };

    if (budgetRange) {
      query.budgetRange = budgetRange;
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

    // Sort routines
    routines.sort((a, b) => {
      const orderA = STRATEGY_ORDER[a.strategy] || 999;
      const orderB = STRATEGY_ORDER[b.strategy] || 999;
      return orderA - orderB;
    });

    res.status(200).json({ routines });
  } catch (error) {
    console.error("Error in getRoutine:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routine", error: error.message });
  }
};

export const createRoutine = async (req, res) => {
  try {
    const { skinType, strategy, budgetRange } = req.body;

    if (!skinType) {
      return res.status(400).json({ message: "skinType is required" });
    }

    const query = { skinType: skinType.toLowerCase() };

    if (strategy) query.strategy = strategy;
    if (budgetRange) query.budgetRange = budgetRange;

    const routines = await Routine.find(query)
      .populate("steps.products")
      .lean();

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
    const { budgetRange, skinType } = req.query;

    if (!budgetRange) {
      return res.status(400).json({
        message:
          "budgetRange query parameter is required (budget-friendly, mid-range, or premium)",
      });
    }
    if (!skinType) {
      return res
        .status(400)
        .json({ message: "skinType query parameter is required" });
    }

    const validBudgetRanges = ["budget-friendly", "mid-range", "premium"];
    if (!validBudgetRanges.includes(budgetRange)) {
      return res.status(400).json({
        message: `Invalid budgetRange. Must be one of: ${validBudgetRanges.join(
          ", "
        )}`,
      });
    }

    const routines = await Routine.find({
      budgetRange: budgetRange,
      skinType: skinType.toLowerCase(),
    })
      .populate("steps.products")
      .lean();

    routines.sort((a, b) => {
      const orderA = STRATEGY_ORDER[a.strategy] || 999;
      const orderB = STRATEGY_ORDER[b.strategy] || 999;
      return orderA - orderB;
    });

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found for the specified budget range and skin type.",
      });
    }

    res.status(200).json(routines);
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
    let budgetRange;
    if (priceNum < 500000) {
      budgetRange = "budget-friendly";
    } else if (priceNum < 1500000) {
      budgetRange = "mid-range";
    } else {
      budgetRange = "premium";
    }

    const routines = await Routine.find({
      budgetRange: budgetRange,
      skinType: skinType.toLowerCase(),
    })
      .populate("steps.products")
      .lean();

    routines.sort((a, b) => {
      const orderA = STRATEGY_ORDER[a.strategy] || 999;
      const orderB = STRATEGY_ORDER[b.strategy] || 999;
      return orderA - orderB;
    });

    if (routines.length === 0) {
      return res.status(404).json({
        message:
          "No routines found for the specified price range and skin type.",
      });
    }

    res.status(200).json(routines);
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
    const { minPrice, maxPrice, skinType, strategy, name } = req.query;

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

    const query = {
      skinType: skinType.toLowerCase(),
      totalPrice: { $gte: min, $lte: max },
    };

    if (strategy) {
      query.strategy = strategy;
    }

    if (name) {
      query.name = name;
    }

    // Get all matching routines and populate products
    let routines = await Routine.find(query).populate("steps.products").lean();

    if (routines.length === 0) {
      return res.status(404).json({
        message: "No routines found for the specified price range and criteria",
      });
    }

    // Sort by avgRank (best quality - higher is better) first, then by totalPrice (highest) second
    routines.sort((a, b) => {
      if (a.avgRank !== b.avgRank) {
        return b.avgRank - a.avgRank; // Higher rank is better
      }
      return b.totalPrice - a.totalPrice; // Higher price second
    });

    // Return top routine with highest rating and highest price
    const topRoutine = routines[0];

    res.status(200).json({
      routine: topRoutine,
      totalMatches: routines.length,
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
    const { minPrice, maxPrice, skinType, strategy, name } = req.query;

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

    if (name) {
      query.name = name;
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

    // Sort by avgRank (best quality - higher is better) first, then by totalPrice
    filteredRoutines.sort((a, b) => {
      if (a.avgRank !== b.avgRank) {
        return b.avgRank - a.avgRank; // Higher rank is better
      }
      return b.totalPrice - a.totalPrice; // Higher price second
    });

    res.status(200).json({
      routines: filteredRoutines,
      count: filteredRoutines.length,
    });
  } catch (error) {
    console.error("Error in getRoutinesByProductPriceRange:", error);
    res
      .status(500)
      .json({ message: "Error retrieving routines", error: error.message });
  }
};
