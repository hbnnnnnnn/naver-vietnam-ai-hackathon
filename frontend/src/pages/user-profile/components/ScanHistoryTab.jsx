import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import ApiService from "../../../services/api";

const ScanHistoryTab = ({ scanHistory, onHistoryUpdate }) => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState("date");

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev?.includes(id) ? prev?.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems?.length === scanHistory?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(scanHistory?.map((item) => item?.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      if (!userProfile.id) {
        console.warn("No user ID found for delete operation");
        return;
      }

      await ApiService.deleteMultipleScanHistory(userProfile.id, selectedItems);
      if (onHistoryUpdate) {
        onHistoryUpdate(); // Refresh the history in parent component
      }
      setSelectedItems([]);
      console.log("Deleted items:", selectedItems);
    } catch (error) {
      console.error("Failed to delete scan items:", error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử quét?")) {
      try {
        const userProfile = JSON.parse(
          localStorage.getItem("userProfile") || "{}"
        );
        if (!userProfile.id) {
          console.warn("No user ID found for clear operation");
          return;
        }

        // Delete all scan history by getting all scan IDs
        const allScanIds = scanHistory.map((scan) => scan.id || scan._id);
        if (allScanIds.length > 0) {
          await ApiService.deleteMultipleScanHistory(
            userProfile.id,
            allScanIds
          );
        }

        if (onHistoryUpdate) {
          onHistoryUpdate(); // Refresh the history in parent component
        }
        setSelectedItems([]);
      } catch (error) {
        console.error("Failed to clear all scan history:", error);
      }
    }
  };

  const getSafetyColor = (safety) => {
    switch (safety) {
      case "safe":
        return "text-success";
      case "moderate":
      case "neutral":
        return "text-warning";
      case "caution":
      case "risky":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getSafetyBg = (safety) => {
    switch (safety) {
      case "safe":
        return "bg-success/10";
      case "moderate":
      case "neutral":
        return "bg-warning/10";
      case "caution":
      case "risky":
        return "bg-destructive/10";
      default:
        return "bg-muted/10";
    }
  };

  const sortedHistory = [...scanHistory]?.sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.scanDate) - new Date(a.scanDate);
    } else if (sortBy === "name") {
      return a?.productName?.localeCompare(b?.productName);
    } else if (sortBy === "safety") {
      const safetyOrder = { safe: 0, neutral: 1, risky: 2 };
      return safetyOrder?.[a?.safetyLevel] - safetyOrder?.[b?.safetyLevel];
    }
    return 0;
  });

  return (
    <div className="rounded-3xl space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            iconName={
              selectedItems?.length === scanHistory?.length
                ? "CheckSquare"
                : "Square"
            }
            iconPosition="left"
            className="text-sm"
          >
            {selectedItems?.length === scanHistory?.length
              ? "Deselect all"
              : "Select all"}
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground font-caption whitespace-nowrap">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value)}
            className="bg-background border border-border rounded px-2 py-1 text-sm font-caption focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial"
          >
            <option value="date">Date</option>
            <option value="safety">Safety Level</option>
            <option value="name">Product Name</option>
          </select>
        </div>
      </div>

      {/* Delete Controls */}
      {selectedItems?.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg mb-4">
          <span className="text-sm font-caption text-foreground">
            Selected {selectedItems?.length} scan
            {selectedItems?.length > 1 ? "s" : ""}
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

      {/* History List */}
      <div className="space-y-3">
        {sortedHistory?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Scan" size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-2">
              No scan history
            </h3>
            <p className="text-muted-foreground font-caption mb-4">
              Start scanning your first product
            </p>
            <Button
              variant="default"
              onClick={() => navigate("/product")}
              iconName="Plus"
              iconPosition="left"
            >
              Scan new product
            </Button>
          </div>
        ) : (
          sortedHistory?.map((item) => (
            <div
              key={item?._id || item?.id}
              className={`rounded-2xl glass-card p-3 sm:p-4 transition-smooth hover:shadow-glow ${
                selectedItems?.includes(item?._id || item?.id)
                  ? "ring-2 ring-primary/50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleSelectItem(item?._id || item?.id)}
                  className="mt-1 transition-smooth hover:scale-110 flex-shrink-0"
                >
                  <Icon
                    name={
                      selectedItems?.includes(item?._id || item?.id)
                        ? "CheckSquare"
                        : "Square"
                    }
                    size={20}
                    className={
                      selectedItems?.includes(item?._id || item?.id)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  />
                </button>

                {/* Product Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  <Image
                    src={
                      item?.productImages?.front ||
                      "/assets/images/placeholder.png"
                    }
                    alt={`${item?.productName} product image`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-semibold text-foreground truncate text-sm sm:text-base">
                        {item?.productName}
                      </h4>
                      {item?.productBrand && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-caption truncate">
                          {item?.productBrand}
                        </p>
                      )}
                    </div>

                    <div
                      className={`px-2 py-1 rounded-full text-xs font-caption font-medium whitespace-nowrap flex-shrink-0 ${getSafetyBg(
                        item?.safetyLevel
                      )} ${getSafetyColor(item?.safetyLevel)}`}
                    >
                      {item?.safetyLevel === "safe" && "Safe"}
                      {(item?.safetyLevel === "moderate" ||
                        item?.safetyLevel === "neutral") &&
                        "Moderate"}
                      {(item?.safetyLevel === "caution" ||
                        item?.safetyLevel === "risky") &&
                        "Caution"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground font-caption">
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        <span className="hidden sm:inline">
                          {formatDate(item?.createdAt || item?.scanDate)}
                        </span>
                        <span className="sm:hidden">
                          {formatDate(item?.createdAt || item?.scanDate)
                            .split("/")
                            .slice(0, 2)
                            .join("/")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>
                          {formatTime(item?.createdAt || item?.scanDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          navigate("/product", {
                            state: {
                              analysisResults: item?.fullAnalysis,
                              uploadedImages: {
                                front: item?.productImages?.front || null,
                                back: item?.productImages?.back || null,
                              },
                              showResults: true,
                              fromHistory: true,
                              skipUpload: true,
                            },
                            replace: true,
                          });
                        }}
                        iconName="Eye"
                        iconPosition="left"
                        className="bg-ring rounded-3xl text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">View details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScanHistoryTab;
