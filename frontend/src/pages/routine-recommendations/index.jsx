import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import FilterControls from "./components/FilterControls";
import RoutineCard from "./components/RoutineCard";
import ProductModal from "./components/ProductModal";
import RoutineComparison from "./components/RoutineComparison";
import Sunscreen from "./components/Sunscreen";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import AnalysisProgress from "./components/AnalysisProgress";
import { preloadRoutineImages } from "../../utils/imageCache";
import ApiService from "../../services/api";

const API_URL = "http://localhost:5731";

const RoutineRecommendations = () => {
  const navigate = useNavigate();
  const [routineType, setRoutineType] = useState("minimal");
  const [priceRange, setPriceRange] = useState("budget-friendly");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload");
  const [morningRoutine, setMorningRoutine] = useState(null);
  const [nightRoutine, setNightRoutine] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [uvIndex, setUvIndex] = useState(null);
  const [uvLevel, setUvLevel] = useState("");
  const [isLoadingUV, setIsLoadingUV] = useState(false);
  const [sunscreenProducts, setSunscreenProducts] = useState([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // State for viewing saved routine from profile
  const [isViewingFromProfile, setIsViewingFromProfile] = useState(false);
  const [savedRoutineData, setSavedRoutineData] = useState(null);

  // Fetch UV Index based on user location
  const fetchUVIndex = async () => {
    setIsLoadingUV(true);
    try {
      // Get user location
      if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          });

          const response = await fetch(`${API_URL}/api/weather?${params}`);

          if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
          }

          const data = await response.json();

          // Get current hour UV index
          const now = new Date();
          const currentHourIndex = now.getHours();
          const currentUV = data.hourly?.uv_index?.[currentHourIndex] || 0;

          setUvIndex(Math.round(currentUV));

          // Determine UV level
          if (currentUV <= 2) setUvLevel("Low");
          else if (currentUV <= 5) setUvLevel("Moderate");
          else if (currentUV <= 7) setUvLevel("High");
          else if (currentUV <= 10) setUvLevel("Very High");
          else setUvLevel("Extreme");

          setIsLoadingUV(false);

          // Fetch sunscreen products with UV index and skin type
          const userProfile = JSON.parse(
            localStorage.getItem("userProfile") || "{}"
          );
          const skinType = userProfile?.skinType?.toLowerCase() || "normal";
          fetchSunscreenProducts(Math.round(currentUV), skinType);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingUV(false);
        }
      );
    } catch (error) {
      console.error("Error fetching UV index:", error);
      setIsLoadingUV(false);
    }
  };

  // Fetch UV index when results are shown
  useEffect(() => {
    if (showResults) {
      fetchUVIndex();
    }
  }, [showResults]);

  // Check for saved routine data from profile on component mount
  useEffect(() => {
    const viewRoutineData = localStorage.getItem("viewRoutineData");
    if (viewRoutineData) {
      try {
        const routineData = JSON.parse(viewRoutineData);
        setSavedRoutineData(routineData);
        setIsViewingFromProfile(true);
        setShowResults(true);

        // Set routine type and price range from saved data
        setRoutineType(routineData.routineType || "minimal");
        setPriceRange(routineData.priceRange || "budget-friendly");

        // Set routines data
        if (routineData.morningRoutine) {
          setMorningRoutine(routineData.morningRoutine);
        }
        if (routineData.eveningRoutine) {
          setNightRoutine(routineData.eveningRoutine);
        }

        // Fetch UV index when viewing from profile
        fetchUVIndex();

        // Clear the data from localStorage after loading
        localStorage.removeItem("viewRoutineData");
      } catch (error) {
        console.error("Error parsing routine data:", error);
        localStorage.removeItem("viewRoutineData");
      }
    }
  }, []);

  const handleBackToProfile = () => {
    setIsViewingFromProfile(false);
    setSavedRoutineData(null);
    setShowResults(false);
    setMorningRoutine(null);
    setNightRoutine(null);
    navigate("/profile");
  };

  // Fetch sunscreen products from backend using UV index and skin type
  const fetchSunscreenProducts = async (uvIndex, skinType) => {
    try {
      const params = new URLSearchParams({
        uvIndex: uvIndex?.toString() || "0",
        skinType: skinType || "normal",
        priceRange: priceRange || "budget-friendly",
      });

      const response = await fetch(`${API_URL}/api/products/uv?${params}`);

      if (!response.ok) {
        throw new Error(`Products API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform products with rating and image (limit to top 3)
      const transformedProducts = data.slice(0, 5).map((product) => ({
        ...product,
        id: product._id,
        rating: product.rating || product.rank || 0,
        image:
          product.thumbnail_url ||
          "https://images.unsplash.com/photo-1616750819456-5cdee9b85d22",
        imageAlt: `${product.brand || "Unknown Brand"} - ${
          product.name || "Unknown Product"
        }`,
      }));

      setSunscreenProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching sunscreen products:", error);
    }
  };

  // Save both morning and evening routines
  const handleSaveAllRoutines = async () => {
    if (!routineName.trim()) {
      alert("Please enter a routine name");
      return;
    }

    setIsSaving(true);
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const username = userProfile?.username || userProfile?.name;
      const skinType = userProfile?.skinType?.toLowerCase() || "normal";

      if (!username) {
        console.error("No username found in userProfile");
        alert("Please log in to save routines. Username is missing.");
        return;
      }

      let userId;
      try {
        // Try to get user from database
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

      // Save complete routine to database
      const completeRoutineData = {
        userId,
        routineName,
        routineType,
        skinType,
        priceRange,
        uvIndex: uvIndex || null,
        location: "Ho Chi Minh City",
        morningRoutine: {
          steps: morningSteps || [],
        },
        eveningRoutine: {
          steps: nightSteps || [],
        },
      };

      await ApiService.saveRoutine(completeRoutineData);

      // Preload images for this routine in the background
      preloadRoutineImages(completeRoutineData);

      alert("Complete routine saved successfully!");
      setIsSaveModalOpen(false);
      setRoutineName("");
    } catch (error) {
      console.error("Error saving routines:", error);
      alert("Failed to save routines. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch routines from backend API
  const fetchRoutines = async () => {
    // Check authentication before fetching
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Get user's skin type from localStorage
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const skinType = userProfile?.skinType?.toLowerCase() || "normal";

      const params = new URLSearchParams({
        skinType: skinType,
        strategy: routineType,
        budgetRange: priceRange,
      });

      const response = await fetch(`${API_URL}/api/routines?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Separate morning and night routines
      const morningData = data.routines?.find((r) => r.name === "morning");
      const nightData = data.routines?.find((r) => r.name === "night");

      setMorningRoutine(morningData);
      setNightRoutine(nightData);
    } catch (error) {
      console.error("Error fetching routines:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  useEffect(() => {
    if (showResults) {
      fetchRoutines();
    }
  }, [routineType, priceRange, showResults]);

  // Mock routine data
  const routineData = {
    minimal: {
      morning: [
        {
          id: 1,
          category: "Gentle Cleanser",
          description: "Cleanses skin without drying",
          timing: "1-2 minutes",
          purpose: "Cleansing",
        },
        {
          id: 2,
          category: "Sunscreen",
          description: "Protects skin from UV rays",
          timing: "30 seconds",
          purpose: "Protection",
        },
        {
          id: 3,
          category: "Moisturizer",
          description: "Provides essential hydration",
          timing: "1 minute",
          purpose: "Moisturizing",
        },
      ],

      evening: [
        {
          id: 4,
          category: "Deep Cleanser",
          description: "Removes dirt and makeup",
          timing: "2 minutes",
          purpose: "Cleansing",
        },
        {
          id: 5,
          category: "Recovery Serum",
          description: "Nourishes skin overnight",
          timing: "30 seconds",
          purpose: "Recovery",
        },
        {
          id: 6,
          category: "Night Cream",
          description: "Deep hydration overnight",
          timing: "1 minute",
          purpose: "Nourishing",
        },
      ],
    },
    comprehensive: {
      morning: [
        {
          id: 1,
          category: "pH Balanced Cleanser",
          description: "Gently cleanses, balances pH",
          timing: "2 minutes",
          purpose: "Cleansing",
        },
        {
          id: 2,
          category: "Toner",
          description: "Prepares skin for next steps",
          timing: "30 seconds",
          purpose: "Balancing",
        },
        {
          id: 3,
          category: "Vitamin C Serum",
          description: "Antioxidant, brightens skin",
          timing: "1 minute",
          purpose: "Anti-aging",
        },
        {
          id: 4,
          category: "Eye Cream",
          description: "Cares for sensitive eye area",
          timing: "30 seconds",
          purpose: "Special care",
        },
        {
          id: 5,
          category: "Moisturizer",
          description: "Locks in moisture and nourishes",
          timing: "1 minute",
          purpose: "Moisturizing",
        },
        {
          id: 6,
          category: "Sunscreen SPF 50+",
          description: "Comprehensive UV protection",
          timing: "1 minute",
          purpose: "Protection",
        },
      ],

      evening: [
        {
          id: 7,
          category: "Cleansing Oil",
          description: "Removes makeup and sunscreen",
          timing: "2 minutes",
          purpose: "Cleansing",
        },
        {
          id: 8,
          category: "Deep Cleanser",
          description: "Deep cleans pores",
          timing: "2 minutes",
          purpose: "Cleansing",
        },
        {
          id: 9,
          category: "Exfoliator (2-3 times/week)",
          description: "Removes dead skin cells, smooths skin",
          timing: "1 minute",
          purpose: "Exfoliating",
        },
        {
          id: 10,
          category: "Recovery Toner",
          description: "Balances and prepares skin",
          timing: "30 seconds",
          purpose: "Balancing",
        },
        {
          id: 11,
          category: "Treatment Serum",
          description: "Retinol or niacinamide",
          timing: "1 minute",
          purpose: "Treatment",
        },
        {
          id: 12,
          category: "Night Eye Cream",
          description: "Repairs eye area overnight",
          timing: "30 seconds",
          purpose: "Special care",
        },
        {
          id: 13,
          category: "Night Cream",
          description: "Nourishes and deeply repairs",
          timing: "1 minute",
          purpose: "Nourishing",
        },
      ],
    },
  };

  // Mock products data
  const mockProducts = {
    "Gentle Cleanser": [
      {
        id: 1,
        name: "CeraVe Foaming Facial Cleanser",
        brand: "CeraVe",
        price: 320000,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1735286770188-de4c5131589a",
        imageAlt:
          "White bottle of CeraVe foaming facial cleanser with blue label on clean background",
        benefits: [
          "Does not dry out skin",
          "Contains ceramides",
          "Suitable for sensitive skin",
        ],
      },
      {
        id: 2,
        name: "La Roche-Posay Toleriane Caring Wash",
        brand: "La Roche-Posay",
        price: 450000,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1629198726018-604230bdb091",
        imageAlt:
          "Blue and white La Roche-Posay cleanser bottle with minimalist design",
        benefits: ["For sensitive skin", "Soap-free", "Soothes skin"],
      },
      {
        id: 3,
        name: "Neutrogena Ultra Gentle Daily Cleanser",
        brand: "Neutrogena",
        price: 280000,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1695561115616-b4b719f1a242",
        imageAlt:
          "Orange and white Neutrogena cleanser bottle with pump dispenser",
        benefits: ["Gently cleanses", "Non-irritating", "Affordable"],
      },
      {
        id: 4,
        name: "Eucerin DermatoCLEAN Mild Cleansing",
        brand: "Eucerin",
        price: 380000,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1689166972543-6ef3bfe2d827",
        imageAlt:
          "White Eucerin cleansing milk bottle with blue accents and professional packaging",
        benefits: [
          "Gentle cleanser",
          "Removes makeup",
          "Does not dry out skin",
        ],
      },
      {
        id: 5,
        name: "Bioderma Sensibio Gel Moussant",
        brand: "Bioderma",
        price: 420000,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1721280964728-11a67056d4d6",
        imageAlt:
          "Clear Bioderma gel cleanser bottle with pink and white labeling",
        benefits: ["For sensitive skin", "Light gel formula", "Paraben-free"],
      },
    ],

    Sunscreen: [
      {
        id: 6,
        name: "Biore UV Aqua Rich Watery Essence SPF50+",
        brand: "Biore",
        price: 250000,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1616750819456-5cdee9b85d22",
        imageAlt:
          "Blue Biore sunscreen tube with water droplet design and SPF50+ marking",
        benefits: ["Water-like texture", "Quick absorption", "Non-greasy"],
      },
      {
        id: 7,
        name: "La Roche-Posay Anthelios Ultra Light SPF60",
        brand: "La Roche-Posay",
        price: 580000,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1618332192990-ae0bc9061593",
        imageAlt:
          "White La Roche-Posay sunscreen tube with orange accents and SPF60 label",
        benefits: ["UVA/UVB protection", "Water-resistant", "Non-comedogenic"],
      },
      {
        id: 8,
        name: "Eucerin Sun Face Oil Control SPF60",
        brand: "Eucerin",
        price: 520000,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1618332192990-ae0bc9061593",
        imageAlt:
          "White and orange Eucerin sunscreen bottle with oil control formula labeling",
        benefits: ["Oil control", "Long-lasting", "Suitable for oily skin"],
      },
      {
        id: 9,
        name: "Neutrogena Ultra Sheer Dry-Touch SPF55",
        brand: "Neutrogena",
        price: 320000,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1654973552952-d0c98a3e3388",
        imageAlt:
          "Yellow and white Neutrogena sunscreen tube with dry-touch technology branding",
        benefits: [
          "Dry touch",
          "No white cast",
          "Water-resistant for 80 minutes",
        ],
      },
      {
        id: 10,
        name: "Avène Fluide Minéral Teinté SPF50+",
        brand: "Avène",
        price: 650000,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1671789407725-5098c410f79e",
        imageAlt:
          "White Avène tinted sunscreen tube with mineral formula and SPF50+ protection",
        benefits: ["Natural tint", "100% mineral", "For sensitive skin"],
      },
    ],
  };

  // Handle category click
  const handleCategoryClick = (step) => {
    setSelectedCategory(step);
    setIsModalOpen(true);
    setIsProductsLoading(true);

    // Use products from the step
    setTimeout(() => {
      const products = step?.products || [];
      setModalProducts(products);
      setIsProductsLoading(false);
    }, 500);
  };

  // Handle analysis start with progress
  const handleAnalysisStart = () => {
    // Check authentication first
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userProfile = localStorage.getItem("userProfile");

    if (!isAuthenticated || !userProfile) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setShowResults(false);
    setCurrentStep("upload");

    // Progress simulation with steps matching AnalysisProgress
    const progressSteps = [
      { progress: 15, delay: 300, step: "upload" },
      { progress: 35, delay: 700, step: "ocr" },
      { progress: 60, delay: 800, step: "analysis" },
      { progress: 85, delay: 600, step: "risk" },
      { progress: 100, delay: 500, step: "complete" },
    ];

    progressSteps
      .reduce((promise, stepData) => {
        return promise.then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              setAnalysisProgress(stepData.progress);
              setCurrentStep(stepData.step);
              resolve();
            }, stepData.delay);
          });
        });
      }, Promise.resolve())
      .then(() => {
        // Analysis complete
        setTimeout(() => {
          setIsAnalyzing(false);
          setShowResults(true);

          // Fetch routines after showing results
          fetchRoutines();

          // Auto scroll to results
          setTimeout(() => {
            const resultsSection = document.getElementById("results-section");
            if (resultsSection) {
              // Adjusted scroll behavior to account for header height
              const headerOffset = 80; // Adjust this value based on your header height
              const elementPosition =
                resultsSection.getBoundingClientRect().top;
              const offsetPosition =
                elementPosition + window.scrollY - headerOffset;

              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
              });
            }
          }, 100);
        }, 500);
      });
  };

  // Transform backend data to frontend format
  const transformRoutineSteps = (routine) => {
    if (!routine || !routine.steps) return [];

    return routine.steps.map((step, index) => {
      const products = step.products || [];
      const firstProduct = products[0];

      // Map step names to descriptions as fallback
      const descriptionMap = {
        Cleanse: "Cleanses skin without drying",
        "Double Cleanse": "Removes dirt and makeup",
        Treatment: "Addresses specific skin concerns",
        Treat: "Nourishes skin overnight",
        "Eye Care": "Cares for sensitive eye area",
        Moisturize: "Provides essential hydration",
        Sunscreen: "Protects skin from UV rays",
        "Night Mask": "Intensive overnight treatment",
      };

      // Map step names to timing
      const timingMap = {
        Cleanse: "1-2 minutes",
        "Double Cleanse": "2 minutes",
        Treatment: "30 seconds",
        Treat: "30 seconds",
        "Eye Care": "30 seconds",
        Moisturize: "1 minute",
        Sunscreen: "30 seconds",
        "Night Mask": "1-2 minutes",
      };

      const description =
        step.description || descriptionMap[step.name] || "Skincare treatment";
      const timing = timingMap[step.name] || "1-2 minutes";

      // Convert products and add rating, image
      const productsWithRating = products.map((product) => {
        return {
          ...product,
          rating: product.rank || 0,
          image:
            product.thumbnail_url ||
            "https://images.unsplash.com/photo-1735286770188-de4c5131589a",
          imageAlt: `${product.brand || "Unknown Brand"} - ${
            product.name || "Unknown Product"
          }`,
        };
      });

      return {
        id: index + 1,
        category: step.name || "Step",
        description: description,
        timing: timing,
        purpose: step.name || "Treatment",
        products: productsWithRating,
        rank: firstProduct?.rank || 0,
      };
    });
  };

  const morningSteps = transformRoutineSteps(morningRoutine);
  const nightSteps = transformRoutineSteps(nightRoutine);

  return (
    <>
      <Helmet>
        <title>Skincare Routine Recommendations - SkinCare Analyzer</title>
        <meta
          name="description"
          content="Get personalized skincare routine recommendations based on your skin type and budget. From minimal to comprehensive routines."
        />
        <meta
          name="keywords"
          content="skincare routine, skincare recommendations, product suggestions, skincare Vietnam"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-teal-50/30">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Profile Button */}
          {isViewingFromProfile && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToProfile}
                iconName="ArrowLeft"
                iconPosition="left"
                className="rounded-3xl border hover:bg-[rgba(255,144,187,0.2)] shadow-glass-lg"
              >
                Back to Profile
              </Button>
            </div>
          )}

          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glass">
                <Icon name="Calendar" size={24} color="white" />
              </div>
              <h1 className="text-3xl font-heading font-bold gradient-text">
                {isViewingFromProfile
                  ? `Details: ${
                      savedRoutineData?.routineName ||
                      savedRoutineData?.name ||
                      "Skincare Routine"
                    }`
                  : "Skincare Routine Recommendations"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-caption max-w-2xl mx-auto">
              {isViewingFromProfile
                ? "View details of your saved routine. Click on steps to see product suggestions."
                : "Get personalized skincare routine recommendations based on your lifestyle and budget. From minimal to comprehensive routines, we help you build the perfect routine."}
            </p>
          </div>

          {/* Filter Controls */}
          {!isViewingFromProfile && (
            <div className="mt-14">
              <FilterControls
                routineType={routineType}
                setRoutineType={setRoutineType}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </div>
          )}

          {/* CTA Button */}
          {!isViewingFromProfile && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                variant="default"
                size="lg"
                onClick={handleAnalysisStart}
                disabled={isAnalyzing}
                className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 text-lg font-medium shadow-glass-lg animate-glass-float rounded-3xl  mt-6"
                iconName="Camera"
                iconPosition="left"
                iconSize={20}
              >
                {isAnalyzing ? "Analyzing..." : "Get Routine Suggestions"}
              </Button>
            </div>
          )}

          {/* Analysis Progress */}
          {!isViewingFromProfile && (
            <AnalysisProgress
              isAnalyzing={isAnalyzing}
              progress={analysisProgress}
              currentStep={currentStep}
            />
          )}

          {/* Results Section */}
          {showResults && (
            <div id="results-section">
              {/* Routine Comparison */}
              {/* {routineType && priceRange && (
                <RoutineComparison
                  routineType={routineType}
                  priceRange={priceRange}
                />
              )} */}

              <Sunscreen
                onOpenSuggestions={() =>
                  handleCategoryClick({
                    category: "Sunscreen",
                    description: "Protects skin from UV rays",
                    products: sunscreenProducts,
                  })
                }
                uvIndex={uvIndex}
                uvLevel={uvLevel}
                isLoading={isLoadingUV}
              />

              {/* Error Message */}
              {apiError && (
                <div className="glass-card p-6 rounded-3xl mb-8 bg-red-50">
                  <div className="flex items-center space-x-3">
                    <Icon
                      name="AlertCircle"
                      size={24}
                      className="text-red-600"
                    />
                    <div>
                      <h4 className="font-medium text-red-900">
                        Unable to load routines
                      </h4>
                      <p className="text-sm text-red-700">
                        Please ensure the backend server is running on port 5731
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Routine Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <RoutineCard
                  title="Morning Routine"
                  timeOfDay="morning"
                  steps={morningSteps}
                  onCategoryClick={handleCategoryClick}
                  isLoading={isLoading}
                />

                <RoutineCard
                  title="Evening Routine"
                  timeOfDay="evening"
                  steps={nightSteps}
                  onCategoryClick={handleCategoryClick}
                  isLoading={isLoading}
                />
              </div>

              {/* Save All Routines Button */}
              {!isViewingFromProfile &&
                (morningSteps?.length > 0 || nightSteps?.length > 0) && (
                  <div className="flex justify-center mb-12">
                    <button
                      onClick={() => setIsSaveModalOpen(true)}
                      className="bg-gradient-primary text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                    >
                      <Icon name="Heart" size={20} />
                      <span>Save Complete Routine</span>
                    </button>
                  </div>
                )}

              {/* Save Modal */}
              {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                      Save Your Routine
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Enter a name for your complete skincare routine (both
                      morning and evening will be saved).
                    </p>
                    <input
                      type="text"
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      placeholder="Enter routine name..."
                      className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          setIsSaveModalOpen(false);
                          setRoutineName("");
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveAllRoutines}
                        className="flex-1 bg-gradient-primary text-white py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                        disabled={isSaving || !routineName.trim()}
                      >
                        {isSaving ? "Saving..." : "Save Routine"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips Section */}
              <div className="rounded-3xl glass-card p-6 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Icon name="Lightbulb" size={20} color="white" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Tips for Effective Routine Usage
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                    <Icon
                      name="Clock"
                      size={16}
                      className="text-blue-600 mt-1"
                    />
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Waiting Time
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Wait 2-3 minutes between steps to allow products to
                        fully absorb.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                    <Icon
                      name="Droplets"
                      size={16}
                      className="text-teal-600 mt-1"
                    />
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Product Amount
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Use just the right amount to avoid waste and clogged
                        pores.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-white/10 rounded-lg">
                    <Icon
                      name="TrendingUp"
                      size={16}
                      className="text-green-600 mt-1"
                    />
                    <div>
                      <h4 className="font-medium text-foreground text-sm">
                        Consistency
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Maintain the routine for at least 4-6 weeks to see
                        noticeable results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                    Need more advice on your routine?
                  </h3>
                  <p className="text-muted-foreground font-caption mb-6 max-w-md mx-auto">
                    Our AI chatbot is ready to answer all your skincare
                    questions and help you optimize your routine.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {isViewingFromProfile && (
                      <Button
                        variant="outline"
                        onClick={handleBackToProfile}
                        iconName="ArrowLeft"
                        iconPosition="left"
                        iconSize={20}
                        className="rounded-3xl border hover:bg-[rgba(255,144,187,0.2)] border-black"
                      >
                        Back to Profile
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={() => (window.location.href = "/chatbot")}
                      iconName="MessageCircle"
                      iconPosition="left"
                      iconSize={20}
                      className="rounded-3xl px-6 py-3"
                    >
                      Consult with AI
                    </Button>
                    <Button
                      variant="default"
                      className="rounded-3xl px-6 py-3"
                      iconName="Camera"
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => {
                        window.location.href = "/product";
                      }}
                    >
                      Analyze Products
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          category={selectedCategory}
          products={modalProducts}
          isLoading={isProductsLoading}
        />
      </div>
    </>
  );
};

export default RoutineRecommendations;
