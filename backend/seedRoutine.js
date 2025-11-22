import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import Routine from "./src/models/Routine.js";

const mongoURI = process.env.MONGODB_URI;

const SKIN_TYPES = ["combination", "dry", "oily", "normal", "sensitive"];

const PRICE_RANGES = [
  { name: "budget-friendly", min: 0, max: 500000 },
  { name: "mid-range", min: 500000, max: 1500000 },
  { name: "premium", min: 1500000, max: Infinity },
];

const MORNING_STEPS = [
  { name: "Cleanse", category: "Cleanser", required: true },
  { name: "Treatment", category: "Treatment", required: false },
  { name: "Eye Care", category: "Eye cream", required: false },
  { name: "Moisturize", category: "Moisturizer", required: true },
  { name: "Sunscreen", category: "Sunscreen", minSpf: 30, required: true },
];

const NIGHT_STEPS = [
  { name: "Double Cleanse", category: "Cleanser", required: true },
  { name: "Treatment", category: "Treatment", required: false },
  { name: "Eye Care", category: "Eye cream", required: false },
  { name: "Moisturize", category: "Moisturizer", required: true },
  { name: "Night Mask", category: "Face mask", required: false },
];

const VARIATION_STRATEGIES = [
  "minimal",
  "complete",
  "focus_treatment",
  "focus_hydration",
  "anti_aging",
];

function getSkinFieldName(skinType) {
  return `${skinType}_skin`;
}

async function getProductsForCategory(
  category,
  skinType,
  priceRange,
  options = {}
) {
  const skinField = getSkinFieldName(skinType);
  const query = {
    category: category,
    [skinField]: true,
    price: { $gte: priceRange.min, $lte: priceRange.max },
  };

  if (options.minSpf) {
    query.spf = { $gte: options.minSpf };
  }

  const products = await Product.find(query).sort({ rank: 1 }).limit(10);

  return products;
}

async function selectProductsForStep(step, skinType, priceRange, strategy) {
  const products = await getProductsForCategory(
    step.category,
    skinType,
    priceRange,
    { minSpf: step.minSpf }
  );

  if (products.length === 0) return null;

  const numProducts = Math.min(Math.max(3, products.length), 5);
  const selectedProducts = products.slice(0, numProducts);

  return selectedProducts.map((p) => p._id);
}

async function generateRoutineVariation(
  routineType,
  skinType,
  priceRange,
  strategy
) {
  const steps = routineType === "morning" ? MORNING_STEPS : NIGHT_STEPS;
  const selectedSteps = [];

  for (const step of steps) {
    if (strategy === "minimal" && !step.required) continue;

    if (
      strategy === "focus_treatment" &&
      !step.required &&
      step.category !== "Treatment"
    )
      continue;
    if (
      strategy === "focus_hydration" &&
      !step.required &&
      step.category !== "Moisturizer"
    )
      continue;
    if (
      strategy === "anti_aging" &&
      !step.required &&
      step.category !== "Eye cream"
    )
      continue;

    const productIds = await selectProductsForStep(
      step,
      skinType,
      priceRange,
      strategy
    );

    if (productIds && productIds.length > 0) {
      selectedSteps.push({
        name: step.name,
        products: productIds,
      });
    } else if (step.required) {
      return null;
    }
  }

  if (selectedSteps.length === 0) return null;

  return {
    name: routineType,
    steps: selectedSteps,
    skinType: skinType,
    strategy: strategy,
    budgetRange: priceRange.name,
  };
}

async function generateAllRoutines() {
  const routines = [];

  console.log("Generating diverse routines...");

  for (const skinType of SKIN_TYPES) {
    console.log(`\nGenerating routines for ${skinType} skin...`);

    for (const priceRange of PRICE_RANGES) {
      console.log(
        `  Budget range: ${priceRange.name} (${priceRange.min} - ${
          priceRange.max === Infinity ? "∞" : priceRange.max
        } VND)`
      );

      for (const strategy of VARIATION_STRATEGIES) {
        const morningRoutine = await generateRoutineVariation(
          "morning",
          skinType,
          priceRange,
          strategy
        );

        if (morningRoutine) {
          routines.push(morningRoutine);
          const totalProducts = morningRoutine.steps.reduce(
            (sum, step) => sum + step.products.length,
            0
          );
          console.log(
            `    ✓ Morning routine (${strategy}): ${morningRoutine.steps.length} steps, ${totalProducts} products recommended`
          );
        }

        const nightRoutine = await generateRoutineVariation(
          "night",
          skinType,
          priceRange,
          strategy
        );

        if (nightRoutine) {
          routines.push(nightRoutine);
          const totalProducts = nightRoutine.steps.reduce(
            (sum, step) => sum + step.products.length,
            0
          );
          console.log(
            `    ✓ Night routine (${strategy}): ${nightRoutine.steps.length} steps, ${totalProducts} products recommended`
          );
        }
      }
    }
  }

  return { routines };
}

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.error("No products found! Please run seedProduct.js first.");
      process.exit(1);
    }
    console.log(`Found ${productCount} products in database`);

    await Routine.deleteMany({});
    console.log("Cleared existing routines");

    const { routines } = await generateAllRoutines();

    if (routines.length > 0) {
      await Routine.insertMany(routines);
      console.log(`\n✅ Successfully seeded ${routines.length} routines`);
      console.log(`📊 Statistics:`);
      console.log(`   - Total routines: ${routines.length}`);
      console.log(`   - Skin types covered: ${SKIN_TYPES.length}`);
      console.log(`   - Budget ranges: ${PRICE_RANGES.length}`);
      console.log(`   - Variation strategies: ${VARIATION_STRATEGIES.length}`);
      // ...existing code...

      // Budget range distribution
      const budgetCounts = PRICE_RANGES.reduce((acc, range) => {
        acc[range.name] = routines.filter(
          (r) => r.budgetRange === range.name
        ).length;
        return acc;
      }, {});
      console.log(`   - Budget range distribution:`);
      Object.entries(budgetCounts).forEach(([range, count]) => {
        console.log(`     • ${range}: ${count} routines`);
      });
    } else {
      console.log("⚠️  No routines were generated. Check your product data.");
    }

    mongoose.connection.close();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding routines:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

seed();
