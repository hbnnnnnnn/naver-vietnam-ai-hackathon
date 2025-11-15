import React from "react";
import Button from "../../../components/ui/Button";

const skinTypeOptions = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
];

const RegisterStep2 = ({ data, setData, nextStep, prevStep }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select your skin type. You can change it later.
      </p>

      <div className="flex flex-wrap gap-2">
        {skinTypeOptions.map((option) => {
          const isActive = data.skinType === option.value;
          return (
            <Button
              className={
                isActive
                  ? "rounded-3xl"
                  : "hover:bg-[rgba(255,144,187,0.2)] rounded-3xl"
              }
              type="button"
              key={option.value}
              onClick={() => setData({ ...data, skinType: option.value })}
              variant={isActive ? "default" : "outline"}
              size="sm"
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="hover:bg-[rgba(255,144,187,0.2)] rounded-3xl"
        >
          Back
        </Button>
        <Button type="submit" variant="default" className="rounded-3xl">
          Continue
        </Button>
      </div>
    </form>
  );
};

export default RegisterStep2;
