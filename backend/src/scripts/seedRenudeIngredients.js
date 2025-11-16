import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IngredientRenude from '../models/IngredientRenude.js';
import { fetchRiskAssessmentFromLLM } from '../services/ingredientEnrichment.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-app';

/**
 * Normalize name for search/comparison
 */
function normalizeName(name) {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parse array string from CSV (format: "['item1', 'item2', ...]")
 */
function parseArrayField(fieldValue) {
  if (!fieldValue || fieldValue.trim() === '') return [];
  
  try {
    // Remove outer brackets and quotes, then split by comma
    const cleaned = fieldValue
      .replace(/^\[|\]$/g, '')  // Remove outer brackets
      .replace(/['"]/g, '')      // Remove quotes
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0 && item !== ' ');
    
    return cleaned;
  } catch (error) {
    console.warn(`Error parsing array field: ${fieldValue}`, error);
    return [];
  }
}

/**
 * Build short description from available fields
 */
function buildShortDescription(row) {
  // Try to use short_description if available
  if (row.short_description && row.short_description.trim()) {
    return row.short_description.trim();
  }
  
  // Fall back to what_is_it
  if (row.what_is_it && row.what_is_it.trim()) {
    return row.what_is_it.trim();
  }
  
  // If nothing available, return empty string
  return '';
}

/**
 * Extract benefits from what_does_it_do field
 * Improved: Remove introductory phrases and merge split sentences.
 */
function extractBenefits(whatDoesItDoRaw) {
  if (!whatDoesItDoRaw || typeof whatDoesItDoRaw !== 'string') return [];

  let text = whatDoesItDoRaw
    .replace(/\r/g, '')
    .replace(/[•●▪️]/g, '\n')     // convert bullets
    .replace(/ - /g, '\n')        // convert hyphens used as bullets
    .replace(/—|–/g, ' ')         // normal em dash
    .trim();

  // 1. Split into sentences safely
  let sentences = text
    .split(/[\.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // 2. Benefit verbs
  const verbs = [
    'hydrate','moistur','soothe','calm','reduce','brighten','protect','repair',
    'soften','exfoliat','cleanse','absorb','support','strengthen','nourish',
    'plump','firm','heal','anti-','prevent','improv','restore','regenerat'
  ];

  const verbRegex = new RegExp(verbs.join('|'), 'i');

  // 3. Extract sentences containing benefit verbs
  let benefits = sentences.filter(s => verbRegex.test(s));

  // 4. Clean fluff / leading phrases but KEEP meaning
  benefits = benefits.map(b =>
    b
      .replace(/^it\s*(helps|can|may|also|additionally|is used to|is used for)\s*/i, '')
      .replace(/^this ingredient\s*/i, '')
      .replace(/^in skincare.*?\,\s*/i, '')
      .replace(/^when used.*?\s*/i, '')
      .trim()
  );

  // 5. Normalize into short, noun-phrase benefits
  benefits = benefits.map(b => {
    // Convert sentence → benefit phrase
    return b
      .replace(/^to\s+/i, '')                     // "to soothe" → "soothe"
      .replace(/^and\s+/i, '')
      .replace(/^provides?\s*/i, 'provides ')
      .replace(/^offers?\s*/i, 'offers ')
      .replace(/^helps?\s*/i, 'helps ')
      .trim();
  });

  // 6. Remove garbage: commas, partials, > 200 chars
  benefits = benefits.filter(b =>
    b.length > 3 &&
    b.length < 200 &&
    !b.startsWith(',') &&
    !b.match(/^\W+$/)
  );

  return benefits;
}

/**
 * Remove line breaks and extra whitespace from a string
 */
function cleanString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Seed Renude ingredients from CSV file
 */
async function seedRenudeIngredients() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing IngredientRenude collection...');
    await IngredientRenude.deleteMany({});
    console.log('Existing data cleared');

    // Path to CSV file
    const csvFilePath = path.join(__dirname, '../../data/ingredientsList.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }

    console.log(`Reading CSV file from: ${csvFilePath}`);

    const ingredients = [];
    const errors = [];
    let lineNumber = 0;

    // Read and parse CSV
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          
          try {
            const inciName = row.name || row.scientific_name || '';
            
            if (!inciName.trim()) {
              errors.push({
                line: lineNumber,
                error: 'Missing ingredient name',
                row
              });
              return;
            }

            const ingredient = {
              name: cleanString(inciName.trim()),
              name_normalized: cleanString(normalizeName(inciName)),
              description: cleanString(buildShortDescription(row)),
              benefits: extractBenefits(row.what_does_it_do).map(cleanString),
              good_for: parseArrayField(row.who_is_it_good_for).map(cleanString)
            };

            ingredients.push(ingredient);

          } catch (error) {
            errors.push({
              line: lineNumber,
              error: error.message,
              row
            });
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    console.log(`\nParsed ${ingredients.length} ingredients from CSV`);
    
    if (errors.length > 0) {
      console.log(`\nEncountered ${errors.length} errors during parsing:`);
      errors.slice(0, 10).forEach(err => {
        console.log(`  Line ${err.line}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

    // Insert into database
    if (ingredients.length > 0) {
      // Log the preprocessing result first
    //   console.log('\n--- Preprocessed Ingredients ---');
    //   ingredients.slice(0, 10).forEach((ingredient, idx) => {
    //     console.log(`\n[${idx + 1}]`, ingredient);
    //   });
    //   if (ingredients.length > 10) {
    //     console.log(`...and ${ingredients.length - 10} more`);
    //   }

      console.log('\nEnriching ingredients with LLM for risk assessment...');
      
      // Process in batches of 10 for LLM calls
      const batchSize = 10;
      const enrichedIngredients = [];
      
      for (let i = 0; i < ingredients.length; i += batchSize) {
        const batch = ingredients.slice(i, i + batchSize);
        const batchNames = batch.map(ing => ing.name);
        
        try {
          console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ingredients.length / batchSize)}...`);
          const llmResults = await fetchRiskAssessmentFromLLM(batchNames);
          
          // Merge LLM results with ingredient data
          for (let j = 0; j < batch.length; j++) {
            const ingredient = batch[j];
            const llmData = llmResults[j] || {};
            
            enrichedIngredients.push({
              ...ingredient,
              risk_level: llmData.risk_level || 'Unknown',
              reason: llmData.reason || 'Risk assessment not available'
            });
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to enrich batch ${Math.floor(i / batchSize) + 1}, using defaults:`, error.message);
          // Add ingredients with default risk values
          batch.forEach(ingredient => {
            enrichedIngredients.push({
              ...ingredient,
              risk_level: 'Unknown',
              reason: 'LLM enrichment failed during seeding'
            });
          });
        }
      }

      console.log('\nInserting enriched ingredients into database...');
      
      let successCount = 0;
      let failCount = 0;
      const insertErrors = [];

      // Insert one by one to handle duplicates gracefully
      for (const ingredient of enrichedIngredients) {
        try {
          await IngredientRenude.create(ingredient);
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`Inserted ${successCount}/${enrichedIngredients.length} ingredients...`);
          }
        } catch (error) {
          failCount++;
          insertErrors.push({
            name: ingredient.name,
            error: error.message
          });
        }
      }

      console.log(`\n✓ Successfully inserted ${successCount} ingredients`);
      
      if (failCount > 0) {
        console.log(`Failed to insert ${failCount} ingredients`);
        console.log('\nSample insert errors:');
        insertErrors.slice(0, 5).forEach(err => {
          console.log(`  ${err.name}: ${err.error}`);
        });
      }

      // Display some sample data
      console.log('\n--- Sample Ingredients ---');
      const samples = await IngredientRenude.find().limit(3);
      samples.forEach(sample => {
        console.log(`\nName: ${sample.name}`);
        console.log(`Normalized: ${sample.name_normalized}`);
        console.log(`Description: ${sample.description.substring(0, 50)}...`);
        console.log(`Benefits: ${sample.benefits.slice(0, 2).join(', ')}${sample.benefits.length > 2 ? '...' : ''}`);
        console.log(`Good for: ${sample.good_for.join(', ')}`);
        console.log(`Risk Level: ${sample.risk_level}`);
        console.log(`Reason: ${sample.reason}`);
      });

      console.log('\n✓ Seed completed successfully!');
    } else {
      console.log('No ingredients to insert.');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seed function
seedRenudeIngredients();
