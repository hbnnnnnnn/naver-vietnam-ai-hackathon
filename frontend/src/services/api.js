/**
 * API Service for backend communication
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5731/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (multipart)
    if (config.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Product Analysis APIs
  async analyzeProduct(frontImage, backImage, options = {}) {
    const formData = new FormData();

    if (frontImage) {
      // Convert base64 to File if needed
      if (typeof frontImage === "string" && frontImage.startsWith("data:")) {
        const file = this.dataURLtoFile(frontImage, "front-image.jpg");
        formData.append("frontImage", file);
      } else {
        formData.append("frontImage", frontImage);
      }
    }

    if (backImage) {
      if (typeof backImage === "string" && backImage.startsWith("data:")) {
        const file = this.dataURLtoFile(backImage, "back-image.jpg");
        formData.append("backImage", file);
      } else {
        formData.append("backImage", backImage);
      }
    }

    // Get user skin info from localStorage
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );

      const userSkinTypes = [];

      // Add skin type (e.g., "combination")
      if (userProfile.skinType) {
        userSkinTypes.push(userProfile.skinType);
      }

      // Add skin conditions (e.g., ["acne", "oiliness"])
      if (Array.isArray(userProfile.primaryStatus)) {
        userSkinTypes.push(...userProfile.primaryStatus);
      }

      // Send combined skin info to backend as individual form fields
      if (userSkinTypes.length > 0) {
        userSkinTypes.forEach((skinType) => {
          formData.append("userSkin", skinType);
        });
      }
    } catch (error) {
      console.warn("Failed to load user skin info from localStorage:", error);
    }

    return this.request("/ingredient/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Product APIs
   */
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/products?${queryParams}` : "/products";
    return this.request(endpoint);
  }

  async getProductById(productId) {
    return this.request(`/products/${productId}`);
  }

  async getProductsByUVIndex(uvIndex) {
    return this.request(`/products/uv?uvIndex=${uvIndex}`);
  }

  async getProductsBySkinType(skinType) {
    return this.request(`/products/skin-type?skinType=${skinType}`);
  }

  /**
   * User APIs
   */
  async createOrUpdateUser(userData) {
    return this.request("/users/profile", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUserByUsername(username) {
    return this.request(`/users/username/${encodeURIComponent(username)}`);
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  /**
   * Routine Management APIs
   */
  async saveRoutine(routineData) {
    return this.request("/users/routines", {
      method: "POST",
      body: JSON.stringify(routineData),
    });
  }

  async getSavedRoutines(userId) {
    return this.request(`/users/${userId}/routines`);
  }

  async deleteSavedRoutine(routineId) {
    return this.request(`/users/routines/${routineId}`, {
      method: "DELETE",
    });
  }

  async deleteMultipleRoutines(routineIds) {
    return this.request("/users/routines", {
      method: "DELETE",
      body: JSON.stringify({ routineIds }),
    });
  }

  /**
   * Routine APIs
   */
  async getRoutines(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/routines?${queryParams}` : "/routines";
    return this.request(endpoint);
  }

  /**
   * Weather APIs
   */
  async getWeatherRecommendations(location) {
    return this.request(`/weather?location=${encodeURIComponent(location)}`);
  }

  /**
   * Utility methods
   */
  dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Transform backend response to frontend format
   */
  transformAnalysisResponse(backendResponse) {
    if (!backendResponse?.data) {
      throw new Error("Invalid response format from backend");
    }

    const { product, ingredients, risk, suitable } = backendResponse.data;

    // Transform to match frontend expectations
    const transformed = {
      product: {
        name: product?.name || product?.product_name || "Unknown Product",
        brand: product?.brand || "Unknown Brand",
        image:
          product?.image ||
          "https://images.unsplash.com/photo-1669200141274-38ae8632a86a",
        category: product?.category || "Skincare Product",
        benefits: product?.benefits || [
          "Skincare benefits will be analyzed",
          "Product features to be determined",
        ],
        suitable: suitable, // Move suitable into product object
      },
      risk: {
        categories: risk || {
          "no-risk": [],
          "low-risk": [],
          "moderate-risk": [],
          "high-risk": [],
        },
      },
      ingredients: this.transformIngredients(ingredients) || [],
    };

    console.log("🔍 DEBUG Transform - final transformed:", transformed);
    return transformed;
  }

  transformIngredients(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return [];

    return ingredients.map((ing) => ({
      name: ing.name,
      description: ing.description || "Ingredient description not available",
      benefits: ing.benefits || ["Benefits to be analyzed"],
      good_for: ing.good_for || [],
      risk_level: ing.risk_level || "Unknown",
      reason: ing.reason || "No safety information available",
    }));
  }

  /**
   * Chatbot APIs
   */
  async sendChatMessage(userId, message) {
    return this.request("/chatbot", {
      method: "POST",
      body: JSON.stringify({ userId, message }),
    });
  }

  async sendWelcomeMessage(userId = "guest") {
    return this.request("/chatbot/open", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async clickChatButton(userId, postback, postbackFull) {
    return this.request("/chatbot/click", {
      method: "POST",
      body: JSON.stringify({ userId, postback, postbackFull }),
    });
  }

  /**
   * Scan History APIs
   */
  async saveScanHistory(scanData) {
    return this.request("/users/scan-history", {
      method: "POST",
      body: JSON.stringify(scanData),
    });
  }

  async getScanHistory(userId, page = 1, limit = 50) {
    return this.request(
      `/users/${userId}/scan-history?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  }

  async getScanHistoryStats(userId) {
    return this.request(`/users/${userId}/scan-history/stats`, {
      method: "GET",
    });
  }

  async deleteScanHistory(userId, scanId) {
    return this.request(`/users/${userId}/scan-history/${scanId}`, {
      method: "DELETE",
    });
  }

  async deleteMultipleScanHistory(userId, scanIds) {
    return this.request(`/users/${userId}/scan-history`, {
      method: "DELETE",
      body: JSON.stringify({ scanIds }),
    });
  }

  /**
   * Transform analysis results to scan history format
   */
  transformAnalysisToScanHistory(analysisResults, uploadedImages, userId) {
    if (!analysisResults || !userId) {
      throw new Error("Analysis results and userId are required");
    }

    const product = analysisResults.product || {};
    const assessment = analysisResults.assessment || {};
    const ingredients = analysisResults.ingredients || [];

    return {
      userId,
      productName: product.name || "Unknown Product",
      productBrand: product.brand || "",
      productCategory: product.category || "",
      safetyLevel: assessment.safetyLevel || "moderate",
      overallScore: assessment.overallScore || 0,
      riskScore: assessment.riskScore || 0,
      ingredients: ingredients.map((ing) => ({
        name: ing.name || "",
        riskLevel: ing.riskLevel || "low",
        purpose: ing.purpose || "",
        concerns: ing.concerns || [],
      })),
      productImages: {
        front: uploadedImages?.front || "",
        back: uploadedImages?.back || "",
      },
      analysisSource: analysisResults.source || "mock",
      recommendations: assessment.recommendations || [],
      warnings: assessment.warnings || [],
    };
  }
}

export default new ApiService();
