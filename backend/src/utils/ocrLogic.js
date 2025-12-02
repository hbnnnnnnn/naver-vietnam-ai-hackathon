import axios from "axios";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import * as fuzz from "fuzzball";
import FormData from "form-data";

const OCR_CONFIG = {
  VERSION: "V2",
  RESULT_TYPE: "json",
  DEFAULT_FORMAT: 'png',
  DEFAULT_LANG: 'ko'
};

export async function callNaverOcr({ secretKey, apiUrl, imagePath, imageFormat = OCR_CONFIG.DEFAULT_FORMAT, lang = OCR_CONFIG.DEFAULT_LANG }) {
  if (!secretKey || !apiUrl || !imagePath) throw new Error('Missing required parameters: secretKey, apiUrl, and imagePath are required');

  // Auto-detect image format from file extension if not explicitly provided
  let detectedFormat = imageFormat;
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  if (ext === "webp") {
    throw new Error("WebP format is not supported. Please upload a PNG or JPG image.");
  }
  if (!imageFormat || imageFormat === OCR_CONFIG.DEFAULT_FORMAT) {
    if (["png", "jpg", "jpeg"].includes(ext)) {
      detectedFormat = ext === "jpeg" ? "jpg" : ext;
    } else {
      detectedFormat = OCR_CONFIG.DEFAULT_FORMAT;
    }
  }

  // Read image file and encode to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Data = imageBuffer.toString('base64');

  const message = {
    version: OCR_CONFIG.VERSION,
    requestId: `${Date.now()}`,
    timestamp: Date.now(),
    images: [{ format: detectedFormat, name: path.basename(imagePath), data: base64Data }],
    lang: lang
  };

  // Log request details for debugging
//   console.log('[OCR] Request details:', {
//     apiUrl,
//     imagePath,
//     imageFormat: detectedFormat,
//     lang,
//     message,
//     messageString: JSON.stringify(message),
//     headers: { 'X-OCR-SECRET': secretKey, 'Content-Type': 'application/json' }
//   });

  try {
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: { 'X-OCR-SECRET': secretKey, 'Content-Type': 'application/json' },
      data: message,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60000 // 60 second timeout for OCR calls
    });
    return response.data;
  } catch (err) {
    // Log error details for debugging
    // console.error('[OCR] API error:', {
    //   error: err.message,
    //   response: err.response?.data,
    //   status: err.response?.status,
    //   headers: err.response?.headers
    // });
    throw new Error(`OCR API call failed: ${err.message}`);
  }
}

// Improved cleaning & splitting for ingredient extraction
export function cleanAndSplitIngredients(ingredientsText) {
  if (!ingredientsText) return [];
  
  // Pre-processing: handle common OCR issues
  let cleaned = ingredientsText;
  
  // Remove brackets and their content
  cleaned = cleaned.replace(/[\[\]]/g, ' ');
  
  // Fix common broken words from OCR - must do this BEFORE splitting
  const brokenWordFixes = [
    ['METHYLCELLU\\s+LOSE', 'METHYLCELLULOSE'],
    ['HYDROXYPR\\s*OPYL', 'HYDROXYPROPYL'],
    ['HYDROXYPR\\s*OPYLTRIMONIUM', 'HYDROXYPROPYLTRIMONIUM'],
    ['SO\\s+DIUM', 'SODIUM'],
    ['DIUM\\s+CHLORIDE', 'SODIUM CHLORIDE'],
    ['HYALUR\\s*ONATE', 'HYALURONATE'],
    ['HYALUR\\s*ONIC', 'HYALURONIC'],
    ['1\\.2-HEXANE-\\s*DIOL', '1,2-HEXANEDIOL'],
    ['BUTYLENE\\s+GLYCOL\\s+DIOL', 'BUTYLENE GLYCOL'],
    ['MALACHITE\\s+SO\\s+OPYLTRIMONIUM', 'MALACHITE'],
    ['LOSE\\s+METHYLCELLU', 'METHYLCELLULOSE'],
  ];
  
  brokenWordFixes.forEach(([broken, fixed]) => {
    const regex = new RegExp(broken, 'gi');
    cleaned = cleaned.replace(regex, fixed);
  });
  
  // Remove concentration parentheses and their content
  cleaned = cleaned.replace(/\([^)]*(?:ppm|ppb|%|mg)\)/gi, '');
  
  // Split by commas, periods, and line breaks
  let parts = cleaned.split(/[,\.\n]+/).map(p => p.trim()).filter(Boolean);

  // Further split parts that contain '/' (e.g., leaf/stem)
  parts = parts.flatMap(p => {
    // Skip splitting if it looks like a chemical notation (e.g., CI 77491)
    if (/^CI\s*\d+/i.test(p)) return [p];
    return p.split(/\s*\/\s*/).map(s => s.trim());
  });

  // Repair common OCR join/split issues
  const repaired = [];
  for (let i = 0; i < parts.length; i++) {
    let tok = parts[i];
    
    // Clean up the token
    tok = tok.replace(/^[\-\.]+|[\-\.]+$/g, '').replace(/\s+/g, ' ').trim();
    
    if (isNoiseToken(tok)) continue;

    // Merge multi-word ingredient names that were split
    const firstWords = [
      'sodium', 'potassium', 'calcium', 'magnesium',
      'bis', 'tri', 'di', 'mono',
      'ethyl', 'butyl', 'propyl', 'methyl', 'iso',
      'hydroxy', 'hydroxyethyl', 'hydroxypropyl', 'hydroxypropyltrimonium',
      'beta', 'alpha', 'gamma',
      'panax', 'centella', 'camellia',
      'acetylated', 'hydrolyzed', 'hydrogenated',
      'disodium', 'trisodium', 'malachite'
    ];
    
    const words = tok.toLowerCase().split(' ');
    
    // If token is a known prefix word and there's a next token, try merging
    if (words.length === 1 && firstWords.includes(words[0]) && i + 1 < parts.length) {
      const next = parts[i + 1].replace(/\s+/g, ' ').trim();
      if (next && !isNoiseToken(next)) {
        const merged = `${tok} ${next}`;
        // Check if merged form looks like valid ingredient name
        if (/(ate|ide|one|ol|ane|ene|acid|glucan|hyaluronate|glycol|glucoside|allantoin|sulfate|chloride|citrate|edta|extract|oil|water|glycerin|cellulose|carbomer|tromethamine)/i.test(merged)) {
          repaired.push(merged);
          i++; // skip next token
          continue;
        }
      }
    }
    
    repaired.push(tok);
  }

  // Final cleanup: normalize spacing, remove trailing punctuation
  return repaired
    .map(r => r.replace(/\s+/g, ' ').replace(/[\.,;\-]+$/g, '').trim())
    .filter(t => t && !isNoiseToken(t));
}

