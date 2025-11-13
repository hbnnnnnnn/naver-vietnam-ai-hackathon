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
        required: false
    },
    product_url: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: true,
        enum: ['Moisturizer', 'Cleanser', 'Face mask', 'Treatment', 'Eye cream', 'Sunscreen']
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
    },
    sensitive_skin: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });

productSchema.index({ category: 1, price: 1, rank: 1 });
productSchema.index({ spf: 1 });
productSchema.index({ combination_skin: 1, dry_skin: 1, oily_skin: 1, normal_skin: 1, sensitive_skin: 1 });

export default mongoose.model('Product', productSchema);
