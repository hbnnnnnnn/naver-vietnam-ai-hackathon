import React from "react";
import Icon from "../../../components/AppIcon";

const RoutineCard = ({
  title,
  timeOfDay,
  steps,
  onCategoryClick,
  isLoading,
}) => {
  const getTimeIcon = () => {
    return timeOfDay === "morning" ? "Sun" : "Moon";
  };

  const getTimeColor = () => {
    return timeOfDay === "morning" ? "text-amber-600" : "text-indigo-600";
  };

  const getGradientClass = () => {
    return timeOfDay === "morning"
      ? "from-pink-100/70 via-rose-50/80 to-amber-100/70"
      : "from-sky-100/70 via-indigo-100/70 to-purple-200/90";
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 h-96">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5]?.map((i) => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl glass-card p-6 bg-gradient-to-br ${getGradientClass()}  flex flex-col h-full`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className={`p-2 rounded-lg bg-white/20 ${getTimeColor()}`}>
          <Icon name={getTimeIcon()} size={24} />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            {timeOfDay === "morning"
              ? "Start your day fresh"
              : "Recover and nourish at night"}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {steps?.map((step, index) => (
          <div
            key={step?.id}
            className=" bg-white/40 rounded-2xl group cursor-pointer"
            onClick={() => onCategoryClick(step)}
          >
            <div className="glass-button p-4 rounded-lg hover:scale-[1.02] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {step?.category}
                    </h4>
                    <p className="text-sm text-muted-foreground font-caption">
                      {step?.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Icon name="Clock" size={12} />
                        <span>{step?.timing || "N/A"}</span>
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Icon name="Target" size={12} />
                        <span>{step?.purpose || "N/A"}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Icon
                  name="ChevronRight"
                  size={20}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-white/20">
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Icon name="Timer" size={14} />
            <span>
              Total time:{" "}
              {steps
                ?.reduce((total, step) => {
                  const timing = step?.timing || "0";
                  if (timing.includes("seconds")) {
                    return total + parseFloat(timing) / 60; // Convert seconds to minutes
                  } else if (timing.includes("minute")) {
                    return total + parseFloat(timing);
                  }
                  return total;
                }, 0)
                .toFixed(0)}{" "}
              minutes
            </span>
          </span>
          <span className="flex items-center space-x-1">
            <Icon name="Layers" size={14} />
            <span>{steps?.length} steps</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoutineCard;
