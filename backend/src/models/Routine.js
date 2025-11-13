import mongoose from 'mongoose';

const routineStepSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
});

const routineSchema = new mongoose.Schema({
    name: { type: String, enum: ['morning', 'night'], required: true },
    steps: [routineStepSchema],
    skinType: { type: String, enum: ['combination', 'dry', 'oily', 'normal', 'sensitive'], required: true },
    totalPrice: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Routine', routineSchema);
