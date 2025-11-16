import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import IngredientCosing from '../models/ingredientCosing.js';
import { parseAndGroupFunctions } from "./../utils/parseAndGroupFunctions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-app';

function normalizeInciDisplayName(inci) {
  if (!inci) return "";

  const trimmed = inci.trim().replace(/\s+/g, " ");

  // Check if the entire INCI string was all caps originally
  const isAllCaps = /^[^a-z]+$/.test(trimmed);

  return trimmed
    // Tokenize while preserving (), /, -
    .split(/(\s+|\/|\(|\)|-)/)
    .map(token => {
      if (!token.trim()) return token;

      // Preserve delimiters
      if (["/", "(", ")", "-"].includes(token)) return token;

      // Preserve REAL acronyms (2–5 uppercase letters max)
      if (/^(PEG|PPG|VA|AHA|BHT|EDTA|DNA|RNA|MEA|DEA|TEA|PVP|IPDI|TDI)\d*$/.test(token)) {
        return token; 
      }

      // Fully uppercase? Convert to proper capitalization
      if (isAllCaps || /^[A-Z]+$/.test(token)) {
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }

      // Already mixed case → leave mostly as is, just ensure first letter capital
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join("");
}

function normalizeInciForSearch(inci) {
  if (!inci) return '';
  return inci.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Seed COSING ingredients from CSV file
 */
async function seedCosingIngredients() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing IngredientCosing collection...');
    await IngredientCosing.deleteMany({});
    console.log('Existing data cleared');

    // Path to CSV file
    const csvFilePath = path.join(__dirname, '../../data/cosing_ingredients.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    console.log(`Reading CSV file from: ${csvFilePath}`);

    const ingredients = [];
    const errors = [];
    let lineNumber = 0;

    // Read and parse CSV
    const stream = fs.createReadStream(csvFilePath)
      .pipe(csvParser());

    for await (const row of stream) {
      lineNumber++;
      
      try {
        const inciName = row['INCI name']?.trim();
        
        // Skip rows without INCI name
        if (!inciName) {
        //   console.log(`Skipping row ${lineNumber}: Missing INCI name`);
          continue;
        }

        const ingredient = {
            inci_name: normalizeInciDisplayName(inciName),     // user-facing
            inci_normalized: normalizeInciForSearch(inciName), // lowercase + search-friendly
            functions: parseAndGroupFunctions(row["Function"])         // nice title case
        };

        ingredients.push(ingredient);

        if (lineNumber <= 5)
            console.log(`Parsed line ${lineNumber}:`, ingredient);

        // Batch insert every 500 records
        if (ingredients.length >= 500) {
          await IngredientCosing.insertMany(ingredients, { ordered: false });
          console.log(`Inserted ${ingredients.length} ingredients (total processed: ${lineNumber})`);
          ingredients.length = 0; // Clear array
        }

      } catch (error) {
        errors.push({ line: lineNumber, error: error.message, row });
        console.error(`Error processing line ${lineNumber}:`, error.message);
      }
    }

    // Insert remaining ingredients
    if (ingredients.length > 0) {
      await IngredientCosing.insertMany(ingredients, { ordered: false });
      console.log(`Inserted final batch of ${ingredients.length} ingredients`);
    }

    // Get final count
    const totalCount = await IngredientCosing.countDocuments();
    
    console.log('\n=== Seeding Complete ===');
    console.log(`Total ingredients in database: ${totalCount}`);
    console.log(`Total lines processed: ${lineNumber}`);
    console.log(`Errors encountered: ${errors.length}`);

    if (errors.length > 0 && errors.length <= 10) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  Line ${err.line}: ${err.error}`);
      });
    }
  } 
  catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedCosingIngredients();
