import mongoose from "mongoose";

const scanHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productBrand: {
      type: String,
      default: "",
    },
    productCategory: {
      type: String,
      default: "",
    },
    safetyLevel: {
      type: String,
      enum: ["safe", "moderate", "caution"],
      required: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    ingredients: [
      {
        name: {
          type: String,
          required: true,
        },
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high"],
          required: true,
        },
        purpose: {
          type: String,
          default: "",
        },
        concerns: [String],
      },
    ],
    productImages: {
      front: {
        type: String,
        default: "",
      },
      back: {
        type: String,
        default: "",
      },
    },
    scanDate: {
      type: Date,
      default: Date.now,
    },
    analysisSource: {
      type: String,
      enum: ["api", "mock"],
      default: "mock",
    },
    recommendations: [String],
    warnings: [String],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
scanHistorySchema.index({ userId: 1, scanDate: -1 });
scanHistorySchema.index({ userId: 1, safetyLevel: 1 });

export default mongoose.model("ScanHistory", scanHistorySchema);
