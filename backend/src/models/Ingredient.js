import mongoose from 'mongoose';
// model is built based on this dataset https://www.kaggle.com/datasets/amaboh/skin-care-product-ingredients-inci-list
const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    definition: {
        type: String,
        required: true
    },
    benefits: [String],
    skin_types: [String],
    good_for: [String],
    avoid: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Ingredient', ingredientSchema);
