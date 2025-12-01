import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import Routine from "./src/models/Routine.js";

const mongoURI = process.env.MONGODB_URI;
const SKIN_TYPES = ["combination", "dry", "oily", "normal", "sensitive"];

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

function getSkinFieldName(t) { return `${t}_skin`; }

const seenSignatures = new Set();

function getRoutineSignature(r) {
  const steps = r.steps.map(s =>
    `${s.name}:${s.products.sort().join(",")}`
  ).sort().join("|");
  return `${r.skinType}|${r.name}|${r.strategy}|${r.priceBracket}|${steps}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Discover real price brackets from current product database
// ─────────────────────────────────────────────────────────────────────────────
async function discoverPriceBrackets() {
  console.log("Analyzing price distribution...");
  const stats = await Product.aggregate([
    {
      $match: {
        $or: SKIN_TYPES.map(t => ({ [getSkinFieldName(t)]: true }))
      }
    },
    { $group: { _id: null, prices: { $push: "$price" } } }
  ]);

  const prices = stats[0]?.prices?.sort((a, b) => a - b) || [];
  const total = prices.length;

  const brackets = [
    { name: "budget",        p: 30 },
    { name: "affordable",    p: 50 },
    { name: "mid-range",     p: 70 },
    { name: "premium",       p: 85 },
    { name: "luxury",        p: 97 },
    { name: "ultra-luxury",  p: 100 },
  ];

  return brackets.map(b => ({
    name: b.name,
    maxPerProduct: b.p === 100 ? Infinity : prices[Math.floor(total * b.p / 100)],
    percentile: b.p
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Generate one routine
// ─────────────────────────────────────────────────────────────────────────────
async function generateRoutine(type, skinType, bracket, strategy) {
  const stepsDef = type === "morning" ? MORNING_STEPS : NIGHT_STEPS;
  const selectedSteps = [];

  for (const step of stepsDef) {
    // Strategy filtering (your logic stays 100% intact)
    if (strategy === "minimal" && !step.required) continue;
    if (strategy === "focus_treatment" && !step.required && step.category !== "Treatment") continue;
    if (strategy === "focus_hydration" && !step.required && step.category !== "Moisturizer") continue;
    if (strategy === "anti_aging" && !step.required && step.category !== "Eye cream") continue;
    if (strategy === "complete" && step.name === "Night Mask") ; // always include for complete

    const query = {
      category: step.category,
      [getSkinFieldName(skinType)]: true,
      price: { $lte: bracket.maxPerProduct },
    };
    if (step.minSpf) query.spf = { $gte: step.minSpf };

    let products = await Product.find(query)
      .sort({ rank: -1, price: -1 })
      .limit(12)
      .lean();

    if (products.length === 0) {
      if (step.required) return null;
      continue;
    }

    // Slight randomness so we don’t get the exact same top 5 every time
    const take = 4 + Math.floor(Math.random() * 3);
    products = products.slice(0, take);

    selectedSteps.push({
      name: step.name,
      category: step.category,
      products: products.map(p => p._id),
    });
  }

  // Require at least 2 steps for a valid routine (minimal night has 2 required steps)
  if (selectedSteps.length < 2) return null;

  // Calculate total price and avg rank
  let totalPrice = 0;
  let totalRank = 0;

  for (const step of selectedSteps) {
    const stepProducts = await Product.find({ _id: { $in: step.products } }).lean();
    const maxPrice = Math.max(...stepProducts.map(p => p.price || 0));
    const maxRank = Math.max(...stepProducts.map(p => p.rank || 0));
    totalPrice += maxPrice;
    totalRank += maxRank;
  }

  const routine = {
    skinType,
    name: type,
    strategy,
    priceBracket: bracket.name,
    maxPricePerProduct: bracket.maxPerProduct,
    totalPrice,
    steps: selectedSteps,
    totalProducts: selectedSteps.reduce((a, s) => a + s.products.length, 0),
    avgRank: totalRank / selectedSteps.length,
    createdAt: new Date(),
  };

  const sig = getRoutineSignature(routine);
  if (seenSignatures.has(sig)) return null;
  seenSignatures.add(sig);

  return routine;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Main seeding
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB");

  const productCount = await Product.countDocuments();
  console.log(`Found ${productCount} products`);

  await Routine.deleteMany({});
  seenSignatures.clear();

  const brackets = await discoverPriceBrackets();
  console.log("Discovered price brackets:", brackets.map(b => `${b.name}: ≤ ${b.maxPerProduct.toLocaleString()}đ`).join(" | "));

  const allRoutines = [];

  for (const skinType of SKIN_TYPES) {
    console.log(`\n${skinType.toUpperCase()} skin`);
    for (const bracket of brackets) {
      console.log(`  ${bracket.name} (≤ ${bracket.maxPerProduct === Infinity ? "∞" : bracket.maxPerProduct.toLocaleString()}đ)`);
      let generatedThisBracket = 0;

      for (const strategy of VARIATION_STRATEGIES) {
        for (const type of ["morning", "night"]) {
          // Try up to 5 times to get a unique routine for this combo
          for (let attempt = 0; attempt < 5; attempt++) {
            const r = await generateRoutine(type, skinType, bracket, strategy);
            if (r) {
              allRoutines.push(r);
              generatedThisBracket++;
              break;
            }
          }
        }
      }
      console.log(`    → ${generatedThisBracket} unique routines`);
    }
  }

  if (allRoutines.length > 0) {
    await Routine.insertMany(allRoutines);
    console.log(`\nSUCCESS: Successfully seeded ${allRoutines.length} unique, data-driven routines`);
  } else {
    console.log("No routines generated – check product data");
  }

  await mongoose.connection.close();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});