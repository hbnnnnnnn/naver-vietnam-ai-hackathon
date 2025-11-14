import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import Home from "./pages/Home";
import RoutineRecommendations from "./pages/routine-recommendations";
import ProductAnalysis from "pages/product-analysis";
import Chatbot from "pages/chatbot";
import UserProfileDashboard from "pages/user-profile";
import Login from "pages/login";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/" element={<Home />} />
          <Route path="routine" element={<RoutineRecommendations />} />
          <Route path="/product" element={<ProductAnalysis />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/profile" element={<UserProfileDashboard />} />
          <Route path="/login" element={<Login />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
