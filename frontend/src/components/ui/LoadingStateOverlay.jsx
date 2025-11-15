import React from "react";

const LoadingStateOverlay = ({
  isLoading = false,
  message = "Processing...",
  subMessage = "",
  className = "",
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={`
        absolute inset-0 z-50 flex items-center justify-center
        backdrop-blur-glass bg-white/10 rounded-lg
        animate-fade-in
        ${className}
      `}
    >
      <div className="text-center space-y-4">
        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-primary animate-spin mx-auto" />
          <div
            className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-secondary animate-spin mx-auto"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>

        {/* Loading Text */}
        <div className="space-y-1">
          <p className="text-foreground font-medium">{message}</p>
          {subMessage && (
            <p className="text-sm text-muted-foreground caption">
              {subMessage}
            </p>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2]?.map((index) => (
            <div
              key={index}
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for form elements
const FormSkeleton = ({ className = "" }) => {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {/* Form field skeletons */}
      {[1, 2, 3]?.map((index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-white/20 rounded w-1/4" />
          <div className="h-10 bg-white/10 rounded-lg border border-white/20" />
        </div>
      ))}
      {/* Button skeleton */}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-white/10 rounded-lg flex-1" />
        <div className="h-10 bg-primary/20 rounded-lg flex-1" />
      </div>
    </div>
  );
};

// Card skeleton with glassmorphism
const CardSkeleton = ({ className = "" }) => {
  return (
    <div className={`glass-card p-6 space-y-6 animate-pulse ${className}`}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-white/20 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
      </div>

      {/* Content skeleton */}
      <FormSkeleton />
    </div>
  );
};

// Shimmer effect for loading states
const ShimmerLoader = ({ className = "" }) => {
  return (
    <div
      className={`
        relative overflow-hidden bg-white/5 rounded-lg
        before:absolute before:inset-0 before:-translate-x-full
        before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
        before:animate-shimmer
        ${className}
      `}
    >
      <div className="h-full w-full bg-white/10" />
    </div>
  );
};

export default LoadingStateOverlay;
export { FormSkeleton, CardSkeleton, ShimmerLoader };
