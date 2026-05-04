import { CATEGORY_MAP } from "@/constants/categoryMap";

export function filterProducts(products: any[], main: string, sub?: string) {
  const config = CATEGORY_MAP[main];
  if (!config) return [];

  return products.filter((p) => {
    const name = p.name.toLowerCase();
    const raw = (p.rawCategory || "").toLowerCase();

    // main category match
    const mainMatch =
      config.match.some((k: string) => name.includes(k) || raw.includes(k));

    if (!mainMatch) return false;

    // subcategory match
    if (sub && config.sub[sub]) {
      return config.sub[sub].some((k: string) => name.includes(k));
    }

    return true;
  });
}