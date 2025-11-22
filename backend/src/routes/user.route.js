import express from "express";
import {
  createUser,
  getUser,
  deleteUser,
  createOrUpdateUser,
  getUserByUsername,
  saveRoutine,
  getSavedRoutines,
  deleteSavedRoutine,
  deleteMultipleRoutines,
  saveScanHistory,
  getScanHistory,
  getScanHistoryStats,
  deleteScanHistory,
  deleteMultipleScanHistory,
} from "../controllers/user.controller.js";

const router = express.Router();

// Specific routes FIRST (before generic /:id routes)
// New user management routes
router.post("/profile", createOrUpdateUser);
router.get("/username/:username", getUserByUsername);

// Routine management routes
router.post("/routines", saveRoutine);
router.delete("/routines/:routineId", deleteSavedRoutine);
router.delete("/routines", deleteMultipleRoutines);
router.get("/:userId/routines", getSavedRoutines);

// Scan history routes
router.post("/scan-history", saveScanHistory);
router.get("/:userId/scan-history", getScanHistory);
router.get("/:userId/scan-history/stats", getScanHistoryStats);
router.delete("/:userId/scan-history/:scanId", deleteScanHistory);
router.delete("/:userId/scan-history", deleteMultipleScanHistory);

// Generic CRUD routes LAST (after specific routes)
router.post("/", createUser);
router.get("/:id", getUser);
router.delete("/:id", deleteUser);

export default router;
