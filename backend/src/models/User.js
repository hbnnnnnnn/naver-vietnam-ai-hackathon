import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  skinType: {
    type: String,
    required: true,
    enum: ['dry', 'oily', 'combination', 'normal']
  },
  concerns: [String], 
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);