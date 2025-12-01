import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ProfileHeader from "./components/ProfileHeader";
import ScanHistoryTab from "./components/ScanHistoryTab";
import SavedRoutinesTab from "./components/SavedRoutinesTab";
import ApiService from "../../services/api";

const UserProfileDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");
  const [userProfile, setUserProfile] = useState(null); // Start with null to check authentication

  const [stats, setStats] = useState({
    totalScans: 0,
    savedRoutines: 0,
    aiConsultations: 15,
    activeDays: 45,
  });

  const [scanHistory, setScanHistory] = useState([]);

  // Load scan history from localStorage on component mount
  useEffect(() => {
    loadScanHistory();
    loadSavedRoutines();

    // Listen for storage changes (if scan history is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "skincare_scan_history") {
        loadScanHistory();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadScanHistory = async () => {
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const username = userProfile?.username || userProfile?.name;

      if (!username) {
        console.warn("No username found for scan history");
        setScanHistory([]);
        return;
      }

      // Get userId from database like routine does
      try {
        const userResponse = await ApiService.getUserByUsername(username);
        const userId = userResponse.user._id;

        const response = await ApiService.getScanHistory(userId);
        const history = response.data || [];
        setScanHistory(history);

        // Update stats based on loaded history
        const totalScans = history.length;
        const safeScans = history.filter(
          (scan) => scan.safetyLevel === "safe"
        ).length;
        const moderateScans = history.filter(
          (scan) => scan.safetyLevel === "moderate"
        ).length;
        const cautionScans = history.filter(
          (scan) => scan.safetyLevel === "caution"
        ).length;
        // Calculate active days from scan dates
        const uniqueDates = new Set(
          history.map((scan) => {
            const date = new Date(scan.createdAt || scan.scanDate);
            return date.toDateString();
          })
        );
        const activeDays = uniqueDates.size;

        setStats((prevStats) => ({
          ...prevStats,
          totalScans,
          activeDays,
        }));
      } catch (error) {
        // User doesn't exist in database yet
        console.log("User not found in database, showing empty scan history");
        setScanHistory([]);
      }
    } catch (error) {
      console.error("Failed to load scan history:", error);
      setScanHistory([]);
    }
  };

  const loadSavedRoutines = async () => {
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const username = userProfile?.username || userProfile?.name;

      if (!username) {
        console.log("No username found, skipping routine load");
        setSavedRoutines([]);
        return;
      }

      try {
        // Try to get user from database
        const userResponse = await ApiService.getUserByUsername(username);
        const userId = userResponse.user._id;

        // Get routines from database
        const routinesResponse = await ApiService.getSavedRoutines(userId);
        const routines = routinesResponse.routines.map((routine) => ({
          ...routine,
          id: routine._id, // Add id field for frontend compatibility
        }));

        setSavedRoutines(routines);
        console.log("Initial load - saved routines:", routines.length);
      } catch (error) {
        // User doesn't exist in database yet - just use empty array
        console.log("User not found in database, showing empty routines");
        setSavedRoutines([]);
      }
    } catch (error) {
      console.error("Error loading saved routines:", error);
      setSavedRoutines([]);
    }
  };

  const [savedRoutines, setSavedRoutines] = useState([]);

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
    // Check authentication first
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    // Load user data from localStorage or API
    const savedLanguage = localStorage.getItem("glowlens-language") || "vi";
    if (savedLanguage !== preferences?.language) {
      setPreferences((prev) => ({ ...prev, language: savedLanguage }));
    }

    // Load user profile from localStorage
    const savedUserProfile = localStorage.getItem("userProfile");
    if (savedUserProfile) {
      const profileData = JSON.parse(savedUserProfile);
      const username = profileData.username;
      if (!username) {
        navigate("/login");
        return;
      }
      ApiService.getUserByUsername(username)
        .then((res) => {
          const dbUser = res.user;
          setUserProfile({
            username: dbUser.username,
            name: dbUser.name,
            avatar:
              dbUser.avatar ||
              "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh.jpg",
            avatarAlt: "User profile avatar",
            skinType: dbUser.skinType || "normal",
            concerns: dbUser.concerns || [],
            joinDate:
              dbUser.createdAt || new Date().toLocaleDateString("en-US"),
          });
        })
        .catch(() => {
          // If not found in DB, redirect to login
          navigate("/login");
        });
    } else {
      // No saved profile, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "history":
        return (
          <ScanHistoryTab
            scanHistory={scanHistory}
            onHistoryUpdate={loadScanHistory}
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
        return (
          <ScanHistoryTab
            scanHistory={scanHistory}
            onHistoryUpdate={loadScanHistory}
          />
        );
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
          {/* Show loading while checking authentication */}
          {!userProfile ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading profile...</p>
              </div>
            </div>
          ) : (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="relative z-40" style={{ overflow: "visible" }}>
                <ProfileHeader
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="default"
                    onClick={() => navigate("/product")}
                    iconName="Scan"
                    iconPosition="left"
                    className="rounded-3xl shadow-glow animate-glass-float w-full sm:w-auto"
                  >
                    Scan new product
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/routine")}
                    iconName="MessageCircle"
                    iconPosition="left"
                    className="rounded-3xl border hover:bg-[rgba(255,144,187,0.2)] border-black animate-glass-float w-full sm:w-auto"
                  >
                    Recommend routine
                  </Button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="glass-card mb-6 rounded-2xl overflow-hidden">
                <div className="flex items-center border-b border-white/10 overflow-x-auto scrollbar-hide">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-caption font-medium transition-smooth hover:bg-white/5 whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab?.id
                          ? "text-primary border-b-2 border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon name={tab?.icon} size={18} />
                      <span className="text-sm sm:text-base">{tab?.label}</span>
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
                <div className="p-4 sm:p-6">{renderTabContent()}</div>
              </div>

              {/* Logout Button */}
              <div className="flex justify-center sm:justify-end mb-4">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-3xl text-red-500 border-red-500 hover:bg-[rgba(255,144,187,0.2)] w-full sm:w-auto"
                >
                  Log out
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default UserProfileDashboard;
