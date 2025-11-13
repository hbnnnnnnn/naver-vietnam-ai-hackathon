import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import Routine from "./src/models/Routine.js";

const mongoURI = process.env.MONGODB_URI;

const SKIN_TYPES = ['combination', 'dry', 'oily', 'normal', 'sensitive'];

const PRICE_RANGES = [
    { name: 'budget', min: 0, max: 500000 },
    { name: 'mid', min: 500000, max: 1500000 },
    { name: 'premium', min: 1500000, max: 3000000 },
    { name: 'luxury', min: 3000000, max: Infinity }
];

const MORNING_STEPS = [
    { name: 'Cleanse', category: 'Cleanser', required: true },
    { name: 'Treatment', category: 'Treatment', required: false },
    { name: 'Eye Care', category: 'Eye cream', required: false },
    { name: 'Moisturize', category: 'Moisturizer', required: true },
    { name: 'Sunscreen', category: 'Sunscreen', minSpf: 30, required: true }
];

const NIGHT_STEPS = [
    { name: 'Double Cleanse', category: 'Cleanser', required: true },
    { name: 'Treatment', category: 'Treatment', required: false },
    { name: 'Eye Care', category: 'Eye cream', required: false },
    { name: 'Moisturize', category: 'Moisturizer', required: true },
    { name: 'Night Mask', category: 'Face mask', required: false }
];

const VARIATION_STRATEGIES = [
    'minimal', 
    'complete', 
    'focus_treatment', 
    'focus_hydration', 
    'anti_aging' 
];

function getSkinFieldName(skinType) {
    return `${skinType}_skin`;
}

async function getProductsForCategory(category, skinType, priceRange, options = {}) {
    const skinField = getSkinFieldName(skinType);
    const query = {
        category: category,
        [skinField]: true,
        price: { $gte: priceRange.min, $lte: priceRange.max }
    };

    if (options.minSpf) {
        query.spf = { $gte: options.minSpf };
    }

    const products = await Product.find(query)
        .sort({ rank: 1, price: options.preferHighPrice ? -1 : 1 })
        .limit(5);

    return products;
}

async function selectProductForStep(step, skinType, priceRange, usedProducts, strategy) {
    const products = await getProductsForCategory(
        step.category,
        skinType,
        priceRange,
        { minSpf: step.minSpf }
    );

    const availableProducts = products.filter(p => !usedProducts.has(p._id.toString()));

    if (availableProducts.length === 0 && products.length > 0) {
        return products[Math.floor(Math.random() * Math.min(products.length, 3))];
    }

    if (availableProducts.length === 0) return null;

    let selectedProduct;
    switch (strategy) {
        case 'minimal':
            selectedProduct = availableProducts[0]; // Cheapest, best rank
            break;
        case 'complete':
            selectedProduct = availableProducts[Math.floor(availableProducts.length / 2)]; // Mid-range
            break;
        case 'focus_treatment':
            selectedProduct = step.category === 'Treatment' 
                ? availableProducts[availableProducts.length - 1] // Best for treatment
                : availableProducts[0];
            break;
        case 'focus_hydration':
            selectedProduct = step.category === 'Moisturizer' 
                ? availableProducts[availableProducts.length - 1] // Best for moisturizer
                : availableProducts[0];
            break;
        case 'anti_aging':
            selectedProduct = step.category === 'Eye cream' 
                ? availableProducts[availableProducts.length - 1] // Best for eye cream
                : availableProducts[0];
            break;
        default:
            selectedProduct = availableProducts[0];
    }

    return selectedProduct;
}

