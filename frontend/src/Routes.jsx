import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import Home from "./pages/Home";
import ProductAnalysis from "pages/product-analysis";
import Chatbot from "pages/chatbot";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<ProductAnalysis />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
