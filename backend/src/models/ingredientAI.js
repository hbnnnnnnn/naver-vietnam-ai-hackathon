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
        enum: ['oily', 'dry', 'combination', 'sensitive', 'normal'
            ,"acne", "aging", "pigmentation", "sensitivity", "oiliness", "dryness"
        ], 
        default: []
    },
    risk_level: {
        type: String,
        enum: ['no-risk', 'low-risk', 'moderate-risk', 'high-risk', 'unknown'],
        default: 'unknown'
    },
    reason: {
        type: String,
        required: false,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model("IngredientAI", ingredientAISchema);
