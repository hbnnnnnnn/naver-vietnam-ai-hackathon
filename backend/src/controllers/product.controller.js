import Product from "../models/Product";

export const addProduct = async (req, res) => {
    try {
        const { name, brand, category, price, spf, ingredients, combination_skin, dry_skin, oily_skin, normal_skin, rank } = req.body;
        
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
            rank
        });
        
        const savedProduct = await newProduct.save();
        res.status(200).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
}

export const addProductThumbnail = async (req, res) => {
    try {
        const { id } = req.params;
        const { thumbnail_url } = req.body;
        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.thumbnail_url = thumbnail_url;
        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product thumbnail', error: error.message });
    }
}

export const addProductUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_url } = req.body;
        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.product_url = product_url;
        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product url', error: error.message });
    }
}

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving product', error: error.message });
    }
}

export const deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
}

export const listProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error listing products', error: error.message });
    }
}

export const getProductsByUVIndex = async (req, res) => {
    try {
        const { uvIndex } = req.query;
        if (uvIndex === undefined) {
            return res.status(400).json({ message: 'UV Index is required' });
        }

        let query = {};
        if (uvIndex >= 3) {
            query = { category: 'Sunscreen', spf: { $gte: 30 } };
        } else {
            query = { category: 'Sunscreen' };
        }

        const products = await Product.find(query).sort({ rank: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products by UV index', error: error.message });
    }
}

export const getProductsByUserSkinType = async (req, res) => {
    try {
        const { skinType } = req.query;
        if (!skinType) {
            return res.status(400).json({ message: 'Skin type is required' });
        }
        
        const skinFieldMap = {
            'combination': 'combination_skin',
            'dry': 'dry_skin',
            'oily': 'oily_skin',
            'normal': 'normal_skin',
            'sensitive': 'sensitive_skin'
        };
        
        const field = skinFieldMap[skinType.toLowerCase()];
        if (!field) {
            return res.status(400).json({ message: 'Invalid skin type' });
        }

        const query = { [field]: true };
        const products = await Product.find(query).sort({ rank: 1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products by skin type', error: error.message });
    }
}
