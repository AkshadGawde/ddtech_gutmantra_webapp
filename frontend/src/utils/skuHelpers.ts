/**
 * Extract SKU from variant with fallback chain.
 * Checks multiple fields to find a valid SKU value.
 */
export function extractVariantSku(variant: any, product: any): string {
  if (!variant) {
    // Fallback to product-level SKU
    return extractProductSku(product);
  }

  // Try variant fields in order of preference
  const skuCandidates = [
    variant.sku,
    variant.variationId,
    variant.variation_id,
    variant.itemVariationId,
    variant.item_variation_id,
    variant.eid,
    variant.EID,
    variant.petpoojaId?.replace(/^V/, ""), // Remove V prefix if present
    variant.id,
  ];

  for (const candidate of skuCandidates) {
    if (candidate) {
      return String(candidate);
    }
  }

  // Final fallback to product SKU
  return extractProductSku(product);
}

/**
 * Extract SKU from product with fallback chain.
 */
export function extractProductSku(product: any): string {
  if (!product) return "";

  const skuCandidates = [
    product.sku,
    product.itemid,
    product.item_id,
    product.id,
  ];

  for (const candidate of skuCandidates) {
    if (candidate) {
      return String(candidate);
    }
  }

  return "";
}

/**
 * Extract price from variant with fallback to product price.
 */
export function extractVariantPrice(variant: any, product: any): number {
  if (!variant) {
    return extractProductPrice(product);
  }

  const priceCandidates = [
    variant.price,
    variant.sellingPrice,
    variant.selling_price,
    variant.mrp,
  ];

  for (const candidate of priceCandidates) {
    const price = Number(candidate);
    if (price > 0) {
      return price;
    }
  }

  // Fallback to product price
  return extractProductPrice(product);
}

/**
 * Extract price from product with fallback chain.
 */
export function extractProductPrice(product: any): number {
  if (!product) return 0;

  const priceCandidates = [
    product.price,
    product.sellingPrice,
    product.selling_price,
    product.mrp,
    product.variants?.[0]?.price,
  ];

  for (const candidate of priceCandidates) {
    const price = Number(candidate);
    if (price > 0) {
      return price;
    }
  }

  return 0;
}

/**
 * Build variant display name from available fields.
 */
export function buildVariantName(variant: any): string {
  if (!variant) return "";

  const parts = [];

  if (variant.grind) {
    parts.push(variant.grind);
  }

  if (variant.quantity) {
    parts.push(variant.quantity);
  } else if (variant.weight) {
    parts.push(variant.weight);
  } else if (variant.name) {
    parts.push(variant.name);
  }

  return parts.join(" - ");
}

/**
 * Safe variant selector: returns variant or creates a minimal fallback.
 */
export function ensureVariantSelected(
  selectedVariant: any,
  variants: any[],
  product: any
): any {
  if (selectedVariant) {
    return selectedVariant;
  }

  // Try to find any variant
  if (variants && variants.length > 0) {
    return variants[0];
  }

  // Create minimal fallback variant from product
  if (product) {
    return {
      sku: extractProductSku(product),
      price: extractProductPrice(product),
      name: "Default",
      petpoojaId: product.petpoojaId || `V${product.id || "unknown"}`,
    };
  }

  return null;
}
