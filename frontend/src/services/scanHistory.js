/**
 * Scan History Service
 * Manages product scan history using localStorage
 */

const SCAN_HISTORY_KEY = "skincare_scan_history";
const USER_PROFILE_KEY = "skincare_user_profile";

export class ScanHistoryService {
  /**
   * Save a product analysis result to scan history
   * @param {Object} analysisResult - The analysis result from product-analysis
   * @param {Object} productImages - The uploaded product images
   */
  static saveScanResult(analysisResult, productImages) {
    try {
      // Transform analysis result to scan history format
      const scanEntry = this.transformAnalysisToScanHistory(
        analysisResult,
        productImages
      ); // Get existing scan history
      const existingHistory = this.getScanHistory();

      // Add new entry at the beginning (most recent first)
      const updatedHistory = [scanEntry, ...existingHistory];

      // Save updated history
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));

      // Update user stats
      this.updateUserStats(updatedHistory);

      console.log("✅ Scan result saved to history:", scanEntry);
      return scanEntry;
    } catch (error) {
      console.error("❌ Failed to save scan result:", error);
      return null;
    }
  }

  /**
   * Get all scan history from localStorage
   * @returns {Array} Array of scan history entries
   */
  static getScanHistory() {
    try {
      const history = localStorage.getItem(SCAN_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("❌ Failed to get scan history:", error);
      return [];
    }
  }

  /**
   * Transform analysis result to scan history format
   * @param {Object} analysisResult - Analysis result from API
   * @param {Object} productImages - Uploaded product images
   * @returns {Object} Formatted scan history entry
   */
  static transformAnalysisToScanHistory(analysisResult, productImages) {
    console.log("🔄 transformAnalysisToScanHistory:");
    console.log("- productImages received:", productImages);

    const now = new Date();
    const scanDate = now.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    const scanTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Determine safety level based on risk categories
    const riskLevel = this.calculateSafetyLevel(analysisResult.risk);

    // Count risk ingredients
    const riskIngredientCount = analysisResult.ingredients
      ? analysisResult.ingredients.filter(
          (ing) => ing.safetyInfo && ing.safetyInfo.length > 0
        ).length
      : 0;

    return {
      id: Date.now(), // Simple ID using timestamp
      productName: analysisResult.product?.name || "Unknown Product",
      brandName: analysisResult.product?.brand || "Unknown Brand",
      productImage:
        productImages?.front ||
        productImages?.back ||
        "https://via.placeholder.com/150",
      productImageAlt: `${
        analysisResult.product?.name || "Product"
      } scanned image`,
      scanDate,
      scanTime,
      safetyLevel: riskLevel,
      ingredientCount: analysisResult.ingredients?.length || 0,
      riskIngredients: riskIngredientCount,
      // Store full analysis for detailed view later
      fullAnalysis: analysisResult,
      // Store uploaded images separately for proper display
      uploadedImages: productImages,
    };

    console.log(
      "✅ Created scan entry with productImage:",
      (productImages?.front || productImages?.back || "placeholder").substring(
        0,
        50
      ) + "..."
    );
    console.log("✅ Full scan entry:", scanEntry);

    return scanEntry;
  }

  /**
   * Calculate safety level based on risk categories
   * @param {Object} risk - Risk analysis from backend
   * @returns {string} Safety level: 'safe', 'moderate', 'caution'
   */
  static calculateSafetyLevel(risk) {
    if (!risk) return "safe";

    const categories = risk.categories || {};
    const highRiskCount = Object.values(categories).filter(
      (level) => level === "high"
    ).length;
    const moderateRiskCount = Object.values(categories).filter(
      (level) => level === "moderate"
    ).length;

    if (highRiskCount > 0) return "caution";
    if (moderateRiskCount > 1) return "moderate";
    return "safe";
  }

  /**
   * Update user profile stats based on scan history
   * @param {Array} scanHistory - Current scan history
   */
  static updateUserStats(scanHistory) {
    try {
      const userProfile = JSON.parse(
        localStorage.getItem(USER_PROFILE_KEY) || "{}"
      );

      // Calculate stats from scan history
      const totalScans = scanHistory.length;
      const safeScans = scanHistory.filter(
        (scan) => scan.safetyLevel === "safe"
      ).length;
      const moderateScans = scanHistory.filter(
        (scan) => scan.safetyLevel === "moderate"
      ).length;
      const cautionScans = scanHistory.filter(
        (scan) => scan.safetyLevel === "caution"
      ).length;

      // Update stats
      const updatedStats = {
        ...userProfile.stats,
        totalScans,
        safeScans,
        moderateScans,
        cautionScans,
        // Calculate active days (days with scans)
        activeDays: this.calculateActiveDays(scanHistory),
      };

      userProfile.stats = updatedStats;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));

      console.log("📊 User stats updated:", updatedStats);
    } catch (error) {
      console.error("❌ Failed to update user stats:", error);
    }
  }

  /**
   * Calculate number of active days (days with scans)
   * @param {Array} scanHistory - Scan history array
   * @returns {number} Number of unique days with scans
   */
  static calculateActiveDays(scanHistory) {
    const uniqueDates = new Set(scanHistory.map((scan) => scan.scanDate));
    return uniqueDates.size;
  }

  /**
   * Delete a scan from history
   * @param {number} scanId - ID of scan to delete
   * @returns {boolean} Success status
   */
  static deleteScan(scanId) {
    try {
      const history = this.getScanHistory();
      const updatedHistory = history.filter((scan) => scan.id !== scanId);

      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
      this.updateUserStats(updatedHistory);

      console.log("🗑️ Scan deleted:", scanId);
      return true;
    } catch (error) {
      console.error("❌ Failed to delete scan:", error);
      return false;
    }
  }

  /**
   * Delete multiple scans from history
   * @param {Array} scanIds - Array of scan IDs to delete
   * @returns {boolean} Success status
   */
  static deleteMultipleScans(scanIds) {
    try {
      const history = this.getScanHistory();
      const updatedHistory = history.filter(
        (scan) => !scanIds.includes(scan.id)
      );

      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
      this.updateUserStats(updatedHistory);

      console.log("🗑️ Multiple scans deleted:", scanIds);
      return true;
    } catch (error) {
      console.error("❌ Failed to delete multiple scans:", error);
      return false;
    }
  }

  /**
   * Clear all scan history
   * @returns {boolean} Success status
   */
  static clearAllHistory() {
    try {
      localStorage.removeItem(SCAN_HISTORY_KEY);
      this.updateUserStats([]);

      console.log("🧹 All scan history cleared");
      return true;
    } catch (error) {
      console.error("❌ Failed to clear scan history:", error);
      return false;
    }
  }

  /**
   * Get scan history with optional filtering and sorting
   * @param {Object} options - Filter and sort options
   * @returns {Array} Filtered and sorted scan history
   */
  static getFilteredScanHistory(options = {}) {
    try {
      let history = this.getScanHistory();

      // Filter by safety level
      if (options.safetyLevel && options.safetyLevel !== "all") {
        history = history.filter(
          (scan) => scan.safetyLevel === options.safetyLevel
        );
      }

      // Filter by date range
      if (options.dateFrom || options.dateTo) {
        history = history.filter((scan) => {
          const scanDate = new Date(
            scan.scanDate.split("/").reverse().join("-")
          );
          const fromDate = options.dateFrom
            ? new Date(options.dateFrom)
            : new Date("1970-01-01");
          const toDate = options.dateTo ? new Date(options.dateTo) : new Date();

          return scanDate >= fromDate && scanDate <= toDate;
        });
      }

      // Sort
      if (options.sortBy) {
        history.sort((a, b) => {
          switch (options.sortBy) {
            case "date":
              const dateA = new Date(a.scanDate.split("/").reverse().join("-"));
              const dateB = new Date(b.scanDate.split("/").reverse().join("-"));
              return options.sortOrder === "asc"
                ? dateA - dateB
                : dateB - dateA;

            case "name":
              return options.sortOrder === "asc"
                ? a.productName.localeCompare(b.productName)
                : b.productName.localeCompare(a.productName);

            case "safety":
              const safetyOrder = { safe: 3, moderate: 2, caution: 1 };
              const safetyA = safetyOrder[a.safetyLevel] || 0;
              const safetyB = safetyOrder[b.safetyLevel] || 0;
              return options.sortOrder === "asc"
                ? safetyA - safetyB
                : safetyB - safetyA;

            default:
              return 0;
          }
        });
      }

      return history;
    } catch (error) {
      console.error("❌ Failed to get filtered scan history:", error);
      return [];
    }
  }
}

export default ScanHistoryService;
