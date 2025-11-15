import React, { useState } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const RegisterStep1 = ({ data, setData, nextStep, setErrorMessage }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const checks = {
      length: password?.length >= 8,
      uppercase: /[A-Z]/?.test(password),
      lowercase: /[a-z]/?.test(password),
      numbers: /\d/?.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/?.test(password),
    };

    Object.values(checks).forEach((c) => c && score++);

    if (score < 2)
      return { level: "weak", color: "text-error", bg: "bg-error" };
    if (score < 4)
      return { level: "medium", color: "text-warning", bg: "bg-warning" };
    return { level: "strong", color: "text-success", bg: "bg-success" };
  };

  const passwordStrength =
    data?.password?.length > 0
      ? calculatePasswordStrength(data.password)
      : null;

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "password":
        if (!value) newErrors.password = "Password is required";
        else if (value.length < 8)
          newErrors.password = "Password must be at least 8 characters long";
        else delete newErrors.password;

        if (data.confirmPassword && value !== data.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        } else delete newErrors.confirmPassword;
        break;

      case "confirmPassword":
        if (!value) newErrors.confirmPassword = "Please confirm your password";
        else if (value !== data.password)
          newErrors.confirmPassword = "Passwords do not match";
        else delete newErrors.confirmPassword;
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });

    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let valid = true;
    ["password", "confirmPassword"].forEach((field) => {
      if (!validateField(field, data[field])) valid = false;
    });

    if (!valid) return;

    const username = (data.username || "").trim();

    try {
      const savedProfileRaw = localStorage.getItem("userProfile");
      const savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : null;

      const usersRaw = localStorage.getItem("users");
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      const duplicateInProfile =
        savedProfile && savedProfile.username === username;

      const duplicateInUsers =
        Array.isArray(users) && users.some((u) => u?.username === username);

      if (duplicateInProfile || duplicateInUsers) {
        setErrorMessage?.("Username already exists. Please choose another.");
        return;
      }
    } catch (_) {}

    setErrorMessage?.("");
    nextStep();
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    data.name &&
    data.username &&
    data.password &&
    data.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        className="transition-all duration-300 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
        label="Display Name"
        type="text"
        placeholder="Enter your display name"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        required
      />

      <Input
        className="transition-all duration-300 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
        label="Username"
        type="text"
        placeholder="Enter your username"
        value={data.username}
        onChange={(e) => setData({ ...data, username: e.target.value })}
        required
      />

      <div className="space-y-2">
        <Input
          className="transition-all duration-300 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
          name="password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={data.password}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={touched.password ? errors.password : ""}
        />

        {data.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs caption text-muted-foreground">
                Password strength:
              </span>
              <span className={`text-xs font-medium ${passwordStrength.color}`}>
                {passwordStrength.level === "weak" && "Weak"}
                {passwordStrength.level === "medium" && "Medium"}
                {passwordStrength.level === "strong" && "Strong"}
              </span>
            </div>

            <div className="w-full bg-white/30 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${passwordStrength.bg}`}
                style={{
                  width:
                    passwordStrength.level === "weak"
                      ? "33%"
                      : passwordStrength.level === "medium"
                      ? "66%"
                      : "100%",
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {Object.entries({
                length: data.password.length >= 8,
                uppercase: /[A-Z]/.test(data.password),
                lowercase: /[a-z]/.test(data.password),
                numbers: /\d/.test(data.password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
              }).map(([key, isValid], idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Icon
                    name={isValid ? "CheckCircle" : "Circle"}
                    size={12}
                    className={
                      isValid ? "text-success" : "text-muted-foreground"
                    }
                  />
                  <span
                    className={
                      isValid ? "text-success" : "text-muted-foreground"
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Input
        className="transition-all duration-300 border-gray-300 focus-visible:border-pink-500 focus-visible:ring-pink-500"
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        value={data.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        error={touched.confirmPassword ? errors.confirmPassword : ""}
      />

      <div className="flex justify-end pt-2">
        <Button
          className="rounded-3xl"
          type="submit"
          variant="default"
          size="lg"
          disabled={!isFormValid}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default RegisterStep1;
