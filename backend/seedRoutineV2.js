import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import Routine from "./src/models/Routine.js";

const mongoURI = process.env.MONGODB_URI;

const SKIN_TYPES = ["combination", "dry", "oily", "normal", "sensitive"];

// Dynamic price ranges - much more granular for draggable slider
const PRICE_RANGES = [
  { name: "ultra-budget", min: 0, max: 300000 },
  { name: "budget-friendly", min: 0, max: 500000 },
  { name: "affordable", min: 0, max: 800000 },
  { name: "mid-range-low", min: 0, max: 1000000 },
  { name: "mid-range", min: 0, max: 1500000 },
  { name: "mid-range-high", min: 0, max: 2000000 },
  { name: "premium-low", min: 0, max: 2500000 },
  { name: "premium", min: 0, max: 3000000 },
  { name: "luxury", min: 0, max: 4000000 },
  { name: "ultra-luxury", min: 0, max: Infinity },
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
  budgetPerProduct,
  options = {}
) {
  const skinField = getSkinFieldName(skinType);
  const query = {
    category: category,
    [skinField]: true,
  };

  if (options.minSpf) {
    query.spf = { $gte: options.minSpf };
  }

  // For lower budgets, prioritize cheaper products
  // For higher budgets, prioritize more expensive products
  let sortOrder;
  if (budgetPerProduct < 200000) {
    // Ultra budget: best rank among cheap products
    sortOrder = { price: 1, rank: -1 };
  } else if (budgetPerProduct < 500000) {
    // Budget/Mid: balanced
    sortOrder = { rank: -1, price: 1 };
  } else {
    // Premium: best rank and high price
    sortOrder = { rank: -1, price: -1 };
  }

  const products = await Product.find(query)
    .sort(sortOrder)
    .limit(50);

  return products;
}

async function selectProductsForStep(step, skinType, budgetPerProduct) {
  const products = await getProductsForCategory(
    step.category,
    skinType,
    budgetPerProduct,
    { minSpf: step.minSpf }
  );

  if (products.length === 0) return null;

  // Return 3-5 products with good rank across different price points
  const numProducts = Math.min(Math.max(3, products.length), 5);
  const selectedProducts = products.slice(0, numProducts);

  return selectedProducts.map((p) => p._id);
}

async function calculateRoutineMetrics(steps) {
  // Get all product IDs from all steps
  const allProductIds = steps.flatMap((step) => step.products);

  // Fetch all products
  const products = await Product.find({ _id: { $in: allProductIds } });

  if (products.length === 0) {
    return { totalPrice: 0, avgRank: 999 };
  }

  // For each step, calculate the average price of products in that step
  let totalPrice = 0;
  let totalRank = 0;
  let stepCount = 0;

  for (const step of steps) {
    const stepProducts = products.filter((p) =>
      step.products.some((id) => id.equals(p._id))
    );

    if (stepProducts.length > 0) {
      // Use the best (highest rank) and highest price product from each step for calculations
      const bestProduct = stepProducts.reduce((best, current) => {
        if (current.rank > best.rank) return current;
        if (current.rank === best.rank && current.price > best.price)
          return current;
        return best;
      }, stepProducts[0]);

      totalPrice += bestProduct.price;
      totalRank += bestProduct.rank;
      stepCount++;
    }
  }

  const avgRank = stepCount > 0 ? totalRank / stepCount : 0;

  return { totalPrice, avgRank };
}

async function generateRoutineVariation(
  routineType,
  skinType,
  priceRange,
  strategy
) {
  const steps = routineType === "morning" ? MORNING_STEPS : NIGHT_STEPS;
  const selectedSteps = [];

  // Estimate number of steps for this strategy
  const requiredSteps = steps.filter(s => s.required).length;
  const estimatedSteps = strategy === "minimal" ? requiredSteps :
                         strategy === "complete" ? steps.length :
                         requiredSteps + 1; // Other strategies add 1-2 optional steps

  // Calculate budget per product (distribute total budget across steps)
  const budgetPerProduct = priceRange.max / estimatedSteps;

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
      budgetPerProduct
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

  // Calculate total price and average rank BEFORE filtering
  const { totalPrice, avgRank } = await calculateRoutineMetrics(selectedSteps);

  // Only create routine if the TOTAL price is within the budget range
  // Allow some flexibility (within 120% of budget for variety)
  if (totalPrice > priceRange.max * 1.2) {
    return null;
  }

  // Map to legacy budget range for backward compatibility
  let budgetRange = "premium";
  if (totalPrice < 500000) budgetRange = "budget-friendly";
  else if (totalPrice < 1500000) budgetRange = "mid-range";

  return {
    name: routineType,
    steps: selectedSteps,
    skinType: skinType,
    strategy: strategy,
    budgetRange: budgetRange,
    totalPrice: totalPrice,
    avgRank: avgRank,
  };
}

async function generateAllRoutines() {
  const routines = [];

  console.log("Generating diverse routines with price ranges...");

  for (const skinType of SKIN_TYPES) {
    console.log(`\nGenerating routines for ${skinType} skin...`);

    for (const priceRange of PRICE_RANGES) {
      console.log(
        `  Price range: ${priceRange.name} (0 - ${
          priceRange.max === Infinity ? "∞" : priceRange.max.toLocaleString()
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
            `    ✓ Morning routine (${strategy}): ${
              morningRoutine.steps.length
            } steps, ${totalProducts} products, ${morningRoutine.totalPrice.toLocaleString()} VND`
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
            `    ✓ Night routine (${strategy}): ${
              nightRoutine.steps.length
            } steps, ${totalProducts} products, ${nightRoutine.totalPrice.toLocaleString()} VND`
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
      console.log(`   - Price ranges: ${PRICE_RANGES.length}`);
      console.log(`   - Variation strategies: ${VARIATION_STRATEGIES.length}`);

      // Price range distribution
      const priceStats = routines.reduce(
        (acc, routine) => {
          acc.min = Math.min(acc.min, routine.totalPrice);
          acc.max = Math.max(acc.max, routine.totalPrice);
          acc.total += routine.totalPrice;
          return acc;
        },
        { min: Infinity, max: 0, total: 0 }
      );

      console.log(`\n   - Price statistics:`);
      console.log(
        `     • Minimum routine price: ${priceStats.min.toLocaleString()} VND`
      );
      console.log(
        `     • Maximum routine price: ${priceStats.max.toLocaleString()} VND`
      );
      console.log(
        `     • Average routine price: ${Math.round(
          priceStats.total / routines.length
        ).toLocaleString()} VND`
      );

      // Budget range distribution
      const budgetCounts = routines.reduce((acc, routine) => {
        acc[routine.budgetRange] = (acc[routine.budgetRange] || 0) + 1;
        return acc;
      }, {});
      console.log(`\n   - Budget range distribution:`);
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
