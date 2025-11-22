import mongoose from "mongoose";
import User from "../models/User.js";
import SavedRoutine from "../models/SavedRoutine.js";
import ScanHistory from "../models/ScanHistory.js";

// Create or update user
export const createOrUpdateUser = async (req, res) => {
  try {
    const { username, name, skinType, concerns, latitude, longitude } =
      req.body;

    // Validate required fields
    if (!username || !name) {
      return res.status(400).json({
        message: "Username and name are required",
        received: { username, name },
      });
    }

    // Check if user exists by username
    let user = await User.findOne({ username });

    if (user) {
      // Update existing user
      user.name = name || user.name;
      user.skinType = skinType || user.skinType;
      user.concerns = concerns || user.concerns;
      if (latitude !== undefined) user.latitude = latitude;
      if (longitude !== undefined) user.longitude = longitude;

      await user.save();
      console.log("User updated successfully:", user._id);
      res.status(200).json({ message: "User updated successfully", user });
    } else {
      // Create new user
      user = new User({
        username,
        name,
        skinType: skinType || "normal",
        concerns: concerns || [],
        latitude,
        longitude,
      });
      await user.save();
      res.status(201).json({ message: "User created successfully", user });
    }
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username already exists",
        error: "DUPLICATE_USERNAME",
        details: error.message,
      });
    }

    res.status(500).json({
      message: "Error creating/updating user",
      error: error.message,
      code: error.code,
    });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      skinType,
      concerns,
      budget,
      routinePreference,
      location,
      latitude,
      longitude,
    } = req.body;
    const newUser = new User({
      skinType,
      concerns,
      latitude,
      longitude,
    });
    await newUser.save();
    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding user", error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

// Save routine
export const saveRoutine = async (req, res) => {
  try {
    const {
      userId,
      routineName,
      routineType,
      skinType,
      priceRange,
      uvIndex,
      location,
      morningRoutine,
      eveningRoutine,
    } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedRoutine = new SavedRoutine({
      userId,
      routineName,
      routineType,
      skinType,
      priceRange,
      uvIndex,
      location,
      morningRoutine,
      eveningRoutine,
    });

    await savedRoutine.save();
    res
      .status(201)
      .json({ message: "Routine saved successfully", routine: savedRoutine });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving routine", error: error.message });
  }
};

// Get user's saved routines
export const getSavedRoutines = async (req, res) => {
  try {
    const { userId } = req.params;

    const routines = await SavedRoutine.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "email username name");

    res.status(200).json({ routines });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching routines", error: error.message });
  }
};

// Delete saved routine
export const deleteSavedRoutine = async (req, res) => {
  try {
    const { routineId } = req.params;

    const deletedRoutine = await SavedRoutine.findByIdAndDelete(routineId);
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

// Delete multiple routines
export const deleteMultipleRoutines = async (req, res) => {
  try {
    const { routineIds } = req.body;

    const result = await SavedRoutine.deleteMany({ _id: { $in: routineIds } });

    res.status(200).json({
      message: "Routines deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting routines", error: error.message });
  }
};

// Save scan history
export const saveScanHistory = async (req, res) => {
  try {
    const {
      userId,
      productName,
      productBrand,
      productCategory,
      safetyLevel,
      overallScore,
      riskScore,
      ingredients,
      productImages,
      analysisSource,
      recommendations,
      warnings,
    } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const scanHistory = new ScanHistory({
      userId,
      productName,
      productBrand: productBrand || "",
      productCategory: productCategory || "",
      safetyLevel,
      overallScore,
      riskScore,
      ingredients: ingredients || [],
      productImages: productImages || { front: "", back: "" },
      analysisSource: analysisSource || "mock",
      recommendations: recommendations || [],
      warnings: warnings || [],
    });

    await scanHistory.save();
    res.status(201).json({
      message: "Scan history saved successfully",
      data: scanHistory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving scan history",
      error: error.message,
    });
  }
};

// Get user's scan history
export const getScanHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const scanHistory = await ScanHistory.find({ userId })
      .sort({ scanDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ScanHistory.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: scanHistory,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving scan history",
      error: error.message,
    });
  }
};

// Get scan history statistics
export const getScanHistoryStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await ScanHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          safeScans: {
            $sum: { $cond: [{ $eq: ["$safetyLevel", "safe"] }, 1, 0] },
          },
          moderateScans: {
            $sum: { $cond: [{ $eq: ["$safetyLevel", "moderate"] }, 1, 0] },
          },
          cautionScans: {
            $sum: { $cond: [{ $eq: ["$safetyLevel", "caution"] }, 1, 0] },
          },
          avgOverallScore: { $avg: "$overallScore" },
          avgRiskScore: { $avg: "$riskScore" },
        },
      },
    ]);

    const result = stats[0] || {
      totalScans: 0,
      safeScans: 0,
      moderateScans: 0,
      cautionScans: 0,
      avgOverallScore: 0,
      avgRiskScore: 0,
    };

    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving scan statistics",
      error: error.message,
    });
  }
};

// Delete scan history item
export const deleteScanHistory = async (req, res) => {
  try {
    const { userId, scanId } = req.params;

    const deletedScan = await ScanHistory.findOneAndDelete({
      _id: scanId,
      userId,
    });

    if (!deletedScan) {
      return res.status(404).json({
        message: "Scan history not found or not authorized",
      });
    }

    res.status(200).json({
      message: "Scan history deleted successfully",
      data: deletedScan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting scan history",
      error: error.message,
    });
  }
};

// Delete multiple scan history items
export const deleteMultipleScanHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { scanIds } = req.body;

    if (!scanIds || !Array.isArray(scanIds)) {
      return res.status(400).json({
        message: "scanIds array is required",
      });
    }

    const result = await ScanHistory.deleteMany({
      _id: { $in: scanIds },
      userId,
    });

    res.status(200).json({
      message: `${result.deletedCount} scan history items deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting scan history",
      error: error.message,
    });
  }
};
