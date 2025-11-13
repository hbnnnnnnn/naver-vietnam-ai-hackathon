import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import fs from "fs";
import { parse } from "csv-parse/sync";

const mongoURI = process.env.MONGODB_URI;
const USD_TO_VND = 26300;

function extractSPF(name) {
    const spfMatch = name.match(/SPF\s*(\d+)/i);
    return spfMatch ? parseInt(spfMatch[1]) : 0;
}

function normalizeCategory(category) {
    const categoryMap = {
        'Moisturizer': 'Moisturizer',
        'Cleanser': 'Cleanser',
        'Face Mask': 'Face mask',
        'Face mask': 'Face mask',
        'Treatment': 'Treatment',
        'Eye Cream': 'Eye cream',
        'Eye cream': 'Eye cream',
        'Sunscreen': 'Sunscreen',
        'Sun Protection': 'Sunscreen',
        'Sun protect': 'Sunscreen'
    };
    return categoryMap[category] || category;
}

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const rawData = fs.readFileSync('./seedData/cosmetic_p.csv', 'utf-8');
        const products = parse(rawData, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true // Handle BOM character
        });

        const cleaned = products.map(item => {
            const priceUSD = parseFloat(item.price) || 0;
            const priceVND = Math.round(priceUSD * USD_TO_VND);

            return {
                name: item.name.trim(),
                brand: item.brand.trim(),
                category: normalizeCategory(item.Label.trim()),
                spf: extractSPF(item.name),
                ingredients: item.ingredients.split(',').map(ing => ing.trim()),
                price: priceVND,
                rank: parseFloat(item.rank) || 0,
                combination_skin: item.Combination === '1',
                dry_skin: item.Dry === '1',
                oily_skin: item.Oily === '1',
                normal_skin: item.Normal === '1',
                sensitive_skin: item.Sensitive === '1'
            };
        });

        await Product.deleteMany({});
        console.log('Cleared existing products');

        await Product.insertMany(cleaned);
        console.log(`Seeded ${cleaned.length} products successfully`);

        mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
