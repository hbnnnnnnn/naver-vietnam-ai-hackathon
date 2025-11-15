import React from "react";
import Button from "../../../components/ui/Button";

const skinStatusOptions = [
  { value: "acne", label: "Acne" },
  { value: "aging", label: "Aging" },
  { value: "pigmentation", label: "Hyperpigmentation" },
  { value: "sensitivity", label: "Sensitivity" },
  { value: "dryness", label: "Dryness" },
  { value: "oiliness", label: "Oiliness" },
];

const RegisterStep3 = ({ data, setData, prevStep, finishRegister }) => {
  const toggle = (item) => {
    const exists = data.skinStatus.includes(item);
    setData({
      ...data,
      skinStatus: exists
        ? data.skinStatus.filter((c) => c !== item)
        : [...data.skinStatus, item],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    finishRegister();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select the skin concerns you are interested in (multiple options).
      </p>

      <div className="flex flex-wrap gap-2">
        {skinStatusOptions.map((option) => {
          const isActive = data.skinStatus.includes(option.value);
          return (
            <Button
              className={
                isActive
                  ? "rounded-3xl"
                  : "hover:bg-[rgba(255,144,187,0.2)] rounded-3xl"
              }
              type="button"
              key={option.value}
              onClick={() => toggle(option.value)}
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
          Complete
        </Button>
      </div>
    </form>
  );
};

export default RegisterStep3;