export function sortFieldsByPosition(fields) {
  // compute centroid y for each field and sort by y then x
  return [...fields].sort((a, b) => {
    const aVerts = a.boundingPoly?.vertices || [];
    const bVerts = b.boundingPoly?.vertices || [];
    const aYs = aVerts.map(v => v?.y ?? 0);
    const bYs = bVerts.map(v => v?.y ?? 0);
    const aXs = aVerts.map(v => v?.x ?? 0);
    const bXs = bVerts.map(v => v?.x ?? 0);
    const aY = aYs.length ? aYs.reduce((s, v) => s + v, 0) / aYs.length : 0;
    const bY = bYs.length ? bYs.reduce((s, v) => s + v, 0) / bYs.length : 0;
    if (Math.abs(aY - bY) > 6) return aY - bY; // tuned threshold: 6 px
    const aX = aXs.length ? aXs.reduce((s, v) => s + v, 0) / aXs.length : 0;
    const bX = bXs.length ? bXs.reduce((s, v) => s + v, 0) / bXs.length : 0;
    return aX - bX;
  });
}

// Group close-y fields into lines, preserving left->right order
export function buildLinesFromFields(sortedFields) {
  const lines = [];
  for (const f of sortedFields) {
    const verts = f.boundingPoly?.vertices || [];
    const yAvg = verts.length ? verts.map(v => v?.y ?? 0).reduce((s, v) => s + v, 0) / verts.length : 0;
    let placed = false;
    for (const line of lines) {
      if (Math.abs(line.y - yAvg) <= 8) { // same line
        line.items.push(f);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push({ y: yAvg, items: [f] });
  }
  // sort items in each line by x and join
  return lines
    .sort((a, b) => a.y - b.y)
    .map(line => {
      const sorted = [...line.items].sort((a, b) => {
        const ax = (a.boundingPoly?.vertices?.[0]?.x) || 0;
        const bx = (b.boundingPoly?.vertices?.[0]?.x) || 0;
        return ax - bx;
      });
      return sorted.map(s => s.inferText || '').join(' ');
    });
}

// Shared pattern constants for ingredient extraction
const HEADER_PATTERNS = [
  /\bingredients?\s*[:：\-]?\s*/i,
  /\bfull\s+ingredients?\s*[:：\-]?\s*/i,
  /\bingredient\s+list\s*[:：\-]?\s*/i,
  /전\s*성\s*분\s*[:：\-]?\s*/i,
  /성\s*분\s*[:：\-]?\s*/i,
];

const END_MARKERS = [
  // Product/company info
  /\b(?:is\s+a\s+)?registered\s+trademark/i,
  /\btrademarks?\s+of/i,
  /\bdistributed\s+by\b/i,
  /\bmanufactured\s+(?:by|for)\b/i,
  /\bref\.\s*no/i,
  /\blot\s*[:：]/i,
  // Section headers
  /\bdirections?\s*[:：]/i,
  /\bhow\s+to\s+use\s*[:：]/i,
  /\busage\s*[:：]/i,
  /\bcautions?\s*[:：]/i,
  /\bwarnings?\s*[:：]/i,
  /\bstorage\s*[:：]/i,
  /\bnet\s+(?:weight|wt|content)/i,
  /\bvolume\s*[:：]/i,
  /\bmade\s+in\b/i,
  // Korean markers
  /용\s*량/i,
  /사\s*용\s*법/i,
  /사\s*용\s*방\s*법/i,
  /화\s*장\s*품\s*책\s*임\s*판\s*매\s*업\s*자/i,
  /피\s*엘\s*인\s*터\s*내\s*셔\s*널/i,
  /주\s*의/i,
  /보\s*관\s*방\s*법/i,
  /제\s*조\s*업\s*체/i,
];

// --- Text extraction ---
export function extractIngredientsFromText(fullText) {
  if (!fullText || typeof fullText !== 'string') return '';

  // normalize whitespace
  const normalized = fullText.replace(/[\u00A0\t\r]+/g, ' ').replace(/ +/g, ' ').trim();

  // find header
  let start = -1;
  for (const re of HEADER_PATTERNS) {
    const m = re.exec(normalized);
    if (m) { start = m.index + m[0].length; break; }
  }

  // If no header found, return empty
  if (start === -1) return '';

  let tail = normalized.slice(start);

  // cut at first end marker occurrence using regex patterns
  let endIdx = tail.length;
  for (const emPattern of END_MARKERS) {
    const m = emPattern.exec(tail);
    if (m && m.index > 0 && m.index < endIdx) {
      endIdx = m.index;
    }
  }
  tail = tail.slice(0, endIdx);

  // Remove artifact tokens commonly inserted by OCR
  tail = tail.replace(/\s?\[[^\]]*\]/g, ' '); // remove bracketed artifacts
  tail = tail.replace(/\b\d{6,}\b/g, ' '); // remove long numbers (lot/ref numbers)
  
  // Remove Korean text (keep only English ingredients)
  tail = tail.replace(/[\u3131-\u318E\uAC00-\uD7A3]+/g, ' ');
  
  // Clean up concentration parentheses: remove (8,660 ppm), (100 ppb), etc.
  tail = tail.replace(/\([\d,\.]+\s*(?:ppm|ppb|%|mg|g)\)/gi, '');
  
  // Normalize whitespace and line breaks
  tail = tail.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ');

  // collapse repeated separators like '.,' and trim
  tail = tail.replace(/[\.]{2,}/g, '.').replace(/\s*[,;]+\s*/g, ', ').trim();

  return tail.replace(/^[:\-\s,;]+|[:\-\s,;]+$/g, '').trim();
}

// --- Cleaning & splitting ---
function isNoiseToken(tok) {
  if (!tok) return true;
  const t = tok.trim().toLowerCase();
  if (t.length <= 1) return true;
  
  // Filter out pure numbers, punctuation, or Korean characters
  if (/^[0-9\s'"\-\.]+$/.test(t)) return true;
  if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(t)) return true; // Korean characters
  
  // obvious non-ingredient words and fragments
  const noise = [
    'ewg', 'green', 'safety', 'logo', 'certified', 'distributor', 'manufacturer',
    'ingredients', 'ppm', 'ppb', 'mg', 'ans', 'del', 'ac',
    'ate', 'lose', 'opyl', 'dium', 'onate', 'onic', // standalone fragments
    'ppb)', '(ppb', 'ppm)', '(ppm'
  ];
  if (noise.includes(t)) return true;
  
  // Filter very short tokens unless they're valid INCI abbreviations
  const validShort = ['peg', 'ppg', 'ci', 'c12', 'c13', 'c14', 'c15', 'c16', 'edta', 'water', 'oil'];
  if (t.length < 3 && !validShort.includes(t)) return true;
  
  // Filter tokens that are just repeated characters
  if (/^(.)\1+$/.test(t)) return true;
  
  // Filter incomplete fragments (all caps with less than 3 chars)
  if (t.length < 4 && /^[A-Z]+$/.test(tok.trim())) {
    return !validShort.includes(t);
  }
  
  return false;
}

// Fuzzy matching using fuzzball's ratio
export async function matchIngredientsWithFuzzy(tokens, ingredientNames, threshold = 75) {
  const found = new Set();
  if (!tokens || !ingredientNames) return [];

  // Precompute a lowercase mapping for fast compare
  const normalizedMap = new Map();
  for (const name of ingredientNames) {
    if (!name) continue;
    normalizedMap.set(name.toLowerCase(), name);
  }

  for (const token of tokens) {
    const t = token.toLowerCase();
    // try exact lowercase match first
    if (normalizedMap.has(t)) {
      found.add(normalizedMap.get(t));
      continue;
    }

    let best = null;
    let bestScore = 0;
    for (const [lname, original] of normalizedMap.entries()) {
      // fuzzball token_set_ratio is good for order/extra words tolerance
      const score = fuzz.token_set_ratio(t, lname);
      if (score > bestScore) { bestScore = score; best = original; }
      if (bestScore === 100) break;
    }
    if (bestScore >= threshold && best) found.add(best);
  }
  return Array.from(found);
}

