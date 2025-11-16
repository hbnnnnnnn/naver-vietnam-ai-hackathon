import mongoose from "mongoose";
// model is built based on this dataset https://web.archive.org/web/20220926233955/https://data.europa.eu/data/datasets/cosmetic-ingredient-database-ingredients-and-fragrance-inventory?locale=en
const ingredientCosingSchema = new mongoose.Schema({
  inci_name: {
    type: String,
    required: true,
  },
  inci_normalized: {
    type: String,
    required: true,
    index: true
  },
  functions: [{
    primary: { type: String, required: true },
    subtype: { type: String }
  }],

}, { timestamps: true });

export default mongoose.model("IngredientCosing", ingredientCosingSchema);