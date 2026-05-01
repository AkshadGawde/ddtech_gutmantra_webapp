const API_URL = "http://localhost:5001/api/menu";

export async function fetchPetpoojaProducts() {
  try {
    const res = await fetch(API_URL, { method: "POST" });
    const data = await res.json();

    console.log("🔥 FULL API:", data);

    if (!data || data.success === "0") {
      console.warn("⚠️ API error:", data?.message);
      return [];
    }

    return transformPetpoojaData(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return [];
  }
}

/* 🔥 FIXED TRANSFORM */
function transformPetpoojaData(apiData: any) {
  const categories = apiData.categories || [];
  const items = apiData.items || [];

  // map categoryid → name
  const categoryMap: Record<string, string> = {};

  categories.forEach((cat: any) => {
    categoryMap[cat.categoryid] = cat.categoryname;
  });

  const products = items.map((item: any) => ({
    id: item.itemid,
    name: item.itemname,
    price: Number(item.price),
    category: categoryMap[item.item_categoryid] || "unknown",
    image: item.item_image_url || "/placeholder.png",
    variants: item.variation || [],
  }));

  console.log("🔥 TRANSFORMED:", products);

  return products;
}