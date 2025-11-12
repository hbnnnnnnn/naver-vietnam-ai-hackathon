import mongoose from 'mongoose';
// model is built base on this dataset https://www.kaggle.com/datasets/dominoweir/skincare-product-ingredients
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true,
    },
    thumbnail_url: {
        type: String,
        required: true
    },
    product_url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Moisturizer', 'Cleanser', 'Face mask', 'Treatment', 'Eye cream', 'Sunscreen']
    },
    timeOfDay: {
        type: String,
        enum: ['day', 'night', 'both'],
        default: 'both'
    },
    spf: {
        type: Number,
        default: 0
    },
    ingredients: [String],
    price: {
        type: Number,
        required: true
    },
    budgetTier: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    rank: {
        type: Number,
        required: true,
    },
    combination_skin: {
        type: Boolean,
        required: true
    },
    dry_skin: {
        type: Boolean,
        required: true
    },
    oily_skin: {
        type: Boolean,
        required: true
    },
    normal_skin: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });

productSchema.index({ category: 1, budgetTier: 1, timeOfDay: 1 });
productSchema.index({ combination_skin: 1, dry_skin: 1, oily_skin: 1, normal_skin: 1 });

export default mongoose.model('Product', productSchema);
