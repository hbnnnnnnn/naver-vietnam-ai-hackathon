import React, { useEffect, useState } from "react";
import Select from "../../../components/ui/Select";
import ApiService from "../../../services/api";

const FilterControls = ({
  routineType,
  setRoutineType,
  priceRange,
  setPriceRange,
  priceMode,
  setPriceMode,
  maxPrice,
  setMaxPrice,
}) => {
  const [priceRanges, setPriceRanges] = useState(null);
  const [isLoadingRanges, setIsLoadingRanges] = useState(false);

  // Fetch price ranges from backend
  useEffect(() => {
    const fetchPriceRanges = async () => {
      try {
        setIsLoadingRanges(true);
        const userProfile = JSON.parse(
          localStorage.getItem("userProfile") || "{}"
        );
        const skinType = userProfile?.skinType?.toLowerCase() || "normal";

        const data = await ApiService.getPriceRanges(skinType);
        setPriceRanges(data.priceRanges);
      } catch (error) {
        console.error("Error fetching price ranges:", error);
      } finally {
        setIsLoadingRanges(false);
      }
    };

    fetchPriceRanges();
  }, []);

  // Get min/max for current strategy and price mode
  const getCurrentPriceRange = () => {
    if (!priceRanges || !priceRanges[routineType]) {
      return {
        min: priceMode === "total" ? 2000000 : 100000,
        max: 20000000,
      };
    }

    const strategyRanges = priceRanges[routineType];
    let min, max;

    if (priceMode === "total") {
      min = strategyRanges.totalRoutinePrice.min || 2000000;
      max = strategyRanges.totalRoutinePrice.max || 20000000;
    } else {
      min = strategyRanges.individualProductPrice.min || 100000;
      max = strategyRanges.individualProductPrice.max || 20000000;
    }

    min = Math.ceil(min / 1000) * 1000;
    max = Math.ceil(max / 1000) * 1000;

    return { min, max };
  };

  const currentRange = getCurrentPriceRange();

  useEffect(() => {
    if (priceRanges && priceRanges[routineType]) {
      setMaxPrice(currentRange.min);
    }
  }, [routineType, priceMode, priceRanges]);

  const clampedMaxPrice = Math.min(
    Math.max(maxPrice, currentRange.min),
    currentRange.max
  );
  const routineOptions = [
    {
      value: "minimal",
      label: "Minimal routine (3-5 steps)",
      description: "Suitable for busy individuals",
    },
    {
      value: "complete",
      label: "Complete routine (7-10 steps)",
      description: "Deep skincare routine",
    },
    {
      value: "focus_treatment",
      label: "Focus on treatment",
      description: "Target specific skin concerns",
    },
    {
      value: "focus_hydration",
      label: "Focus on hydration",
      description: "Deep moisture and hydration",
    },
    {
      value: "anti_aging",
      label: "Anti-aging routine",
      description: "Prevent and reduce signs of aging",
    },
  ];

  const priceOptions = [
    {
      value: "budget-friendly",
      label: "Budget-friendly (100,000 - 500,000 VND)",
      description: "Affordable products",
    },
    {
      value: "mid-range",
      label: "Mid-range (500,000 - 1,500,000 VND)",
      description: "Good quality, reasonable price",
    },
    {
      value: "premium",
      label: "Premium (1,500,000+ VND)",
      description: "High-end, effective products",
    },
  ];

  const priceModeOptions = [
    {
      value: "total",
      label: "Total routine price",
      description: "Based on total cost of all products in routine",
    },
    {
      value: "individual",
      label: "Individual product price",
      description: "Based on price range of each product",
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="glass-card p-6 mb-8 rounded-3xl">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* First Column: Routine Type */}
        <div className="flex-1">
          <Select
            label="Skincare routine type"
            description="Choose the complexity level that suits your lifestyle"
            options={routineOptions}
            value={routineType}
            onChange={setRoutineType}
            placeholder="Select routine type..."
            className="w-full"
          />
        </div>

        {/* Second Column: Price Mode */}
        <div className="flex-1">
          <Select
            label="Price calculation method"
            description="Choose how to calculate price range for your routine"
            options={priceModeOptions}
            value={priceMode}
            onChange={setPriceMode}
            placeholder="Select price mode..."
            className="w-full"
          />
        </div>
      </div>

      {/* Price Slider - Full Width Below */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-foreground mb-2">
          {priceMode === "total"
            ? "Maximum total price"
            : "Maximum price per product"}
          {isLoadingRanges && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Loading ranges...)
            </span>
          )}
        </label>
        <div className="space-y-1">
          <input
            type="range"
            min={currentRange.min}
            max={currentRange.max}
            step="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            disabled={isLoadingRanges}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {formatPrice(currentRange.min)}
            </span>
            <span className="text-lg font-semibold text-primary">
              {formatPrice(maxPrice)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatPrice(currentRange.max)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
