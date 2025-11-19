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
  
  // Normalize whitespace
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

