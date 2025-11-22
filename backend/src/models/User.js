import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    skinType: {
      type: String,
      required: true,
      enum: ["dry", "oily", "combination", "normal", "sensitive"],
    },
    concerns: [String],
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
