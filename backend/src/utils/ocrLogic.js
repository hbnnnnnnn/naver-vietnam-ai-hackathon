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
  const form = new FormData();
  const message = {
    version: OCR_CONFIG.VERSION,
    requestId: `${Date.now()}`,
    timestamp: Date.now(),
    images: [{ format: imageFormat, name: path.basename(imagePath), data: null, url: null }],
    lang: lang,
    resultType: OCR_CONFIG.RESULT_TYPE
  };
  form.append('message', JSON.stringify(message));
  form.append('file', fs.createReadStream(imagePath));
  try {
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: { 'X-OCR-SECRET': secretKey, ...form.getHeaders() },
      data: form,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    return response.data;
  } catch (err) {
    console.error('Error calling OCR API:', err.response?.data || err);
    throw new Error(`OCR API call failed: ${err.message}`);
  }
}

/**
 * Extracts all text from OCR JSON response
 * @param {Object} ocrJson - OCR response JSON
 * @returns {string} Combined text from all fields
 */
export function extractAllText(ocrJson) {
  if (!ocrJson?.images) {
    console.warn('No images found in OCR response');
    return '';
  }

  const texts = [];
  for (const img of ocrJson.images) {
    for (const field of img.fields || []) {
      if (field.inferText) {
        texts.push(field.inferText.trim());
      }
    }
  }
  return texts.join(" ");
}

/**
 * Extracts ingredients block from full text using pattern matching
 * @param {string} fullText - Full OCR text
 * @returns {string} Extracted ingredients text
 */
export function extractIngredientsBlock(fullText) {
  if (!fullText || typeof fullText !== 'string') {
    return '';
  }

  const stopwords = [
    "Directions", "Caution", "Warning", "How to use", "Storage", 
    "주의", "사용방법", "용량", "화장품책임판매업자"
  ];
  
  const ingredientsPattern = /(ingredients?|성분|成分)[\s:：\-]*([A-Za-z0-9,.\-\s()%\/]+)/i;
  const match = fullText.match(ingredientsPattern);

  let ingredientsText = "";
  if (match && match[2]) {
    ingredientsText = match[2];
  } else {
    const alternativeMatch = fullText.match(/([A-Z][a-z]+\s?[A-Za-z0-9\-\(\)%]*,){5,}/);
    if (alternativeMatch) {
      ingredientsText = alternativeMatch[0];
    }
  }

  // Remove content after stop words
  for (const stopword of stopwords) {
    const stopIndex = String(ingredientsText).toLowerCase().indexOf(String(stopword).toLowerCase());
    if (stopIndex !== -1) {
      ingredientsText = ingredientsText.slice(0, stopIndex);
    }
  }

  return ingredientsText.trim();
}

/**
 * Cleans and splits ingredient list into individual ingredients
 * @param {string} text - Raw ingredients text
 * @returns {string[]} Array of cleaned ingredient names
 */
export function cleanIngredientList(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split(/[;,]/)
    .map((ingredient) => ingredient.replace(/[^A-Za-z0-9\-\s()%/]/g, "").trim())
    .filter((ingredient) => ingredient.length > 1);
}

