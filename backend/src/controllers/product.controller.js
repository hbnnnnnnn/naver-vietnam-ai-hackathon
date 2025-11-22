import Product from "../models/Product.js";
import { skinFieldMap } from "../utils/dataParser.js";

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      spf,
      ingredients,
      combination_skin,
      dry_skin,
      oily_skin,
      normal_skin,
      rank,
    } = req.body;

    const newProduct = new Product({
      name,
      brand,
      category,
      price,
      spf: spf || 0,
      ingredients: ingredients || [],
      combination_skin: Boolean(combination_skin),
      dry_skin: Boolean(dry_skin),
      oily_skin: Boolean(oily_skin),
      normal_skin: Boolean(normal_skin),
      sensitive_skin: Boolean(sensitive_skin),
      rank,
    });

    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
};

export const addProductThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const { thumbnail_url } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.thumbnail_url = thumbnail_url;
    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Error updating product thumbnail",
      error: error.message,
    });
  }
};

export const addProductUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_url } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.product_url = product_url;
    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product url", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving product", error: error.message });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

export const listProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listing products", error: error.message });
  }
};

export const getProductsByUVIndex = async (req, res) => {
  try {
    const { uvIndex, skinType, priceRange } = req.query;
    if (uvIndex === undefined) {
      return res.status(400).json({ message: "UV Index is required" });
    }
    if (!skinType) {
      return res.status(400).json({ message: "skinType is required" });
    }

    const skinField = skinFieldMap[skinType.toLowerCase()];
    if (!skinField) {
      return res.status(400).json({
        message:
          "Invalid skin type. Must be one of: dry, oily, combination, normal, sensitive",
      });
    }

    let query = {};
    if (uvIndex >= 3) {
      query = { category: "Sunscreen", spf: { $gte: 30 }, [skinField]: true };
    } else {
      query = { category: "Sunscreen", [skinField]: true };
    }

    if (priceRange) {
      if (priceRange === "budget-friendly") {
        query.price = { $lte: 500000 };
      } else if (priceRange === "mid-range") {
        query.price = { $gte: 500000, $lte: 1500000 };
      } else if (priceRange === "premium") {
        query.price = { $gte: 1500000 };
      }
    }

    let products = await Product.find(query).sort({ rank: 1 });

    // Filter out products with missing name/brand
    products = products.filter((p) => p.name && p.brand);

    res.status(200).json(products);
  } catch (error) {
    console.error("Error in getProductsByUVIndex:", error);
    res.status(500).json({
      message: "Error retrieving products by UV index",
      error: error.message,
    });
  }
};

export const getProductsByUserSkinType = async (req, res) => {
  try {
    const { skinType } = req.query;
    if (!skinType) {
      return res.status(400).json({ message: "Skin type is required" });
    }

    const field = skinFieldMap[skinType.toLowerCase()];
    if (!field) {
      return res.status(400).json({ message: "Invalid skin type" });
    }

    const query = { [field]: true };
    const products = await Product.find(query).sort({ rank: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving products by skin type",
      error: error.message,
    });
  }
};
