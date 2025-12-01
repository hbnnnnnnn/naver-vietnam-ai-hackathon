import React from "react";
import Select from "../../../components/ui/Select";

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
      <div className="flex flex-col lg:flex-row gap-6">
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
      <div className="mt-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          {priceMode === "total"
            ? "Maximum total price"
            : "Maximum price per product"}
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          {priceMode === "total"
            ? "Drag to set maximum budget for entire routine (minimum: 500,000 VND)"
            : "Drag to set maximum price for each product (minimum: 0 VND)"}
        </p>
        <div className="space-y-4">
          <input
            type="range"
            min={priceMode === "total" ? "500000" : "0"}
            max="20000000"
            step="100000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {priceMode === "total" ? "500,000 VND" : "0 VND"}
            </span>
            <span className="text-lg font-semibold text-primary">
              {formatPrice(maxPrice)}
            </span>
            <span className="text-sm text-muted-foreground">
              20,000,000 VND
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
