import 'dotenv/config';
import mongoose from 'mongoose';
import IngredientAI from '../models/ingredientAI.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// MongoDB connection
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-app';

/**
 * Initialize IngredientAI collection with proper indexes
 */
async function initIngredientAI() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'ingredientais' }).toArray();
    
    if (collections.length === 0) {
      console.log('IngredientAI collection does not exist. Creating...');
    } else {
      console.log('IngredientAI collection already exists.');
    }

    // Ensure indexes are created
    console.log('Creating/verifying indexes...');
    await IngredientAI.createIndexes();
    console.log('Indexes created successfully');

    // Display current state
    const count = await IngredientAI.countDocuments();
    console.log(`\nCurrent IngredientAI collection stats:`);
    console.log(`Total documents: ${count}`);

    // List indexes
    const indexes = await IngredientAI.collection.getIndexes();
    console.log(`\n  Indexes:`);
    Object.keys(indexes).forEach(indexName => {
      console.log(`- ${indexName}: ${JSON.stringify(indexes[indexName].key)}`);
    });

    console.log('\nIngredientAI collection initialized successfully!');
    console.log('\nThis collection will be populated dynamically when:');
    console.log('  - AI generates new ingredient information');
    console.log('  - Ingredients not found in Cosing/Renude datasets are analyzed');

  } catch (error) {
    console.error('Error initializing IngredientAI collection:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the initialization function
initIngredientAI();
