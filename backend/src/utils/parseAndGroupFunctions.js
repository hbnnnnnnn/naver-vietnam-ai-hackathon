/**
 * CosIng Function Normalization + Categorization
 *
 * Provides:
 *  - normalization of all CosIng function strings
 *  - grouping into primary function categories
 *  - subtype detection
 *  - skin-care + skin-relevant allowed list
 */

export const SKINCARE_ALLOWED_FUNCTIONS = new Set([
  // --- Direct skin care ---
  "Skin Protecting",
  "Skin Conditioning",
  "Skin Conditioning - Miscellaneous",
  "Skin Conditioning - Emollient",
  "Skin Conditioning - Humectant",
  "Skin Conditioning - Occlusive",
  "Anti-Sebum",
  "Anti-Seborrheic",
  "Humectant",
  "Moisturising",
  "Soothing",
  "Smoothing",
  "Keratolytic",
  "Refatting",
  "Astringent",
  "Tonic",
  "Refreshing",
  "Antioxidant",
  "Cleansing",
  "Tanning",
  "Exfoliating",

  // --- Skin-relevant (non-active, but needed for cosmetic formulation) ---
  "Abrasive",
  "Buffering",
  "Emulsion Stabilising",
  "Surfactant - Emulsifying",
  "Viscosity Controlling",
  "Absorbent",
  "pH Adjusters",
  "Opacifying",
  "Dispersing Non-Surfactant",
  "Surfactant - Cleansing",
  "Surfactant - Hydrotrope",
  "Surfactant - Solubilizing",
  "Surfactant - Foam Boosting",
  "Surfactant - Dispersing",
  "Binding",
  "Bulking",
  "Gel Forming",
  "Light Stabilizer",
  "Film Forming",
  "Slip Modifier",
  "Surface Modifier",
  "Foaming",
  "Antifoaming",
]);

/**
 * Normalize function names → consistent Title Case
 */
export function normalizeFunctionName(func) {
  if (!func) return "";

  return func
    .toLowerCase()
    .replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

/**
 * Map each CosIng function → primary category + subtype
 */
export function categorizeFunction(func) {
  const f = normalizeFunctionName(func);

  // ---------- SKIN CONDITIONING ----------
  if (f.startsWith("Skin Conditioning")) {
    const subtype = f.replace("Skin Conditioning", "").trim().replace("-", "").trim();
    return {
      primary: "Skin Conditioning",
      subtype: subtype || null
    };
  }

  // ---------- MOISTURISING / HYDRATION ----------
  if (["Humectant", "Moisturising", "Refatting"].includes(f)) {
    return { primary: "Moisturising", subtype: f === "Humectant" ? "Humectant" : null };
  }

  // ---------- OIL CONTROL ----------
  if (["Anti-Sebum", "Anti-Seborrheic"].includes(f)) {
    return { primary: "Oil Control", subtype: f };
  }

  // ---------- SOOTHING / SENSITIVITY ----------
  if (["Soothing", "Smoothing", "Refreshing"].includes(f)) {
    return { primary: "Soothing", subtype: f };
  }

  // ---------- EXFOLIATION ----------
  if (["Exfoliating", "Keratolytic"].includes(f)) {
    return { primary: "Exfoliating", subtype: f };
  }

  // ---------- PROTECTION ----------
  if (["Skin Protecting", "Antioxidant"].includes(f)) {
    return { primary: "Protection", subtype: f };
  }

  // ---------- CLEANSING ----------
  if (f === "Cleansing" || f.startsWith("Surfactant - Cleansing")) {
    return { primary: "Cleansing", subtype: null };
  }

  // ---------- ASTRINGENT ----------
  if (f === "Astringent") {
    return { primary: "Astringent", subtype: null };
  }

  // ---------- TANNING ----------
  if (f === "Tanning") {
    return { primary: "Tanning", subtype: null };
  }

  // ---------- FORMULATION FUNCTIONS ----------
  const FORMULATION_MAP = {
    "Abrasive": "Formulation",
    "Buffering": "Formulation",
    "Emulsion Stabilising": "Formulation",
    "Surfactant - Emulsifying": "Formulation",
    "Viscosity Controlling": "Formulation",
    "Absorbent": "Formulation",
    "Ph Adjusters": "Formulation",
    "Opacifying": "Formulation",
    "Dispersing Non-Surfactant": "Formulation",
    "Surfactant - Hydrotrope": "Formulation",
    "Surfactant - Solubilizing": "Formulation",
    "Surfactant - Foam Boosting": "Formulation",
    "Surfactant - Dispersing": "Formulation",
    "Binding": "Formulation",
    "Bulking": "Formulation",
    "Slip Modifier": "Formulation",
    "Surface Modifier": "Formulation",
    "Gel Forming": "Formulation",
    "Film Forming": "Formulation",
    "Light Stabilizer": "Formulation",
    "Antifoaming": "Formulation",
    "Foaming": "Formulation"
  };

  if (FORMULATION_MAP[f]) {
    return {
      primary: FORMULATION_MAP[f],
      subtype: f
    };
  }

  // ---------- FALLBACK ----------
  return { primary: "Other", subtype: f };
}

/**
 * Takes the raw CSV functions string and outputs:
 *    - full array of normalized functions
 *    - filtered list (only skin-care relevant)
 *    - primary categories & subtypes
 */
export function parseAndGroupFunctions(functionsStr) {
  if (!functionsStr) return [];

  const functions = functionsStr
    .split(",")
    .map(f => normalizeFunctionName(f.trim()))
    .filter(Boolean);

  // Filter for skincare + skin-relevant
  const filtered = functions.filter(f => SKINCARE_ALLOWED_FUNCTIONS.has(f));

  // Convert to primary + subtype
  return filtered.map(f => categorizeFunction(f));
}
