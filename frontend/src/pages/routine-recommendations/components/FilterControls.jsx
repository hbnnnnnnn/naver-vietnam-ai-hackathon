import React from "react";
import Select from "../../../components/ui/Select";

const FilterControls = ({
  routineType,
  setRoutineType,
  priceRange,
  setPriceRange,
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

  return (
    <div className="glass-card p-6 mb-8 rounded-3xl">
      <div className="flex flex-col lg:flex-row gap-6">
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

        <div className="flex-1">
          <Select
            label="Desired price range"
            description="Select a budget suitable for your routine"
            options={priceOptions}
            value={priceRange}
            onChange={setPriceRange}
            placeholder="Select price range..."
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
