import React from "react";
import Icon from "../../../components/AppIcon";

const RiskAssessmentCard = ({ riskData }) => {
  const getRiskConfig = (level) => {
    switch (level) {
      case "no-risk":
        return {
          color: "text-success",
          bg: "bg-success/10 border-success/20",
          icon: "Shield",
          label: "No Risk",
          description: "Safe for all skin types",
        };
      case "low-risk":
        return {
          color: "text-blue-500",
          bg: "bg-blue/10 border-blue/10",
          icon: "Info",
          label: "Low Risk",
          description: "Generally safe with minimal concerns",
        };
      case "moderate-risk":
        return {
          color: "text-warning",
          bg: "bg-warning/10 border-warning/20",
          icon: "AlertTriangle",
          label: "Moderate Risk",
          description: "Should be tested before use",
        };
      case "high-risk":
        return {
          color: "text-destructive",
          bg: "bg-destructive/10 border-destructive/20",
          icon: "AlertCircle",
          label: "High Risk",
          description: "Consult specialist before use",
        };
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted border-border",
          icon: "HelpCircle",
          label: "Unknown",
          description: "Further analysis needed",
        };
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glass">
          <Icon name="Shield" size={20} color="white" />
        </div>
        <h3 className="text-xl font-heading font-semibold gradient-text">
          Risk Assessment
        </h3>
      </div>
      <div className="space-y-6">
        {/* Risk Categories */}
        <div className="space-y-4">
          {Object.entries(riskData?.categories)?.map(
            ([category, ingredients]) => {
              const config = getRiskConfig(category);

              return (
                <div
                  key={category}
                  className={`border rounded-lg p-4 ${config?.bg}`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon
                      name={config?.icon}
                      size={18}
                      className={config?.color}
                    />
                    <h4
                      className={`font-heading font-semibold ${config?.color}`}
                    >
                      {config?.label}
                    </h4>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${config?.bg} ${config?.color}`}
                    >
                      {ingredients?.length} ingredient
                      {ingredients?.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {ingredients?.map((ingredient, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {ingredient?.name}
                            </span>
                            {ingredient?.concentration && (
                              <span className="text-xs text-muted-foreground font-data">
                                {ingredient?.concentration}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-caption mt-1">
                            {ingredient?.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentCard;
