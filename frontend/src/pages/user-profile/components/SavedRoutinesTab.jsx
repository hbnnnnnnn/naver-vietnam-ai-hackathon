import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import ProductModal from "../../routine-recommendations/components/ProductModal";
import { getCachedImage, setCachedImage } from "../../../utils/imageCache";
import ApiService from "../../../services/api";

const SavedRoutinesTab = ({ savedRoutines = [], onRoutinesChange }) => {
  const navigate = useNavigate();
  const [selectedRoutines, setSelectedRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  useEffect(() => {
    fetchSavedRoutines();
  }, []);

  const fetchSavedRoutines = async () => {
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      const username = userProfile?.username || userProfile?.name;

      console.log("Fetching routines from database for user:", username);

      if (!username) {
        console.error("No username found");
        onRoutinesChange?.([]);
        return;
      }

      let userId;
      try {
        // Try to get user from database
        const userResponse = await ApiService.getUserByUsername(username);
        userId = userResponse.user._id;
        console.log("Found existing user:", userId);
      } catch (error) {
        // User doesn't exist, create new user
        console.log("User not found in database, creating new user...");
        const userData = {
          username: username,
          name: userProfile?.name || username,
          skinType: userProfile?.skinType || "normal",
          concerns: userProfile?.skinStatus || userProfile?.concerns || [],
        };

        const createResponse = await ApiService.createOrUpdateUser(userData);
        userId = createResponse.user._id;
        console.log("Created new user:", userId);
      }

      // Get routines from database
      const routinesResponse = await ApiService.getSavedRoutines(userId);
      const routines = routinesResponse.routines.map((routine) => ({
        ...routine,
        id: routine._id, // Add id field for frontend compatibility
      }));

      console.log("Loaded routines from database:", routines);
      onRoutinesChange?.(routines);
    } catch (error) {
      console.error("Error fetching saved routines:", error);
      onRoutinesChange?.([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectRoutine = (id) => {
    setSelectedRoutines((prev) =>
      prev?.includes(id) ? prev?.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      if (selectedRoutines.length === 0) return;

      // Delete routines from database using routine IDs directly
      await ApiService.deleteMultipleRoutines(selectedRoutines);

      // Refresh routines list
      await fetchSavedRoutines();
      setSelectedRoutines([]);
      console.log("Successfully deleted routines:", selectedRoutines);
    } catch (error) {
      console.error("Error deleting routines:", error);
      alert("Error deleting routine. Please try again.");
    }
  };

  const handleViewDetail = (routine) => {
    // Store the routine data in localStorage for the routine page to access
    localStorage.setItem("viewRoutineData", JSON.stringify(routine));

    // Navigate to routine recommendations page
    navigate("/routine");
  };

  const handleCategoryClick = async (step, routine) => {
    setSelectedCategory(step.category);
    setIsProductsLoading(true);
    setIsModalOpen(true);

    try {
      const API_URL = "http://localhost:5731";
      const response = await fetch(
        `${API_URL}/api/products?category=${encodeURIComponent(
          step.category
        )}&priceRange=${routine?.priceRange || "budget-friendly"}`
      );

      if (response.ok) {
        const data = await response.json();
        const transformedProducts = data.slice(0, 5).map((product) => ({
          ...product,
          id: product._id,
          rating: product.rating || product.rank || 0,
          image:
            product.thumbnail_url ||
            "https://images.unsplash.com/photo-1616750819456-5cdee9b85d22",
          imageAlt: `${product.brand} - ${product.name}`,
        }));
        setModalProducts(transformedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleShareRoutine = (routine) => {
    console.log("Sharing routine:", routine?.id);
    // Mock share functionality
  };

  const handleExportRoutine = (routine) => {
    console.log("Exporting routine:", routine?.id);
    // Mock export functionality
  };

  return (
    <div className="rounded-3xl space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Controls */}
          {selectedRoutines?.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-caption text-foreground">
                Selected {selectedRoutines?.length} routine
                {selectedRoutines?.length > 1 ? "s" : ""}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                iconName="Trash2"
                iconPosition="left"
              >
                Delete
              </Button>
            </div>
          )}

          {/* Routines List */}
          <div className="space-y-4">
            {savedRoutines?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    name="Star"
                    size={24}
                    className="text-muted-foreground"
                  />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  No saved routines yet
                </h3>
                <p className="text-muted-foreground font-caption mb-4">
                  Create your first routine from product analysis
                </p>
                <Button
                  variant="default"
                  onClick={() => navigate("/routine")}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Start Routine Recommendations
                </Button>
              </div>
            ) : (
              savedRoutines?.map((routine) => (
                <div
                  key={routine?.id}
                  className={`rounded-2xl glass-card p-6 transition-smooth hover:shadow-glow ${
                    selectedRoutines?.includes(routine?.id)
                      ? "ring-2 ring-primary/50"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectRoutine(routine?.id)}
                      className="mt-1 transition-smooth hover:scale-110"
                    >
                      <Icon
                        name={
                          selectedRoutines?.includes(routine?.id)
                            ? "CheckSquare"
                            : "Square"
                        }
                        size={20}
                        className={
                          selectedRoutines?.includes(routine?.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                    </button>

                    <div className="flex-1">
                      {/* Routine Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading font-semibold text-foreground mb-2">
                            {routine?.routineName ||
                              routine?.name ||
                              "Skincare Routine"}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground font-caption">
                            <div className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              <span>
                                Created:{" "}
                                {new Date(
                                  routine?.createdAt
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="Layers" size={14} />
                              <span>
                                {(routine?.morningRoutine?.steps?.length || 0) +
                                  (routine?.eveningRoutine?.steps?.length ||
                                    0) ||
                                  routine?.steps?.length ||
                                  0}{" "}
                                steps
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="User" size={14} />
                              <span>{routine?.skinType}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-xs font-caption font-medium ${
                            routine?.routineType === "complete"
                              ? "bg-gradient-to-r from-purple-100/50 to-pink-100/50 text-purple-700"
                              : "bg-gradient-to-r from-green-100/50 to-blue-100/50 text-green-700"
                          }`}
                        >
                          {routine?.routineType === "complete"
                            ? "Complete Routine"
                            : "Minimal Routine"}
                        </div>
                      </div>

                      {/* Routine Info */}
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block mb-1">
                              Type:
                            </span>
                            <p className="font-medium text-foreground capitalize">
                              {routine?.routineType === "complete"
                                ? "Complete"
                                : "Minimal"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">
                              Skin Type:
                            </span>
                            <p className="font-medium text-foreground capitalize">
                              {routine?.skinType}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">
                              Price:
                            </span>
                            <p className="font-medium text-foreground capitalize">
                              {routine?.priceRange?.replace("-", " ")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">
                              Morning:
                            </span>
                            <p className="font-medium text-foreground">
                              {routine?.morningRoutine?.steps?.length || 0}{" "}
                              steps
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">
                              Evening:
                            </span>
                            <p className="font-medium text-foreground">
                              {routine?.eveningRoutine?.steps?.length || 0}{" "}
                              steps
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end">
                        <Button
                          className="rounded-3xl shadow-glow"
                          variant="default"
                          size="sm"
                          onClick={() => handleViewDetail(routine)}
                          iconName="Eye"
                          iconPosition="left"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        category={selectedCategory}
        products={modalProducts}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        isLoading={isProductsLoading}
      />
    </div>
  );
};

export default SavedRoutinesTab;
