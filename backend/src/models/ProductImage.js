import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["google", "pexels", "fallback"],
      default: "google",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for auto cleanup
    },
  },
  { timestamps: true }
);

// Compound unique index to allow same query with different sources
productImageSchema.index({ query: 1, source: 1 }, { unique: true });

// Index for efficient queries by expiration
productImageSchema.index({ query: 1, source: 1, expiresAt: 1 });

export default mongoose.model("ProductImage", productImageSchema);
