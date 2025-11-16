import mongoose from "mongoose";

// model is built based on AI generated ingredient information
const ingredientAISchema = new mongoose.Schema({
    name: {
      type: String,
      required: false,
      index: true
    },
    description: {
      type: String,
      required: false,
      default: ''
    },
    benefits: {
        type: [String],
        default: []
    },
    good_for: {
        type: [String],
        default: []
    },
    risk_level: {
        type: String,
        enum: ['No-risk', 'Low-risk', 'Moderate-risk', 'High-risk', 'Unknown'],
        default: 'Unknown'
    },
    reason: {
        type: String,
        required: false,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model("IngredientAI", ingredientAISchema);
