import admin from "firebase-admin";

// ---------- TYPES ----------
type PetPoojaCategory = {
  categoryid: string;
  categoryname?: string;
  active?: string;
};

// ---------- MAIN FUNCTION ----------
export async function syncMenuToFirestore(
  db: FirebaseFirestore.Firestore,
  payload: any
) {
  if (!payload || !payload.items) {
    throw new Error("Invalid payload received");
  }

  const categories: PetPoojaCategory[] = payload.categories || [];
  const items: any[] = payload.items || [];

  // ── Log payload structure so we can verify what PetPooja sends ──────────────
  console.log("📦 [menuSync] payload keys:", Object.keys(payload));
  console.log(`📦 [menuSync] items: ${items.length}, categories: ${categories.length}`);
  console.log(`📦 [menuSync] variations: ${(payload.variations || []).length}`);
  console.log(`📦 [menuSync] itemvariations: ${(payload.itemvariations || payload.item_variations || []).length}`);

  // ── Build: variationid → name (from global variations list) ─────────────────
  // PetPooja stores variation names in a global "variations" array.
  // Per-item variations only carry the variationid; name must be looked up here.
  const variationNamesMap: Record<string, string> = {};
  (payload.variations || []).forEach((v: any) => {
    const vid = String(v.variationid || v.id || "");
    if (vid) variationNamesMap[vid] = v.name || v.variationname || "";
  });

  // ── Build: itemid → variationid → price (from top-level itemvariations) ─────
  // PetPooja sends variant prices in a flat "itemvariations" array, not inline
  // on each item's variation entry. This is why spice/multigrain prices are 0
  // when read from item.variation[x].price — those fields are often empty.
  const ivPriceMap: Record<string, Record<string, number>> = {};
  const itemVariationsArr: any[] =
    payload.itemvariations || payload.item_variations || [];

  itemVariationsArr.forEach((iv: any) => {
    const itemid = String(iv.itemid || "");
    const variationid = String(iv.variationid || "");
    // PetPooja can use "price", "variationprice", or "item_price" for the value
    const price = parseFloat(
      iv.price ?? iv.variationprice ?? iv.item_price ?? "0"
    );
    if (itemid && variationid) {
      if (!ivPriceMap[itemid]) ivPriceMap[itemid] = {};
      ivPriceMap[itemid][variationid] = price;
    }
  });

  // Log a sample item so we can verify the data on first push
  if (items.length > 0) {
    const sample = items[0];
    console.log("🔍 [menuSync] sample item:", {
      itemid: sample.itemid,
      itemname: sample.itemname,
      price: sample.price,
      variationCount: (sample.variation || []).length,
      firstVariation: (sample.variation || [])[0] || null,
    });
  }

  // ---------- CATEGORY MAP ----------
  const categoryMap: Record<string, string> = {};
  categories.forEach((cat) => {
    if (cat.categoryid) {
      categoryMap[cat.categoryid] = cat.categoryname || "Uncategorized";
    }
  });

  const chunkSize = 400;

  for (let i = 0; i < items.length; i += chunkSize) {
    const batch = db.batch();
    const chunk = items.slice(i, i + chunkSize);

    // ---------- CATEGORIES ----------
    categories.forEach((cat) => {
      if (!cat.categoryid) return;
      const ref = db.collection("categories").doc(cat.categoryid);
      batch.set(
        ref,
        {
          id: cat.categoryid,
          name: cat.categoryname || "",
          active: cat.active === "1",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // ---------- GLOBAL VARIATIONS ----------
    (payload.variations || []).forEach((v: any) => {
      const vid = String(v.variationid || v.id || "");
      if (!vid) return;
      const ref = db.collection("variations").doc(vid);
      batch.set(
        ref,
        {
          id: vid,
          name: v.name || "",
          group: v.groupname || "",
          active: v.status === "1",
        },
        { merge: true }
      );
    });

    // ---------- PRODUCTS ----------
    chunk.forEach((item: any) => {
      if (!item.itemid) return;

      const ref = db.collection("products").doc(item.itemid);

      // Use item.variation if it exists, otherwise create a single Default variant
      const rawVariants: any[] =
        item.variation && item.variation.length > 0
          ? item.variation
          : [{ price: item.price, name: "Default", _isDefault: true }];

      const mappedVariants = rawVariants.map((v: any) => {
        const vid = String(v.variationid || "");

        // ── Price resolution (in priority order) ─────────────────────────────
        // 1. Inline price on the variant (works for simple products)
        // 2. itemvariations map (required for spices / multi-variant products)
        // 3. Item base price (fallback for Default variants)
        let price = parseFloat(v.price ?? "0");
        if (price === 0 && vid && ivPriceMap[item.itemid]?.[vid] != null) {
          price = ivPriceMap[item.itemid][vid];
        }
        if (price === 0 && v._isDefault) {
          price = parseFloat(item.price ?? "0");
        }

        // ── Name resolution ───────────────────────────────────────────────────
        // Inline name → global variationNamesMap → "Standard"
        const name =
          (v.name && v.name !== "Default" ? v.name : null) ||
          (vid ? variationNamesMap[vid] : null) ||
          (v._isDefault ? "Default" : "Standard");

        // ── SKU / IDs ─────────────────────────────────────────────────────────
        const sku = String(v.eid || v.EID || vid || item.itemid || "");
        const petpoojaId = vid ? `V${vid}` : `V${item.itemid}`;

        return { price, quantity: name, grind: null, sku, petpoojaId };
      });

      // ── Product-level price ───────────────────────────────────────────────
      // Use direct item price if present; otherwise lowest non-zero variant price.
      const itemBasePrice = parseFloat(item.price ?? "0");
      const lowestVariantPrice = mappedVariants.reduce((min: number, v: any) => {
        const p = Number(v.price);
        return p > 0 && (min === 0 || p < min) ? p : min;
      }, 0);
      const productPrice = itemBasePrice > 0 ? itemBasePrice : lowestVariantPrice;

      // Log variant pricing for the first item of each chunk so we can verify
      if (chunk.indexOf(item) === 0) {
        console.log(`🧾 [menuSync] "${item.itemname}" → price:${productPrice} variants:[${
          mappedVariants.map((v: any) => `${v.quantity}=₹${v.price}`).join(", ")
        }]`);
      }

      batch.set(
        ref,
        {
          name: item.itemname || "",
          category: categoryMap[item.item_categoryid || ""] || "Uncategorized",
          description: item.itemdescription || "",
          images: item.item_image_url ? [item.item_image_url] : [],
          sku: item.itemid,
          price: productPrice,
          variants: mappedVariants,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  console.log(`✅ [menuSync] Synced ${items.length} products`);

  return { totalProducts: items.length };
}
