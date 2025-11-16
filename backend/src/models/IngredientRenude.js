import mongoose from 'mongoose';
// model is built based on this dataset https://www.kaggle.com/datasets/amaboh/skin-care-product-ingredients-inci-list
const ingredientRenudeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  name_normalized: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  description: String,

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
    default: ''
  }

}, { timestamps: true });

export default mongoose.model('IngredientRenude', ingredientRenudeSchema);