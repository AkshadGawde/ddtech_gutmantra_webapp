import admin from "firebase-admin";

// ---------- TYPES ----------
type PetPoojaCategory = {
  categoryid: string;
  categoryname?: string;
  active?: string;
};

// Keywords used to identify "grind type" variation groups or attribute titles
// coming from PetPooja. Match against lowercased strings.
const GRIND_GROUP_KEYWORDS = [
  "grind", "grinding", "chakki", "pees", "pisi", "mill", "milling",
];

// ---------- HELPERS ----------

/**
 * Detects grind options for an item by scanning two sources from PetPooja:
 *  1. Global variations whose groupname contains a grind keyword
 *  2. item_attribute_title / item_attributes on the item itself
 *
 * Returns an array of grind option strings, or [] if PetPooja has no grind data.
 * An empty result means the Firestore merge will preserve whatever the admin set.
 */
function extractGrindOptions(
  item: any,
  rawVariants: any[],
  variationNamesMap: Record<string, string>,
  grindVidSet: Set<string>
): string[] {
  const found = new Set<string>();

  // Source 1: Variation groups tagged with grind keywords
  rawVariants.forEach((v: any) => {
    const vid = String(v.variationid || "");
    if (vid && grindVidSet.has(vid)) {
      const name = variationNamesMap[vid] || v.name;
      if (name) found.add(name);
    }
  });

  // Source 2: item_attribute_title / item_attributes  (PetPooja attribute system)
  const attrTitle = String(item.item_attribute_title || item.attribute_title || "").toLowerCase();
  if (GRIND_GROUP_KEYWORDS.some((k) => attrTitle.includes(k))) {
    const attrs: any[] = item.item_attributes || item.attributes || [];
    attrs.forEach((a: any) => {
      const name = a.attribute || a.name || a.attribute_name || a.value || "";
      if (name) found.add(String(name));
    });
  }

  return [...found];
}

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

  // ── Build: variationid → name  AND  variationid → groupname ─────────────────
  const variationNamesMap: Record<string, string> = {};
  const variationGroupMap: Record<string, string> = {};

  // Collect variation IDs that belong to grind-type groups
  const grindVidSet = new Set<string>();

  (payload.variations || []).forEach((v: any) => {
    const vid = String(v.variationid || v.id || "");
    if (!vid) return;
    const name = v.name || v.variationname || "";
    const group = String(v.groupname || v.group_name || "").toLowerCase();
    variationNamesMap[vid] = name;
    variationGroupMap[vid] = group;
    if (GRIND_GROUP_KEYWORDS.some((k) => group.includes(k))) {
      grindVidSet.add(vid);
    }
  });

  if (grindVidSet.size > 0) {
    console.log(`🌀 [menuSync] Detected grind variation IDs from PetPooja:`, [...grindVidSet]);
  } else {
    console.log(`ℹ️  [menuSync] No grind variation groups found in payload.variations — grind must be set via item_attributes or admin panel`);
  }

  // ── Build: itemid → variationid → price (from top-level itemvariations) ─────
  const ivPriceMap: Record<string, Record<string, number>> = {};
  const itemVariationsArr: any[] = payload.itemvariations || payload.item_variations || [];

  itemVariationsArr.forEach((iv: any) => {
    const itemid = String(iv.itemid || "");
    const variationid = String(iv.variationid || "");
    const price = parseFloat(iv.price ?? iv.variationprice ?? iv.item_price ?? "0");
    if (itemid && variationid) {
      if (!ivPriceMap[itemid]) ivPriceMap[itemid] = {};
      ivPriceMap[itemid][variationid] = price;
    }
  });

  // Log items with base price=0 — lets us debug missing prices and see full field list
  const zeroPriceItems = items.filter((it: any) => parseFloat(it.price || "0") === 0);
  console.log(`🔍 [menuSync] ${zeroPriceItems.length} items with base price=0:`);
  zeroPriceItems.forEach((it: any) => {
    const varCount = (it.variation || []).length;
    if (varCount > 0) {
      const fv = it.variation[0];
      // Log all field keys on first zero-price item with variations so we can spot new PetPooja fields
      if (zeroPriceItems.indexOf(it) === 0) {
        console.log(`   📋 "${it.itemname}" — ALL item keys: ${Object.keys(it).join(", ")}`);
        if (it.item_attribute_title) console.log(`      item_attribute_title: ${it.item_attribute_title}`);
        if (it.item_attributes) console.log(`      item_attributes: ${JSON.stringify(it.item_attributes)}`);
      }
      console.log(`   ✅ "${it.itemname}" → ${varCount} variants, first: name="${fv.name}" groupname="${fv.groupname || ""}" price="${fv.price}"`);
    } else {
      console.log(`   ❌ "${it.itemname}" (${it.itemid}) → NO variations. All keys: ${Object.keys(it).join(", ")}`);
      if (it.item_info) console.log(`      item_info: ${JSON.stringify(it.item_info)}`);
      if (it.item_attribute_title) console.log(`      item_attribute_title: ${it.item_attribute_title}`);
      if (it.item_attributes) console.log(`      item_attributes: ${JSON.stringify(it.item_attributes)}`);
    }
  });

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

      // Build raw variant list from best available source
      const ivIds = Object.keys(ivPriceMap[item.itemid] || {});
      const rawVariants: any[] =
        item.variation && item.variation.length > 0
          ? item.variation
          : ivIds.length > 0
          ? ivIds.map((vid) => ({ variationid: vid }))
          : [{ price: item.price, name: "Default", _isDefault: true }];

      // ── Separate grind variants from size variants ────────────────────────
      // Grind-type variation IDs were collected globally from groupname detection.
      const sizeVariants = rawVariants.filter(
        (v: any) => !grindVidSet.has(String(v.variationid || ""))
      );

      const mappedVariants = sizeVariants.map((v: any) => {
        const vid = String(v.variationid || "");

        // Price resolution: inline → itemvariations map → item base price
        let price = parseFloat(v.price ?? "0");
        if (price === 0 && vid && ivPriceMap[item.itemid]?.[vid] != null) {
          price = ivPriceMap[item.itemid][vid];
        }
        if (price === 0 && v._isDefault) {
          price = parseFloat(item.price ?? "0");
        }

        // Name resolution: inline → global map → fallback
        const name =
          (v.name && v.name !== "Default" ? v.name : null) ||
          (vid ? variationNamesMap[vid] : null) ||
          (v._isDefault ? "Default" : "Standard");

        const sku = String(v.eid || v.EID || vid || item.itemid || "");
        const petpoojaId = vid ? `V${vid}` : `V${item.itemid}`;

        return { price, quantity: name, sku, petpoojaId };
      });

      // ── Product-level price ───────────────────────────────────────────────
      const itemBasePrice = parseFloat(item.price ?? "0");
      const lowestVariantPrice = mappedVariants.reduce((min: number, v: any) => {
        const p = Number(v.price);
        return p > 0 && (min === 0 || p < min) ? p : min;
      }, 0);
      const productPrice = itemBasePrice > 0 ? itemBasePrice : lowestVariantPrice;

      // ── Grind options — read from PetPooja, never hardcoded ──────────────
      // Sources: (1) grind variation groups, (2) item_attribute_title/item_attributes
      // If PetPooja has no grind data, grindOptions is omitted from the payload so
      // merge:true preserves whatever the admin set manually.
      const grindOptions = extractGrindOptions(
        item,
        rawVariants,
        variationNamesMap,
        grindVidSet
      );

      const categoryName = categoryMap[item.item_categoryid || ""] || "";

      if (chunk.indexOf(item) === 0) {
        console.log(
          `🧾 [menuSync] "${item.itemname}" → price:${productPrice}` +
          ` grinds:[${grindOptions.join(", ") || "none from PetPooja"}]` +
          ` sizes:[${mappedVariants.map((v: any) => `${v.quantity}=₹${v.price}`).join(", ")}]`
        );
      }

      batch.set(
        ref,
        {
          name: item.itemname || "",
          category: categoryName || "Uncategorized",
          description: item.itemdescription || "",
          images: item.item_image_url ? [item.item_image_url] : [],
          sku: item.itemid,
          price: productPrice,
          variants: mappedVariants,
          // Only write grindOptions when PetPooja actually sent grind data.
          // When empty, merge:true silently preserves any admin-configured value.
          ...(grindOptions.length > 0 ? { grindOptions } : {}),
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
