import mongoose from "mongoose";
import Product from "../models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const productCount = await Product.countDocuments();
    console.log(`Total products in database: ${productCount}`);

    if (productCount > 0) {
      const sampleProducts = await Product.find().limit(5);
      console.log("\nSample products:");
      sampleProducts.forEach((product, index) => {
        console.log(
          `${index + 1}. Name: ${product.name || "MISSING"}, Brand: ${
            product.brand || "MISSING"
          }`
        );
      });

      // Check for products with missing name/brand
      const missingName = await Product.countDocuments({
        $or: [{ name: null }, { name: undefined }, { name: "" }],
      });
      const missingBrand = await Product.countDocuments({
        $or: [{ brand: null }, { brand: undefined }, { brand: "" }],
      });

      console.log(`\nProducts with missing name: ${missingName}`);
      console.log(`Products with missing brand: ${missingBrand}`);
    }
  } catch (error) {
    console.error("Error checking products:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkProducts();
