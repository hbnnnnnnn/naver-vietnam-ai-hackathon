import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import ImageUploadZone from "./components/ImageUploadZone";
import OverviewCard from "./components/OverviewCard";
import RiskAssessmentCard from "./components/RiskAssessmentCard";
import IngredientsCard from "./components/IngredientsCard";
import AnalysisProgress from "./components/AnalysisProgress";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ApiService from "../../services/api";
import config from "../../config";

const ProductAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState({
    front: null,
    back: null,
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    front: null,
    back: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("upload");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [useRealAPI, setUseRealAPI] = useState(config.features.useRealAPI);

  // Transform scan history data to match expected analysis structure
  const transformScanHistoryData = (scanData) => {
    if (!scanData) return null;

    // Check if this is the real API response format (has data.product, data.risk, etc.)
    if (scanData.data) {
      return {
        product: {
          ...scanData.data.product,
          suitable: scanData.data.suitable || 75, // Move suitable to product level
        },
        risk: {
          categories: scanData.data.risk || {}, // Backend already has risk levels as keys
        },
        ingredients: (scanData.data.ingredients || []).map((ing) => ({
          name: ing.name,
          riskLevel: ing.risk_level,
          benefits: ing.benefits || [ing.description],
          concentration: "N/A",
          reason: ing.reason || "No specific concerns",
        })),
      };
    } // Check if this is already the frontend format (has product.suitable, risk.categories)
    if (scanData.product && scanData.risk && scanData.risk.categories) {
      return scanData;
    }

    // Handle database scan history format
    return {
      product: {
        name: scanData.productName || "Unknown Product",
        brand: scanData.productBrand || "Unknown Brand",
        category: scanData.productCategory || "Product",
        suitable: scanData.overallScore || 75,
        benefits: scanData.recommendations || [],
      },
      risk: {
        categories: {
          // Group ingredients by risk level
          "no-risk": (scanData.ingredients || []).filter(
            (ing) => ing.riskLevel === "no-risk"
          ),
          "low-risk": (scanData.ingredients || []).filter(
            (ing) => ing.riskLevel === "low-risk"
          ),
          "moderate-risk": (scanData.ingredients || []).filter(
            (ing) => ing.riskLevel === "moderate-risk"
          ),
          "high-risk": (scanData.ingredients || []).filter(
            (ing) => ing.riskLevel === "high-risk"
          ),
        },
      },
      ingredients: (scanData.ingredients || []).map((ing) => ({
        name: ing.name,
        riskLevel: ing.riskLevel,
        benefits: [ing.purpose],
        concentration: "N/A",
        reason: ing.concerns?.[0] || "No specific concerns",
      })),
    };
  };

  // Load analysis results from navigation state (from scan history)
  useEffect(() => {
    if (location.state?.analysisResults && location.state?.showResults) {
      // Check if this is raw backend response (has status/data) or already transformed
      let transformedData;
      if (location.state.analysisResults.data) {
        // This is raw backend response, transform it
        transformedData = ApiService.transformAnalysisResponse(
          location.state.analysisResults
        );
      } else if (
        location.state.analysisResults.product &&
        location.state.analysisResults.risk
      ) {
        // Already transformed, use as-is
        transformedData = location.state.analysisResults;
      } else {
        // Database scan history format, need custom transform
        transformedData = transformScanHistoryData(
          location.state.analysisResults
        );
      }
      setAnalysisResults(transformedData);
      setShowResults(true);

      // If coming from history, use the real uploaded images
      if (location.state.fromHistory && location.state.uploadedImages) {
        setUploadedImages(location.state.uploadedImages);
      }
    } else if (location.state?.skipUpload) {
      // Force skip upload even if no analysis results
      // Provide fallback data structure if no analysis results
      if (!location.state?.analysisResults) {
        setAnalysisResults({
          product: {
            name: "Product Analysis",
            brand: "Unknown Brand",
            category: "Analysis Result",
          },
          risk: {
            categories: {},
          },
          ingredients: [],
        });
      }
      setShowResults(true);
    }
  }, [location.state]);

  // Mock analysis data
  const mockAnalysisData = {
    product: {
      name: "Advanced Brightening Vitamin C Serum",
      brand: "GlowSkin Pro",
      image: "https://images.unsplash.com/photo-1669200141274-38ae8632a86a",
      category: "Brightening Serum",
      benefits: [
        "Natural skin brightening",
        "Powerful antioxidant protection",
        "Effective dark spot reduction",
        "Stimulates collagen production",
        "Improves skin elasticity",
        "Environmental protection",
      ],
    },
    risk: {
      categories: {
        "no-risk": [
          {
            name: "Vitamin C (L-Ascorbic Acid)",
            reason: "Safe ingredient, FDA approved for cosmetic use",
          },
          {
            name: "Hyaluronic Acid",
            reason: "Natural moisturizer, non-irritating",
          },
          {
            name: "Glycerin",
            reason: "Safe skin softener, suitable for all skin types",
          },
        ],
        "low-risk": [
          {
            name: "Phenoxyethanol",
            reason:
              "Preservative that may cause mild irritation in sensitive skin",
          },
          {
            name: "Fragrance",
            reason: "May cause allergic reactions in some individuals",
          },
        ],
        "moderate-risk": [
          {
            name: "Alpha Hydroxy Acids (AHA)",
            reason: "May increase sun sensitivity, sunscreen required",
          },
        ],
      },
    },
    ingredients: [
      {
        name: "Vitamin C (L-Ascorbic Acid)",
        description:
          "A potent antioxidant that brightens skin and protects against free radical damage.",
        benefits: [
          "Brightens skin tone",
          "Reduces dark spots",
          "Provides antioxidant protection",
          "Supports collagen synthesis",
        ],
        good_for: ["dry", "combination", "oily"],
        risk_level: "moderate-risk",
        reason:
          "Can cause irritation at high concentrations or in sensitive skin; stability depends on formulation.",
      },
      {
        name: "Hyaluronic Acid",
        description:
          "A powerful humectant that attracts and retains moisture in the skin.",
        benefits: [
          "Deep hydration",
          "Plumps fine lines",
          "Improves skin elasticity",
          "Supports skin barrier",
        ],
        good_for: ["dry", "combination", "oily", "sensitive"],
        risk_level: "low-risk",
        reason: "Widely considered safe and non-irritating for all skin types.",
      },
      {
        name: "Niacinamide (Vitamin B3)",
        description:
          "A versatile ingredient that strengthens the skin barrier and improves uneven skin tone.",
        benefits: [
          "Regulates oil production",
          "Reduces redness",
          "Improves uneven skin tone",
          "Strengthens skin barrier",
          "Minimizes pore appearance",
        ],
        good_for: ["dry", "combination", "oily", "sensitive"],
        risk_level: "low-risk",
        reason:
          "Generally well tolerated; suitable for most skin types at standard concentrations.",
      },
      {
        name: "Alpha Hydroxy Acids (AHA)",
        description:
          "A group of water-soluble acids that exfoliate the skin surface to improve texture and radiance.",
        benefits: [
          "Exfoliates dead skin cells",
          "Improves skin texture",
          "Brightens skin",
          "Enhances product absorption",
        ],
        good_for: ["dry", "dull", "uneven_texture"],
        risk_level: "moderate-risk",
        reason:
          "May cause irritation or sensitivity, especially in higher concentrations or sensitive skin.",
      },
      {
        name: "Phenoxyethanol",
        description:
          "A broad-spectrum preservative used to protect products from bacteria and mold.",
        benefits: [
          "Prevents microbial growth",
          "Maintains product safety",
          "Extends shelf life",
        ],
        good_for: ["all"],
        risk_level: "moderate-risk",
        reason:
          "Safe at <1% concentration; may cause irritation in very sensitive individuals.",
      },
      {
        name: "Glycerin",
        description:
          "A classic humectant that draws moisture into the skin and keeps it hydrated.",
        benefits: [
          "Hydrates skin",
          "Softens and smooths",
          "Supports skin barrier",
          "Non-comedogenic",
        ],
        good_for: ["dry", "combination", "oily", "sensitive"],
        risk_level: "low-risk",
        reason:
          "One of the safest and most widely tolerated skincare ingredients.",
      },
    ],
  };

  const handleImageUpload = (type, imageData, file) => {
    setUploadedImages((prev) => ({
      ...prev,
      [type]: imageData,
    }));

    // Store file object for API upload
    setUploadedFiles((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  // Real API analysis
  const analyzeProductWithAPI = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("upload");
    setError(null);

    let progressInterval;

    try {
      // Progress simulation while API call happens
      progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      // Update progress steps
      setCurrentStep("ocr");
      setAnalysisProgress(30);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("analysis");
      setAnalysisProgress(60);

      // Call real API
      const response = await ApiService.analyzeProduct(
        uploadedFiles.front,
        uploadedFiles.back
      );

      clearInterval(progressInterval);

      // Check if backend returned success field
      if (response.success === false) {
        // Backend failed to process the request
        throw new Error(
          response.message ||
            response.error ||
            "Analysis failed. Please try again with clearer images."
        );
      }

      setCurrentStep("risk");
      setAnalysisProgress(90);

      // Transform backend response to frontend format
      const transformedResults = ApiService.transformAnalysisResponse(response);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentStep("complete");
      setAnalysisProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsAnalyzing(false);
      setAnalysisResults(transformedResults);
      setShowResults(true);

      // Save scan result to history - Follow routine pattern
      try {
        const userProfile = JSON.parse(
          localStorage.getItem("userProfile") || "{}"
        );
        const username = userProfile?.username || userProfile?.name;

        if (!username) {
          console.warn("No username found, skipping scan history save");
          return;
        }

        // Get userId from database like routine does
        let userId;
        try {
          const userResponse = await ApiService.getUserByUsername(username);
          userId = userResponse.user._id;
        } catch (error) {
          // User doesn't exist, create new user
          const userData = {
            username: username,
            name: userProfile?.name || username,
            skinType: userProfile?.skinType || "normal",
            concerns: userProfile?.skinStatus || userProfile?.concerns || [],
          };

          const createResponse = await ApiService.createOrUpdateUser(userData);
          userId = createResponse.user._id;
        }

        // Create scan data directly like routine does
        const scanData = {
          userId: userId,
          productName: transformedResults.product?.name || "Unknown Product",
          productBrand: transformedResults.product?.brand || "",
          productCategory: transformedResults.product?.category || "",
          safetyLevel: "safe", // Calculate from risk
          overallScore: transformedResults.product?.suitable || 75,
          riskScore: 25, // Calculate from ingredients
          ingredients:
            transformedResults.ingredients?.map((ing) => ({
              name: ing.name || "",
              riskLevel: (ing.risk_level || "low-risk").toLowerCase(), // Ensure lowercase
              purpose: ing.description || "",
              concerns: ing.reason ? [ing.reason] : [],
            })) || [],
          productImages: {
            front: uploadedImages?.front || "",
            back: uploadedImages?.back || "",
          },
          analysisSource: "api", // Use correct enum value
          recommendations: transformedResults.product?.benefits || [],
          warnings: [],
          fullAnalysis: response, // Store raw backend response, not transformed version
        };

        await ApiService.saveScanHistory(scanData);
      } catch (error) {
        console.error("Failed to save scan result:", error);
      }
    } catch (error) {
      console.error("API Analysis failed:", error);

      // Clear progress interval if it's still running
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      setError(error.message || "Analysis failed. Please try again.");
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentStep("upload");

      // Don't fallback to mock data anymore - let user retry with real API
    }
  };

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("upload");

    const steps = [
      { step: "upload", duration: 1000, progress: 20 },
      { step: "ocr", duration: 1500, progress: 40 },
      { step: "analysis", duration: 2000, progress: 70 },
      { step: "risk", duration: 1500, progress: 90 },
      { step: "complete", duration: 500, progress: 100 },
    ];

    for (const { step, duration, progress } of steps) {
      setCurrentStep(step);

      // Animate progress
      const startProgress = analysisProgress;
      const progressDiff = progress - startProgress;
      const stepDuration = duration / 10;

      for (let i = 0; i <= 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setAnalysisProgress(startProgress + (progressDiff * i) / 10);
      }
    }

    setIsAnalyzing(false);
    setAnalysisResults(mockAnalysisData);
    setShowResults(true);

    // Save scan result to history - Follow routine pattern
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const username = userProfile?.username || userProfile?.name;

      if (!username) {
        console.warn("No username found, skipping mock scan history save");
        return;
      }

      // Get userId from database like routine does
      let userId;
      try {
        const userResponse = await ApiService.getUserByUsername(username);
        userId = userResponse.user._id;
      } catch (error) {
        // User doesn't exist, create new user
        const userData = {
          username: username,
          name: userProfile?.name || username,
          skinType: userProfile?.skinType || "normal",
          concerns: userProfile?.skinStatus || userProfile?.concerns || [],
        };

        const createResponse = await ApiService.createOrUpdateUser(userData);
        userId = createResponse.user._id;
      }

      // Create scan data directly like routine does
      const scanData = {
        userId: userId,
        productName: mockAnalysisData.product?.name || "Unknown Product",
        productBrand: mockAnalysisData.product?.brand || "",
        productCategory: mockAnalysisData.product?.category || "",
        safetyLevel: "safe", // Calculate from risk
        overallScore: 85, // Mock score
        riskScore: 15, // Mock risk score
        ingredients:
          mockAnalysisData.ingredients?.map((ing) => ({
            name: ing.name || "",
            riskLevel: ing.risk_level || "low-risk",
            purpose: ing.description || "",
            concerns: ing.reason ? [ing.reason] : [],
          })) || [],
        productImages: {
          front: uploadedImages?.front || "",
          back: uploadedImages?.back || "",
        },
        analysisSource: "mock",
        recommendations: mockAnalysisData.product?.benefits || [],
        warnings: [],
        fullAnalysis: {
          // Create mock response in same format as real backend
          data: {
            product: mockAnalysisData.product,
            suitable: 85,
            risk: mockAnalysisData.risk?.categories || {},
            ingredients: mockAnalysisData.ingredients || [],
          },
        }, // Store in backend response format
      };

      await ApiService.saveScanHistory(scanData);
    } catch (error) {
      console.error("Failed to save mock scan result:", error);
    }
  };

  const handleAnalyzeProduct = () => {
    if (uploadedImages?.front || uploadedImages?.back) {
      // Clear any previous error
      setError(null);

      if (useRealAPI && (uploadedFiles?.front || uploadedFiles?.back)) {
        analyzeProductWithAPI();
      } else {
        simulateAnalysis();
      }
    }
  };

  const handleReset = () => {
    setUploadedImages({ front: null, back: null });
    setUploadedFiles({ front: null, back: null });
    setAnalysisResults(null);
    setShowResults(false);
    setAnalysisProgress(0);
    setError(null);
  };

  const canAnalyze = uploadedImages?.front || uploadedImages?.back;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glass">
              <Icon name="Camera" size={24} color="white" />
            </div>
            <h1 className="text-3xl font-heading font-bold gradient-text">
              Product Analysis
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-caption max-w-2xl mx-auto">
            Upload a skincare product image to receive a detailed analysis of
            its ingredients, benefits, and risk assessment from a professional
            AI
          </p>
        </div>

        {!showResults ? (
          <>
            {/* Image Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ImageUploadZone
                type="front"
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImages?.front}
              />

              <ImageUploadZone
                type="back"
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImages?.back}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Button
                variant="default"
                size="lg"
                onClick={handleAnalyzeProduct}
                disabled={!canAnalyze}
                iconName="Sparkles"
                iconPosition="left"
                className="w-full sm:w-auto rounded-3xl"
              >
                Analyze Product
              </Button>

              {canAnalyze && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  iconName="RotateCcw"
                  iconPosition="left"
                  className="w-full sm:w-auto rounded-3xl border border-foreground hover:bg-[rgba(255,144,187,0.2)]"
                >
                  Upload Another Image
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex justify-center mb-8">
                <div className="glass-card p-4 rounded-xl border border-red-200 bg-red-50 max-w-md">
                  <div className="flex items-start space-x-3">
                    <Icon
                      name="AlertCircle"
                      size={20}
                      className="text-red-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">
                        Analysis Failed
                      </h4>
                      <p className="text-xs text-red-600">{error}</p>
                      <p className="text-xs text-red-500/70 mt-2">
                        Please try again with clearer product images or check
                        your internet connection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Toggle & Error Display */}

            {/* <div className="flex flex-col items-center space-y-4 mb-8">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground font-caption">
                    Analysis Mode:
                  </span>
                  <button
                    onClick={() => setUseRealAPI(!useRealAPI)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${useRealAPI
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {useRealAPI ? "Real API" : "Demo Mode"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {useRealAPI
                      ? "Uses actual AI analysis"
                      : "Shows sample data"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="glass-card p-4 rounded-xl border border-error/20 bg-error/5 max-w-md">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-error" />
                    <span className="text-sm text-error font-medium">
                      Analysis Failed
                    </span>
                  </div>
                  <p className="text-xs text-error/80 mt-1">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing demo data instead.
                  </p>
                </div>
              )}
            </div> */}

            {/* Instructions */}
            <div className="glass-card rounded-xl p-6 max-w-5xl mx-auto">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                How to use
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Take a clear photo
                      </h4>
                      <p className="text-sm text-muted-foreground font-caption">
                        Ensure the photo is well-lit and the product label is
                        clear
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Upload both sides
                      </h4>
                      <p className="text-sm text-muted-foreground font-caption">
                        Front side for basic information, back side for
                        ingredient list
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Get results
                      </h4>
                      <p className="text-sm text-muted-foreground font-caption">
                        AI will analyze and provide a detailed assessment within
                        seconds
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        View suggestions
                      </h4>
                      <p className="text-sm text-muted-foreground font-caption">
                        See usage tips and a personalized skincare routine
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Analysis Results */}
            <div className="space-y-8">
              {/* Results Header */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Icon name="CheckCircle" size={32} className="text-success" />
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    Analysis Complete
                  </h2>
                </div>
                <p className="text-muted-foreground font-caption">
                  Here are the detailed analysis results for your product
                </p>
              </div>

              {/* Analysis Cards */}
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-8">
                  <OverviewCard
                    productData={analysisResults?.product}
                    uploadedImages={uploadedImages}
                  />
                  <RiskAssessmentCard riskData={analysisResults?.risk} />
                </div>
                <div>
                  <IngredientsCard
                    ingredientsData={analysisResults?.ingredients}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {location.state?.fromHistory && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/profile")}
                    iconName="ArrowLeft"
                    iconPosition="left"
                    className="w-full sm:w-auto rounded-3xl border border-foreground hover:bg-[rgba(255,144,187,0.2)]"
                  >
                    Back to Profile
                  </Button>
                )}

                <Button
                  variant="default"
                  size="lg"
                  onClick={() => (window.location.href = "/routine")}
                  iconName="Calendar"
                  iconPosition="left"
                  className="w-full sm:w-auto rounded-3xl"
                >
                  View Routine Suggestions
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = "/chatbot")}
                  iconName="MessageCircle"
                  iconPosition="left"
                  className="w-full sm:w-auto rounded-3xl border border-foreground hover:bg-[rgba(255,144,187,0.2)]"
                >
                  Ask for More Advice
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleReset}
                  iconName="RotateCcw"
                  iconPosition="left"
                  className="w-full sm:w-auto rounded-3xl border border-foreground hover:bg-[rgba(255,144,187,0.2)]"
                >
                  Analyze Another Product
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
      {/* Analysis Progress Modal */}
      <AnalysisProgress
        isAnalyzing={isAnalyzing}
        progress={analysisProgress}
        currentStep={currentStep}
      />
    </div>
  );
};

export default ProductAnalysis;
