import React, { useState } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { FieldValidationFeedback } from "../../../components/ui/FormValidationFeedback";
import Icon from "../../../components/AppIcon";

const LoginForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.username) {
      newErrors.username = "Username is required";
    }

    if (!formData?.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Username Field */}
      <div className="space-y-2">
        <Input
          label="Username"
          type="text"
          placeholder="Enter your username"
          value={formData?.username}
          onChange={(e) => handleInputChange("username", e?.target?.value)}
          required
          disabled={isLoading}
          className="transition-all duration-300 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
        />
        {errors?.username && (
          <FieldValidationFeedback error={errors?.username} />
        )}
      </div>
      {/* Password Field */}
      <div className="space-y-2">
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData?.password}
            onChange={(e) => handleInputChange("password", e?.target?.value)}
            required
            disabled={isLoading}
            className="transition-all duration-300 pr-12 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="rounded-3xl absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            disabled={isLoading}
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
          </button>
        </div>
        {errors?.password && (
          <FieldValidationFeedback error={errors?.password} />
        )}
      </div>
      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        className="rounded-3xl mt-8"
      >
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
