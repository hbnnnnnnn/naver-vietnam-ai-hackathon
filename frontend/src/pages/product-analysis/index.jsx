import React, { useState, useEffect } from "react";
import Header from "../../components/ui/Header";
import ImageUploadZone from "./components/ImageUploadZone";
import OverviewCard from "./components/OverviewCard";
import RiskAssessmentCard from "./components/RiskAssessmentCard";
import IngredientsCard from "./components/IngredientsCard";
import AnalysisProgress from "./components/AnalysisProgress";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

const ProductAnalysis = () => {
  const [uploadedImages, setUploadedImages] = useState({
    front: null,
    back: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("upload");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

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
            concentration: "15%",
            reason: "Safe ingredient, FDA approved for cosmetic use",
          },
          {
            name: "Hyaluronic Acid",
            concentration: "2%",
            reason: "Natural moisturizer, non-irritating",
          },
          {
            name: "Glycerin",
            concentration: "5%",
            reason: "Safe skin softener, suitable for all skin types",
          },
        ],
        "low-risk": [
          {
            name: "Phenoxyethanol",
            concentration: "0.5%",
            reason:
              "Preservative that may cause mild irritation in sensitive skin",
          },
          {
            name: "Fragrance",
            concentration: "0.2%",
            reason: "May cause allergic reactions in some individuals",
          },
        ],
        "moderate-risk": [
          {
            name: "Alpha Hydroxy Acids (AHA)",
            concentration: "3%",
            reason: "May increase sun sensitivity, sunscreen required",
          },
        ],
      },
    },
    ingredients: [
      {
        name: "Vitamin C (L-Ascorbic Acid)",
        concentration: "15",
        description:
          "Powerful antioxidant that brightens skin and stimulates collagen production",
        benefits: [
          "Natural skin brightening",
          "Powerful antioxidant protection",
          "Stimulates collagen production",
          "Reduces dark spots and freckles",
        ],
        usageNotes: "Best used in the morning with sunscreen",
        safetyInfo: null,
      },
      {
        name: "Hyaluronic Acid",
        concentration: "2",
        description:
          "Natural moisturizer that can hold up to 1000 times its weight in water",
        benefits: [
          "Deep hydration",
          "Plumps fine lines",
          "Improves skin elasticity",
          "Restores skin barrier",
        ],
        usageNotes:
          "Can be used morning and evening, suitable for all skin types",
        safetyInfo: null,
      },
      {
        name: "Niacinamide (Vitamin B3)",
        concentration: "5",
        description:
          "Vitamin B3 that helps control excess oil and minimize pores",
        benefits: [
          "Controls excess oil",
          "Minimizes pore appearance",
          "Evens skin tone",
          "Mild anti-inflammatory",
        ],
        usageNotes: "Safe for daily use, compatible with other ingredients",
        safetyInfo: null,
      },
      {
        name: "Alpha Hydroxy Acids (AHA)",
        concentration: "3",
        description:
          "Natural acids that gently exfoliate and smooth skin texture",
        benefits: [
          "Gentle exfoliation",
          "Smooths skin texture",
          "Improves skin texture",
          "Enhances product absorption",
        ],
        usageNotes: "Start with low frequency, gradually increase over time",
        safetyInfo:
          "May increase sun sensitivity. Always use sunscreen when using AHA products.",
      },
      {
        name: "Phenoxyethanol",
        concentration: "0.5",
        description: "Preservative that prevents bacteria and mold growth",
        benefits: [
          "Product preservation",
          "Prevents bacterial growth",
          "Extends shelf life",
        ],
        usageNotes: "Low concentration, safe for most people",
        safetyInfo:
          "May cause mild irritation in very sensitive skin. Patch test recommended.",
      },
      {
        name: "Glycerin",
        concentration: "5",
        description:
          "Natural skin conditioner that moisturizes and softens skin",
        benefits: [
          "Natural moisturizing",
          "Softens skin",
          "Improves smoothness",
          "Non-comedogenic",
        ],
        usageNotes: "Suitable for all skin types, can be used daily",
        safetyInfo: null,
      },
    ],
  };

  const handleImageUpload = (type, imageData, file) => {
    setUploadedImages((prev) => ({
      ...prev,
      [type]: imageData,
    }));
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
  };

  const handleAnalyzeProduct = () => {
    if (uploadedImages?.front || uploadedImages?.back) {
      simulateAnalysis();
    }
  };

  const handleReset = () => {
    setUploadedImages({ front: null, back: null });
    setAnalysisResults(null);
    setShowResults(false);
    setAnalysisProgress(0);
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                <Button
                  variant="default"
                  size="lg"
                  onClick={() =>
                    (window.location.href = "/routine-recommendations")
                  }
                  iconName="Calendar"
                  iconPosition="left"
                  className="w-full sm:w-auto rounded-3xl"
                >
                  View Routine Suggestions
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = "/skincare-chatbot")}
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
