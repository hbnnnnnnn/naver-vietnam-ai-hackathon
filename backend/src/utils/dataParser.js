export const extractSPF = (productName) => {
  if (!productName || typeof productName !== 'string') return 0;

  const nameLower = productName.toLowerCase();

  let match = nameLower.match(/spf\s*(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  match = nameLower.match(/(\d+)\s*spf/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  match = nameLower.match(/spf\s*(\d+)\+?/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
};

export const determineTimeOfDay = (category, productName) => {
  if (!productName || typeof productName !== 'string') return 'both';

  const nameLower = productName.toLowerCase();

  if (category === 'Sunscreen' || nameLower.includes('sunscreen') || nameLower.includes('spf')) {
    return 'day';
  }

  if (nameLower.includes('night') ||
      nameLower.includes('pm') ||
      nameLower.includes('sleeping') ||
      nameLower.includes('overnight')) {
    return 'night';
  }

  if (nameLower.includes('day') ||
      nameLower.includes('am') ||
      nameLower.includes('morning')) {
    return 'day';
  }

  const nightIngredients = ['retinol', 'retinal', 'tretinoin', 'vitamin a', 'aha', 'bha'];
  if (nightIngredients.some(ingredient => nameLower.includes(ingredient))) {
    return 'night';
  }

  return 'both';
};

export const calculateBudgetTier = (price) => {
  if (!price || typeof price !== 'number') return 'medium';

  if (price < 20) return 'low';
  if (price < 50) return 'medium';
  return 'high';
};


export const mapTypeToCategory = (type) => {
  if (!type || typeof type !== 'string') return 'Treatment';

  const typeLower = type.toLowerCase().trim();

  const mapping = {
    'moisturizer': 'Moisturizer',
    'moisturiser': 'Moisturizer',
    'cream': 'Moisturizer',
    'lotion': 'Moisturizer',

    'cleanser': 'Cleanser',
    'face wash': 'Cleanser',
    'facial cleanser': 'Cleanser',
    'cleansing': 'Cleanser',

    'face mask': 'Face mask',
    'mask': 'Face mask',
    'sheet mask': 'Face mask',

    'treatment': 'Treatment',
    'serum': 'Treatment',
    'essence': 'Treatment',
    'ampoule': 'Treatment',
    'spot treatment': 'Treatment',

    'eye cream': 'Eye cream',
    'eye': 'Eye cream',

    'sunscreen': 'Sunscreen',
    'sun protection': 'Sunscreen',
    'sun cream': 'Sunscreen',
    'spf': 'Sunscreen'
  };

  return mapping[typeLower] || type;
};

export const cleanProductName = (name) => {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()
    .replace(/\s+/g, ' ')  
    .replace(/[^\w\s\-+()]/g, ''); 
};

export const parseProduct = (rawProduct) => {
  const category = mapTypeToCategory(rawProduct.type || rawProduct.category);
  const cleanName = cleanProductName(rawProduct.name);

  return {
    productId: rawProduct.productId || rawProduct.id || rawProduct._id,
    name: cleanName,
    brand: rawProduct.brand || 'Unknown',
    thumbnail_url: rawProduct.thumbnail_url || rawProduct.image_url || '',
    product_url: rawProduct.product_url || rawProduct.url || '',
    type: rawProduct.type,
    category: category,
    timeOfDay: determineTimeOfDay(category, cleanName),
    spf: extractSPF(cleanName),
    ingredients: Array.isArray(rawProduct.ingredients) ? rawProduct.ingredients : [],
    price: parseFloat(rawProduct.price) || 0,
    budgetTier: calculateBudgetTier(parseFloat(rawProduct.price)),
    rank: parseInt(rawProduct.rank) || 0,
    combination_skin: Boolean(rawProduct.combination_skin),
    dry_skin: Boolean(rawProduct.dry_skin),
    oily_skin: Boolean(rawProduct.oily_skin),
    normal_skin: Boolean(rawProduct.normal_skin),
    sensitive_skin: Boolean(rawProduct.sensitive_skin)
  };
};

export const validateProduct = (product) => {
  const errors = [];

  if (!product.productId) errors.push('Missing productId');
  if (!product.name) errors.push('Missing name');
  if (!product.brand) errors.push('Missing brand');
  if (!product.category) errors.push('Missing category');
  if (typeof product.price !== 'number' || product.price < 0) {
    errors.push('Invalid price');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
