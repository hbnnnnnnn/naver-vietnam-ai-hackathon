import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ProfileHeader from "./components/ProfileHeader";
import ScanHistoryTab from "./components/ScanHistoryTab";
import SavedRoutinesTab from "./components/SavedRoutinesTab";

const UserProfileDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");
  const [userProfile, setUserProfile] = useState({
    id: 1,
    name: "Minh Anh Nguyen",
    avatar:
      "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh.jpg",
    avatarAlt:
      "Professional headshot of young Vietnamese woman with long black hair wearing white blouse",
    skinType: "combination",
    primaryStatus: ["acne", "oiliness"],
    joinDate: "03/15/2024",
  });

  const [stats, setStats] = useState({
    totalScans: 0,
    savedRoutines: 0,
    aiConsultations: 15,
    activeDays: 45,
  });

  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      productName: "Anessa Perfect UV Sunscreen",
      brandName: "Anessa",
      productImage: "https://images.unsplash.com/photo-1562580836-cdbcc5152819",
      productImageAlt:
        "White tube of Anessa sunscreen with blue and gold packaging on white background",
      scanDate: "11/07/2024",
      scanTime: "2:30 PM",
      safetyLevel: "safe",
      ingredientCount: 18,
      riskIngredients: 0,
    },
    {
      id: 2,
      productName: "The Ordinary Vitamin C Serum",
      brandName: "The Ordinary",
      productImage:
        "https://images.unsplash.com/photo-1696256016872-1526c9d0e280",
      productImageAlt:
        "Clear glass dropper bottle of The Ordinary Vitamin C serum with white label",
      scanDate: "11/05/2024",
      scanTime: "9:15 AM",
      safetyLevel: "neutral",
      ingredientCount: 12,
      riskIngredients: 1,
    },
    {
      id: 3,
      productName: "CeraVe Foaming Facial Cleanser",
      brandName: "CeraVe",
      productImage:
        "https://images.unsplash.com/photo-1735286770188-de4c5131589a",
      productImageAlt:
        "Blue and white pump bottle of CeraVe foaming facial cleanser",
      scanDate: "11/03/2024",
      scanTime: "8:45 PM",
      safetyLevel: "safe",
      ingredientCount: 15,
      riskIngredients: 0,
    },
    {
      id: 4,
      productName: "Neutrogena Hydro Boost Moisturizer",
      brandName: "Neutrogena",
      productImage:
        "https://images.unsplash.com/photo-1722979350117-d2b6c5e111ee",
      productImageAlt:
        "Blue jar of Neutrogena Hydro Boost moisturizer with clear gel texture visible",
      scanDate: "11/01/2024",
      scanTime: "4:20 PM",
      safetyLevel: "risky",
      ingredientCount: 22,
      riskIngredients: 3,
    },
    {
      id: 5,
      productName: "Paula's Choice BHA 2% Toner",
      brandName: "Paula's Choice",
      productImage:
        "https://images.unsplash.com/photo-1620159071448-dc1de8b92703",
      productImageAlt:
        "Dark blue bottle of Paula's Choice BHA liquid exfoliant with pump dispenser",
      scanDate: "10/30/2024",
      scanTime: "11:30 AM",
      safetyLevel: "neutral",
      ingredientCount: 14,
      riskIngredients: 1,
    },
  ]);

  const [savedRoutines, setSavedRoutines] = useState([
    {
      id: 1,
      routineName: "Acne Care Routine",
      routineType: "complete",
      createdAt: "2024-10-25T00:00:00Z",
      skinType: "combination",
      priceRange: "mid-range",
      morningRoutine: {
        steps: [
          {
            id: 1,
            category: "Cleanser",
            description: "Gentle cleanser",
            timing: "1 minute",
          },
          {
            id: 2,
            category: "Treatment",
            description: "pH balancing toner",
            timing: "30 seconds",
          },
          {
            id: 3,
            category: "Treatment",
            description: "Niacinamide serum",
            timing: "30 seconds",
          },
          {
            id: 4,
            category: "Moisturizer",
            description: "Oil-free moisturizer",
            timing: "1 minute",
          },
          {
            id: 5,
            category: "Sunscreen",
            description: "SPF 50 sunscreen",
            timing: "1 minute",
          },
        ],
      },
      eveningRoutine: {
        steps: [
          {
            id: 1,
            category: "Cleanser",
            description: "Oil cleanser",
            timing: "2 minutes",
          },
          {
            id: 2,
            category: "Cleanser",
            description: "Deep cleansing face wash",
            timing: "1 minute",
          },
          {
            id: 3,
            category: "Treatment",
            description: "2% BHA toner",
            timing: "30 seconds",
          },
          {
            id: 4,
            category: "Treatment",
            description: "Retinol serum (3x/week)",
            timing: "30 seconds",
          },
          {
            id: 5,
            category: "Moisturizer",
            description: "Restorative moisturizer",
            timing: "1 minute",
          },
          {
            id: 6,
            category: "Eye cream",
            description: "Anti-aging eye cream",
            timing: "30 seconds",
          },
        ],
      },
    },
    {
      id: 2,
      routineName: "Minimal Routine for Sensitive Skin",
      routineType: "minimal",
      createdAt: "2024-10-20T00:00:00Z",
      skinType: "sensitive",
      priceRange: "budget-friendly",
      morningRoutine: {
        steps: [
          {
            id: 1,
            category: "Cleanser",
            description: "Micellar water",
            timing: "1 minute",
          },
          {
            id: 2,
            category: "Moisturizer",
            description: "Light moisturizer",
            timing: "1 minute",
          },
          {
            id: 3,
            category: "Sunscreen",
            description: "Mineral sunscreen",
            timing: "1 minute",
          },
        ],
      },
      eveningRoutine: {
        steps: [
          {
            id: 1,
            category: "Cleanser",
            description: "Soap-free cleanser",
            timing: "1 minute",
          },
          {
            id: 2,
            category: "Treatment",
            description: "Hyaluronic acid serum",
            timing: "30 seconds",
          },
          {
            id: 3,
            category: "Moisturizer",
            description: "Restorative moisturizer",
            timing: "1 minute",
          },
        ],
      },
    },
  ]);

  const [preferences, setPreferences] = useState({
    language: "vi",
    currency: "vnd",
    theme: "light",
    timezone: "Asia/Ho_Chi_Minh",
    notifications: {
      email: true,
      push: true,
      routineReminders: true,
      productUpdates: false,
      newsletter: true,
    },
    privacy: {
      publicProfile: false,
      shareRoutines: true,
      analytics: true,
      personalizedAds: false,
    },
  });

  // Update stats when data changes
  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      totalScans: scanHistory?.length || 0,
      savedRoutines: savedRoutines?.length || 0,
    }));
  }, [scanHistory?.length, savedRoutines?.length]);

  const tabs = [
    {
      id: "history",
      label: "Scan History",
      icon: "History",
      count: scanHistory?.length || 0,
    },
    {
      id: "routines",
      label: "Saved Routines",
      icon: "Star",
      count: savedRoutines?.length || 0,
    },
  ];

  const handleUpdateProfile = (updatedProfile) => {
    // Merge and persist to localStorage for future sessions
    setUserProfile(updatedProfile);

    try {
      const saved = localStorage.getItem("userProfile");
      const existing = saved ? JSON.parse(saved) : {};
      const toSave = {
        ...existing,
        ...updatedProfile,
      };
      localStorage.setItem("userProfile", JSON.stringify(toSave));
    } catch (e) {
      // no-op if localStorage is unavailable
    }

    console.log("Profile updated:", updatedProfile);
  };

  const handleUpdatePreferences = (updatedPreferences) => {
    setPreferences(updatedPreferences);
    console.log("Preferences updated:", updatedPreferences);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("loginTimestamp");
    navigate("/login");
  };

  useEffect(() => {
    // Load user data from localStorage or API
    const savedLanguage = localStorage.getItem("glowlens-language") || "vi";
    if (savedLanguage !== preferences?.language) {
      setPreferences((prev) => ({ ...prev, language: savedLanguage }));
    }

    // Load user profile from localStorage
    const savedUserProfile = localStorage.getItem("userProfile");
    if (savedUserProfile) {
      const profileData = JSON.parse(savedUserProfile);
      setUserProfile((prev) => ({
        ...prev,
        name: profileData.name || prev.name,
        email: profileData.email || prev.email,
        skinType: profileData.skinType || prev.skinType,
        primaryStatus:
          profileData.primaryStatus ||
          profileData.skinStatus ||
          prev.primaryStatus,
        joinDate: profileData.joinDate || prev.joinDate,
      }));
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "history":
        return (
          <ScanHistoryTab
            scanHistory={scanHistory}
            onHistoryChange={setScanHistory}
          />
        );
      case "routines":
        return (
          <SavedRoutinesTab
            savedRoutines={savedRoutines}
            onRoutinesChange={setSavedRoutines}
          />
        );
      default:
        return <ScanHistoryTab scanHistory={scanHistory} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile</title>
        <meta
          name="description"
          content="Manage your profile, product scan history and skincare routines"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative z-40" style={{ overflow: "visible" }}>
              <ProfileHeader
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  onClick={() => navigate("/product")}
                  iconName="Scan"
                  iconPosition="left"
                  className="rounded-3xl shadow-glow animate-glass-float"
                >
                  Scan new product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/routine")}
                  iconName="MessageCircle"
                  iconPosition="left"
                  className="rounded-3xl border hover:bg-[rgba(255,144,187,0.2)] border-black animate-glass-float"
                >
                  Gợi ý routine
                </Button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="glass-card mb-6 rounded-2xl">
              <div className="flex items-center border-b border-white/10">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-caption font-medium transition-smooth hover:bg-white/5 ${
                      activeTab === tab?.id
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                    {tab?.count !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activeTab === tab?.id
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tab?.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">{renderTabContent()}</div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-3xl text-red-500 border-red-500 hover:bg-[rgba(255,144,187,0.2)]"
              >
                Log out
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserProfileDashboard;
