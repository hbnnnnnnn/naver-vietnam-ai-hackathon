import React, { useState } from "react";
import Icon from "../../../components/AppIcon";

const IngredientsCard = ({ ingredientsData }) => {
  const [expandedIngredient, setExpandedIngredient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIngredients = ingredientsData?.filter(
    (ingredient) =>
      ingredient?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      ingredient?.benefits?.some((benefit) =>
        benefit?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      )
  );

  const getBenefitIcon = (benefit) => {
    const benefitLower = benefit?.toLowerCase();
    if (benefitLower?.includes("hydrat")) return "Droplets";
    if (benefitLower?.includes("anti-aging")) return "Clock";
    if (benefitLower?.includes("brighten")) return "Sun";
    if (benefitLower?.includes("antibacterial")) return "Shield";
    if (benefitLower?.includes("antioxidant")) return "Leaf";
    return "Sparkles";
  };

  const getConcentrationColor = (concentration) => {
    const value = parseFloat(concentration);
    if (value >= 10) return "text-error bg-error/10 border-error/20";
    if (value >= 5) return "text-warning bg-warning/10 border-warning/20";
    return "text-success bg-success/10 border-success/20";
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "no-risk":
        return {
          border: "border-black-300",
          bg: "bg-white",
          nameColor: "text-blue-800",
        };
      case "low-risk":
        return {
          border: "border-black-300",
          bg: "bg-white",
          nameColor: "text-green-800",
        };
      case "moderate-risk":
        return {
          border: "border-black-300",
          bg: "bg-white",
          nameColor: "text-orange-800",
        };
      case "high-risk":
        return {
          border: "border-black-300",
          bg: "bg-white",
          nameColor: "text-red-700",
        };
      default:
        return {
          border: "border-black-300",
          bg: "bg-white",
          nameColor: "text-gray-800",
        };
    }
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case "no-risk":
        return {
          color: "text-blue-700",
          bg: "bg-blue-100",
          label: "Safe",
          icon: "Shield",
        };
      case "low-risk":
        return {
          color: "text-green-700",
          bg: "bg-green-100",
          label: "Low Risk",
          icon: "Info",
        };
      case "moderate-risk":
        return {
          color: "text-orange-700",
          bg: "bg-orange-100",
          label: "Moderate",
          icon: "AlertTriangle",
        };
      case "high-risk":
        return {
          color: "text-red-700",
          bg: "bg-red-100",
          label: "High Risk",
          icon: "AlertCircle",
        };
      default:
        return null;
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glass">
          <Icon name="Beaker" size={20} color="white" />
        </div>
        <h3 className="text-xl font-heading font-semibold gradient-text">
          Ingredients Details
        </h3>
      </div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <Icon
          name="Search"
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search Ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-lg text-sm font-caption placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
        />
      </div>
      {/* Ingredients List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredIngredients?.map((ingredient, index) => {
          // Use the correct field name from backend and normalize to lowercase
          const rawRiskLevel = ingredient?.risk_level || 'low-risk';
          const riskLevel = rawRiskLevel.toLowerCase().replace(/_/g, '-');

          const riskConfig = getRiskColor(riskLevel);
          const riskBadge = getRiskBadge(riskLevel);

          return (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${riskConfig.border}`}
            >
              <div
                className={`p-4 cursor-pointer transition-colors duration-200 ${riskConfig.bg}`}
                onClick={() =>
                  setExpandedIngredient(
                    expandedIngredient === index ? null : index
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className={`font-heading font-semibold ${riskConfig.nameColor}`}>
                        {ingredient?.name}
                      </h4>

                      {/* Risk Badge */}
                      {riskBadge && (
                        <span
                          className={`
                            text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1
                            ${riskBadge.bg} ${riskBadge.color} border
                          `}
                        >
                          <Icon name={riskBadge.icon} size={12} />
                          {riskBadge.label}
                        </span>
                      )}

                      {/* Concentration Badge */}
                      {ingredient?.concentration && (
                        <span
                          className={`
                            text-xs px-2 py-1 rounded-full border font-data
                            ${getConcentrationColor(ingredient?.concentration)}
                          `}
                        >
                          {ingredient?.concentration}%
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground font-caption">
                      {ingredient?.description}
                    </p>
                  </div>

                  <Icon
                    name={
                      expandedIngredient === index ? "ChevronUp" : "ChevronDown"
                    }
                    size={20}
                    className="text-muted-foreground ml-3"
                  />
                </div>
              </div>

              {expandedIngredient === index && (
                <div className="px-4 pb-4 border-t border-white/10 bg-white/5">
                  <div className="pt-4 space-y-4">
                    {/* Benefits */}
                    <div>
                      <h5 className="text-sm font-heading font-semibold text-foreground mb-3">
                        Benefits
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ingredient?.benefits?.map((benefit, benefitIndex) => (
                          <div
                            key={benefitIndex}
                            className="flex items-center space-x-2"
                          >
                            <Icon
                              name={getBenefitIcon(benefit)}
                              size={14}
                              className="text-primary"
                            />
                            <span className="text-sm text-foreground font-caption">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Usage Notes */}
                    {ingredient?.usageNotes && (
                      <div>
                        <h5 className="text-sm font-heading font-semibold text-foreground mb-2">
                          Usage Notes
                        </h5>
                        <p className="text-sm text-muted-foreground font-caption">
                          {ingredient?.usageNotes}
                        </p>
                      </div>
                    )}

                    {/* Safety Info */}
                    {ingredient?.safetyInfo && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Icon
                            name="AlertTriangle"
                            size={16}
                            className="text-warning mt-0.5"
                          />
                          <div>
                            <h5 className="text-sm font-heading font-semibold text-warning mb-1">
                              Safety Information
                            </h5>
                            <p className="text-sm text-foreground font-caption">
                              {ingredient?.safetyInfo}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filteredIngredients?.length === 0 && (
        <div className="text-center py-8">
          <Icon
            name="Search"
            size={48}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground font-caption">
            No ingredients found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default IngredientsCard;
