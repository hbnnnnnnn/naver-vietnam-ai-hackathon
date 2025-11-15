import React from "react";
import Icon from "../../../components/AppIcon";

const RoutineComparison = ({ routineType, priceRange }) => {
  const getComparisonData = () => {
    const baseData = {
      minimal: {
        steps: "3-5",
        time: "5-8 minutes",
        difficulty: "Easy",
        suitability: "Busy individuals, beginners",
        results: "2-4 weeks",
        icon: "Zap",
        color: "text-green-600",
      },
      comprehensive: {
        steps: "7-10",
        time: "15-25 minutes",
        difficulty: "Moderate",
        suitability: "Experienced, with free time",
        results: "1-2 weeks",
        icon: "Target",
        color: "text-blue-600",
      },
    };

    const priceData = {
      low: {
        budget: "100K - 500K VND",
        quality: "Good",
        brands: "Local, drugstore",
      },
      medium: {
        budget: "500K - 1.5M VND",
        quality: "Very good",
        brands: "Mid-range, K-beauty",
      },
      high: {
        budget: "1.5M+ VND",
        quality: "Excellent",
        brands: "Premium, luxury",
      },
    };

    return {
      routine: baseData?.[routineType] || baseData?.minimal,
      price: priceData?.[priceRange] || priceData?.medium,
    };
  };

  const data = getComparisonData();

  return (
    <div className="glass-card p-6 mb-8 rounded-3xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={20} color="white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Overview of Selected Routine
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            Detailed information about your selection
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Routine Info */}
        <div className="rounded-xl glass-card p-6 bg-gradient-to-br">
          <div className="flex items-center space-x-3 mb-4">
            <Icon
              name={data?.routine?.icon}
              size={20}
              className={data?.routine?.color}
            />
            <h4 className="font-medium text-foreground">Routine Information</h4>
          </div>

          <div className="space-y-3 pl-8">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Number of steps:
              </span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.steps} steps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Time required:
              </span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                See results in:
              </span>
              <span className="text-sm font-medium text-foreground">
                {data?.routine?.results}
              </span>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="rounded-xl glass-card p-6 bg-gradient-to-br">
          <div className="flex items-center space-x-3 mb-4">
            <Icon name="DollarSign" size={20} className="text-green-600" />
            <h4 className="font-medium text-foreground">Budget Information</h4>
          </div>

          <div className="space-y-3 pl-8">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.budget}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quality:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.quality}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Brands:</span>
              <span className="text-sm font-medium text-foreground">
                {data?.price?.brands}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-start space-x-3 p-4 bg-blue-50/20 rounded-lg">
          <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Important Note:</p>
            <p>
              The most effective skincare routine is the one you can maintain
              long-term. Start simple and adjust based on your skin's response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineComparison;