// Improved cleaning & splitting for ingredient extraction
export function cleanAndSplitIngredients(ingredientsText) {
  let parts = ingredientsText.split(/[,\n]+/).map(p => p.trim()).filter(Boolean);

  // Step 2: further split parts that contain '/' or ' / ' (leaf/stem) but keep those meaningful
  parts = parts.flatMap(p => p.split(/\s*\/\s*/).map(s => s.trim()));

  // Step 3: split by capitalized boundaries when commas absent
  const expanded = [];
  for (const part of parts) {
    if (part.match(/,/) || part.split(' ').length > 1) {
      expanded.push(part);
    } else {
      // single-word part — keep
      expanded.push(part);
    }
  }

  // Step 4: repair some common OCR join/split issues
  // Merge tokens that look like they belong together: e.g., 'sodium' followed by 'hyaluronate' as separate items
  // We'll do a simple pass: whenever we see short tokens likely part of a multiword name, join with neighbor
  const repaired = [];
  for (let i = 0; i < expanded.length; i++) {
    let tok = expanded[i];
    // remove stray periods and multiple spaces
    tok = tok.replace(/^\.|\.$/g, '').replace(/\s+/g, ' ').trim();
    if (isNoiseToken(tok)) continue;

    // If the token is a single known "first word" that commonly prefixes a multiword INCI, merge with next
    const firstWords = ['sodium','bis','ethyl','butyl','propyl','iso','hydroxyethyl','beta','alpha','panax','centella','madecassic','asiatic'];
    const words = tok.split(' ');
    if (words.length === 1 && i + 1 < expanded.length) {
      const next = expanded[i + 1].replace(/\s+/g, ' ').trim();
      if (next && !isNoiseToken(next)) {
        const merged = `${tok} ${next}`;
        // Heuristic: if merged contains known chemical endings or words, accept and skip next
        if (/(ate|ide|one|ol|ane|ene|acid|glucan|hyaluronate|glycol|glucoside|allantoin|sulfate|citrat|edta)/i.test(merged)) {
          repaired.push(merged);
          i++; // skip next
          continue;
        }
      }
    }
    repaired.push(tok);
  }

  // Final cleanup: normalize spacing, remove repeated punctuation
  return repaired.map(r => r.replace(/\s+/g, ' ').replace(/[\.,;]+$/g, '').trim()).filter(Boolean);
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

const HEADER_PATTERNS = [
  /전\s*성\s*분/i,
  /성\s*분/i,
  /ingredients?/i,
  /full\s*ingredients?/i,
  /ingredient\s*list/i,
];
const END_MARKERS = [
  '용량', '사용법', '화장품책임판매업자', '피엘인터내셔널',
  'directions', 'how to use', 'usage', 'manufacturer', 'distributor', 'volume'
];

// --- Text extraction ---
export function extractIngredientsFromText(fullText) {
  if (!fullText || typeof fullText !== 'string') return '';

  // normalize whitespace
  const normalized = fullText.replace(/[\u00A0\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // find header
  let start = -1;
  for (const re of HEADER_PATTERNS) {
    const m = re.exec(normalized);
    if (m) { start = m.index + (m[0].length); break; }
  }

  let tail = normalized.slice(start === -1 ? 0 : start);

  // cut at first end marker occurrence (best effort)
  const lowTail = tail.toLowerCase();
  let endIdx = -1;
  for (const em of END_MARKERS) {
    const i = lowTail.indexOf(em);
    if (i !== -1 && (endIdx === -1 || i < endIdx)) endIdx = i;
  }
  if (endIdx !== -1) tail = tail.slice(0, endIdx);

  // Remove artifact tokens commonly inserted by OCR (logos, percent boxes, stray punctuation)
  // Keep parentheses but remove content that looks like visual artifacts like: "(0.1%)" is okay, but "(주)" is local company marker -> keep numbers and chemical-style parentheses
  tail = tail.replace(/\s?\[[^\]]*\]/g, ' '); // remove bracketed artifacts

  // collapse repeated separators like '.,' and trim
  tail = tail.replace(/[\.]{2,}/g, '.').replace(/\s*[,;]+\s*/g, ', ').trim();

  return tail.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
}

// --- Cleaning & splitting ---
function isNoiseToken(tok) {
  if (!tok) return true;
  const t = tok.trim().toLowerCase();
  if (t.length <= 1) return true;
  if (/^[0-9\s'"\-]+$/.test(t)) return true;
  // obvious non-ingredient words
  const noise = ['ewg', 'green', 'safety', 'logo', 'certified', 'distributor', 'manufacturer'];
  if (noise.includes(t)) return true;
  // tokens like "ct" or "leaf/stem" are sometimes nonstandard -> allow leaf/stem but filter standalone short ones
  if (t.length < 3 && !/^[a-z]{3,}$/.test(t)) return true;
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

