import React from "react";

const StepIndicator = ({ step }) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm text-muted-foreground">Bước {step}/3</p>
      </div>

      <div className="flex items-center gap-1 w-24">
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative flex-1">
            <div className="h-1.5 rounded-full bg-muted/60" />

            <div
              className={`absolute inset-0 h-1.5 rounded-full transition-all ${
                step >= s ? "bg-primary" : "bg-transparent"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
