import Product from "../models/Product.js";
import Routine from "../models/Routine.js";
import { skinFieldMap } from "../utils/dataParser.js";

const morningSteps = [
    { name: 'Cleanse', category: 'Cleanser' },
    { name: 'Serum', category: 'Treatment' },
    { name: 'Moisturize', category: 'Moisturizer' },
    { name: 'Sunscreen', category: 'Sunscreen', minSpf: 30 }
];

const nightSteps = [
    { name: 'Double Cleanse', category: 'Cleanser' },
    { name: 'Treat', category: 'Treatment' },
    { name: 'Eye Cream', category: 'Eye cream' },
    { name: 'Moisturize', category: 'Moisturizer' },
    { name: 'Optional Mask', category: 'Face mask' }
];

async function selectProductsForSteps(steps, field) {
    const selected = [];

    for (const step of steps) {
        const query = { category: step.category, [field]: true };

        if (step.minSpf) query.spf = { $gte: step.minSpf };

        const product = await Product.findOne(query).sort({ rank: -1 });
        if (product) {
            selected.push({
                name: step.name,
                product: product._id 
            });
        }
    }

    return selected;
}

export async function generateRoutine(skinType) {
    const normalizedSkinType = skinType.toLowerCase();
    const field = skinFieldMap[normalizedSkinType];

    if (!field) {
        throw new Error(`Invalid skin type: ${skinType}. Must be one of: dry, oily, combination, normal, sensitive.`);
    }

    const morningRoutineSteps = await selectProductsForSteps(morningSteps, field);

    const nightRoutineSteps = await selectProductsForSteps(nightSteps, field);

    const morningProducts = await Product.find({
        _id: { $in: morningRoutineSteps.map(s => s.product) }
    });
    const nightProducts = await Product.find({
        _id: { $in: nightRoutineSteps.map(s => s.product) }
    });

    const totalMorning = morningProducts.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalNight = nightProducts.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
        morning: {
            steps: morningRoutineSteps,
            skinType: normalizedSkinType,
            totalPrice: totalMorning
        },
        night: {
            steps: nightRoutineSteps,
            skinType: normalizedSkinType,
            totalPrice: totalNight
        }
    };
}