async function generateRoutineVariation(routineType, skinType, priceRange, strategy, usedProducts) {
    const steps = routineType === 'morning' ? MORNING_STEPS : NIGHT_STEPS;
    const selectedSteps = [];
    let totalPrice = 0;

    for (const step of steps) {
        if (strategy === 'minimal' && !step.required) continue;

        if (strategy === 'focus_treatment' && !step.required && step.category !== 'Treatment') continue;
        if (strategy === 'focus_hydration' && !step.required && step.category !== 'Moisturizer') continue;
        if (strategy === 'anti_aging' && !step.required && step.category !== 'Eye cream') continue;

        const product = await selectProductForStep(step, skinType, priceRange, usedProducts, strategy);

        if (product) {
            selectedSteps.push({
                name: step.name,
                product: product._id
            });
            totalPrice += product.price || 0;
            usedProducts.add(product._id.toString());
        } else if (step.required) {
            return null;
        }
    }

    if (selectedSteps.length === 0) return null;

    return {
        name: routineType,
        steps: selectedSteps,
        skinType: skinType,
        totalPrice: Math.round(totalPrice)
    };
}

async function generateAllRoutines() {
    const routines = [];
    const globalUsedProducts = new Set();

    console.log('Generating diverse routines...');

    for (const skinType of SKIN_TYPES) {
        console.log(`\nGenerating routines for ${skinType} skin...`);

        for (const priceRange of PRICE_RANGES) {
            console.log(`  Price range: ${priceRange.name} (${priceRange.min} - ${priceRange.max} VND)`);

            for (const strategy of VARIATION_STRATEGIES) {
                const usedInRoutineSet = new Set();

                const morningRoutine = await generateRoutineVariation(
                    'morning',
                    skinType,
                    priceRange,
                    strategy,
                    usedInRoutineSet
                );

                if (morningRoutine) {
                    routines.push(morningRoutine);
                    console.log(`    ✓ Morning routine (${strategy}): ${morningRoutine.steps.length} steps, ${morningRoutine.totalPrice} VND`);
                }

                const nightUsedSet = new Set(usedInRoutineSet);
                const nightRoutine = await generateRoutineVariation(
                    'night',
                    skinType,
                    priceRange,
                    strategy,
                    nightUsedSet
                );

                if (nightRoutine) {
                    routines.push(nightRoutine);
                    console.log(`    ✓ Night routine (${strategy}): ${nightRoutine.steps.length} steps, ${nightRoutine.totalPrice} VND`);
                }

                usedInRoutineSet.forEach(id => globalUsedProducts.add(id));
            }
        }
    }

    return { routines, uniqueProductsUsed: globalUsedProducts.size };
}

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.error('No products found! Please run seedProduct.js first.');
            process.exit(1);
        }
        console.log(`Found ${productCount} products in database`);

        await Routine.deleteMany({});
        console.log('Cleared existing routines');

        const { routines, uniqueProductsUsed } = await generateAllRoutines();

        if (routines.length > 0) {
            await Routine.insertMany(routines);
            console.log(`\n✅ Successfully seeded ${routines.length} routines`);
            console.log(`📊 Statistics:`);
            console.log(`   - Total routines: ${routines.length}`);
            console.log(`   - Skin types covered: ${SKIN_TYPES.length}`);
            console.log(`   - Price ranges: ${PRICE_RANGES.length}`);
            console.log(`   - Variation strategies: ${VARIATION_STRATEGIES.length}`);
            console.log(`   - Unique products used: ${uniqueProductsUsed}`);
            console.log(`   - Average routines per skin type: ${Math.round(routines.length / SKIN_TYPES.length)}`);

            const morningCount = routines.filter(r => r.name === 'morning').length;
            const nightCount = routines.filter(r => r.name === 'night').length;
            console.log(`   - Morning routines: ${morningCount}`);
            console.log(`   - Night routines: ${nightCount}`);

            const prices = routines.map(r => r.totalPrice);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            console.log(`   - Price range: ${minPrice} - ${maxPrice} VND`);
            console.log(`   - Average price: ${avgPrice} VND`);
        } else {
            console.log('⚠️  No routines were generated. Check your product data.');
        }

        mongoose.connection.close();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding routines:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

seed();
