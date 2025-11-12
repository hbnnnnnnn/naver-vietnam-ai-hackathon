import mongoose from 'mongoose';

// Individual step in the routine
const routineStepSchema = new mongoose.Schema({
    stepOrder: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'sunscreen', 'eye-cream', 'treatment', 'mask', 'exfoliator']
    },
    isOptional: {
        type: Boolean,
        default: false
    },
    description: {
        type: String
    },
    // UV-based requirements for this step
    requiredMinSPF: {
        type: Number,
        default: 0
    }
});

const routineTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },

    // Matching criteria - templates match user profiles
    skinTypes: [{
        type: String,
        enum: ['dry', 'oily', 'combination', 'normal']
    }],
    concerns: [String], // e.g., ['acne', 'aging', 'dark-spots']
    budgetTier: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    routineType: {
        type: String,
        required: true,
        enum: ['day', 'night']
    },
    complexity: {
        type: String,
        enum: ['minimalist', 'full'],
        default: 'full'
    },

    // The actual steps in the routine
    steps: [routineStepSchema],

    // UV-based rules for day routines (automatically adjust sunscreen requirements)
    uvRules: {
        low: {
            minSPF: { type: Number, default: 15 },
            recommendations: [String]
        },
        moderate: {
            minSPF: { type: Number, default: 30 },
            recommendations: [String]
        },
        high: {
            minSPF: { type: Number, default: 50 },
            recommendations: [String]
        },
        veryHigh: {
            minSPF: { type: Number, default: 50 },
            recommendations: [String]
        },
        extreme: {
            minSPF: { type: Number, default: 50 },
            recommendations: [String]
        }
    },

    // Optional: Track template usage
    usageCount: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

// Indexes for efficient querying during routine generation
routineTemplateSchema.index({ skinTypes: 1, budgetTier: 1, routineType: 1 });
routineTemplateSchema.index({ complexity: 1, budgetTier: 1 });

export default mongoose.model('RoutineTemplate', routineTemplateSchema);