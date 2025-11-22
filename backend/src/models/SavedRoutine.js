import mongoose from "mongoose";

const routineStepSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    timing: { type: String },
    purpose: { type: String },
    products: [
      {
        _id: { type: String },
        name: { type: String },
        brand: { type: String },
        rating: { type: Number },
        image: { type: String },
        imageAlt: { type: String },
        rank: { type: Number },
      },
    ],
    rank: { type: Number, default: 0 },
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    steps: [routineStepSchema],
  },
  { _id: false }
);

const savedRoutineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routineName: {
      type: String,
      required: true,
    },
    routineType: {
      type: String,
      required: true,
      enum: ["minimal", "complete"],
    },
    skinType: {
      type: String,
      required: true,
      enum: ["dry", "oily", "combination", "normal", "sensitive"],
    },
    priceRange: {
      type: String,
      required: true,
      enum: ["budget-friendly", "mid-range", "premium"],
    },
    uvIndex: {
      type: Number,
      min: 0,
      max: 11,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    morningRoutine: routineSchema,
    eveningRoutine: routineSchema,
  },
  { timestamps: true }
);

export default mongoose.model("SavedRoutine", savedRoutineSchema);
