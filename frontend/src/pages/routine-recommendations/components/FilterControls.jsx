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
      value: "comprehensive",
      label: "Comprehensive routine (7-10 steps)",
      description: "Deep skincare routine",
    },
  ];

  const priceOptions = [
    {
      value: "low",
      label: "Budget-friendly (100,000 - 500,000 VND)",
      description: "Affordable products",
    },
    {
      value: "medium",
      label: "Mid-range (500,000 - 1,500,000 VND)",
      description: "Good quality, reasonable price",
    },
    {
      value: "high",
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
