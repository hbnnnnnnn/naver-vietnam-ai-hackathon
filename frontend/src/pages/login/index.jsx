import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterStep1 from "./components/RegisterStep1";
import RegisterStep2 from "./components/RegisterStep2";
import RegisterStep3 from "./components/RegisterStep3";
import StepIndicator from "./components/StepIndicator";
import AuthHeader from "./components/AuthHeader";
import LoadingStateOverlay from "../../components/ui/LoadingStateOverlay";
import ApiService from "../../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    skinType: "",
    skinStatus: [],
  });

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") === "true") {
      navigate("/profile");
    }
  }, [navigate]);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Try to get user from database by username
      const userResponse = await ApiService.getUserByUsername(
        formData.username
      );

      if (userResponse && userResponse.user) {
        const user = userResponse.user;
        // For now, we'll skip password validation since this is a demo
        // In real app, you'd validate password against hashed version

        // Store user profile in localStorage for session management
        const userProfile = {
          email: user.email,
          username: user.username,
          name: user.name,
          skinType: user.skinType,
          skinStatus: user.concerns || [],
          primaryStatus: user.concerns || [],
          joinDate: new Date(user.createdAt).toLocaleDateString("en-US"),
        };

        localStorage.setItem("userProfile", JSON.stringify(userProfile));
        localStorage.setItem("isAuthenticated", "true");
        navigate("/profile");
      } else {
        setErrorMessage(
          "Account does not exist. Please check your username or register a new account."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Account does not exist. Please register a new account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const userData = {
        email: registerData.email,
        username: registerData.username || registerData.name,
        name: registerData.name,
        skinType: registerData.skinType,
        concerns: registerData.skinStatus,
      };

      // Create user in database
      const response = await ApiService.createOrUpdateUser(userData);

      if (response && response.user) {
        const user = response.user;

        // Store user profile in localStorage for session management
        const userProfile = {
          email: user.email,
          username: user.username,
          name: user.name,
          skinType: user.skinType,
          skinStatus: user.concerns || [],
          primaryStatus: user.concerns || [],
          joinDate: new Date(user.createdAt).toLocaleDateString("en-US"),
        };

        localStorage.setItem("userProfile", JSON.stringify(userProfile));
        localStorage.setItem("isAuthenticated", "true");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const switchToLogin = () => {
    setMode("login");
    setStep(1);
  };

  const switchToRegister = () => {
    setMode("register");
    setStep(1);
    setErrorMessage("");
    setRegisterData({
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      skinType: "",
      skinStatus: [],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft glowing circles (background) */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,144,187,0.5) 0%, rgba(138,204,213,0.5) 100%)",
        }}
      >
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 bg-white/50 rounded-2xl relative overflow-hidden">
          {/* Loading overlay */}
          <LoadingStateOverlay
            isLoading={isLoading}
            message={mode === "login" ? "Logging in..." : "Processing..."}
            subMessage="Please wait a moment"
          />

          {/* Header */}
          <AuthHeader
            title={mode === "login" ? "Welcome back" : "Create a new account"}
            subtitle={
              mode === "login"
                ? "Log in to continue your skincare journey"
                : step === 1
                ? "Fill in your account information"
                : step === 2
                ? "Select your skin type"
                : "Select your skin concerns"
            }
          />

          {/* Error */}
          {errorMessage && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {errorMessage}
            </div>
          )}

          {/* SWITCH LOGIN / REGISTER CONTENT */}
          {mode === "login" ? (
            <>
              <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

              {/* Toggle */}
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Don’t have an account?
                </p>
                <button
                  onClick={switchToRegister}
                  className="mt-1 rounded-3xl px-4 py-2 w-full border text-sm font-medium hover:bg-[rgba(255,144,187,0.2)] transition rounded-3xl"
                >
                  Create a new account
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step indicator */}
              <StepIndicator step={step} />

              {/* Steps */}
              {step === 1 && (
                <RegisterStep1
                  data={registerData}
                  setData={setRegisterData}
                  setErrorMessage={setErrorMessage}
                  nextStep={nextStep}
                />
              )}

              {step === 2 && (
                <RegisterStep2
                  data={registerData}
                  setData={setRegisterData}
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              )}

              {step === 3 && (
                <RegisterStep3
                  data={registerData}
                  setData={setRegisterData}
                  prevStep={prevStep}
                  finishRegister={() => handleRegister()}
                />
              )}

              {/* Back to login */}
              <p className="text-center text-sm mt-4 text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={switchToLogin}
                  className="text-primary hover:underline rounded-3xl"
                >
                  Log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
