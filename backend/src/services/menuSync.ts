import admin from "firebase-admin";

// ---------- TYPES ----------
type PetPoojaVariation = {
  variationid?: string;
  id?: string;
  eid?: string;
  EID?: string;
  name?: string;
  groupname?: string;
  price?: string;
  status?: string;
};

type PetPoojaItem = {
  itemid: string;
  itemname?: string;
  itemdescription?: string;
  item_categoryid?: string;
  item_image_url?: string;
  price?: string;
  in_stock?: string;
  variation?: PetPoojaVariation[];
};

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
  const items: PetPoojaItem[] = payload.items || [];
  const variations: PetPoojaVariation[] = payload.variations || [];

  // ---------- CATEGORY MAP ----------
  const categoryMap: Record<string, string> = {};

  categories.forEach((cat) => {
    if (cat.categoryid) {
      categoryMap[cat.categoryid] =
        cat.categoryname || "Uncategorized";
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

    // ---------- VARIATIONS ----------
    variations.forEach((v) => {
      if (!v.variationid) return;

      const ref = db.collection("variations").doc(v.variationid);

      batch.set(
        ref,
        {
          id: v.variationid,
          name: v.name || "",
          group: v.groupname || "",
          active: v.status === "1",
        },
        { merge: true }
      );
    });

    // ---------- PRODUCTS ----------
    chunk.forEach((item) => {
      if (!item.itemid) return;

      const ref = db.collection("products").doc(item.itemid);

      const variants =
        item.variation && item.variation.length > 0
          ? item.variation
          : [
              {
                price: item.price,
                name: "Default",
              },
            ];

      const mappedVariants = variants.map((v: PetPoojaVariation) => {
        // 🔥 EID EXTRACTION LOGIC
        let petpoojaId =
          v.eid ||
          v.EID ||
          (v.id ? `V${v.id}` : null);

        // 🔥 DEBUG LOGS (VERY IMPORTANT)
        console.log("📦 ITEM:", item.itemname);
        console.log("🔍 VARIATION RAW:", v);
        console.log("🎯 EXTRACTED EID:", petpoojaId);

        return {
          price: parseFloat(v.price || "0"),
          quantity: v.name || "Standard",
          grind: null,
          sku: null,
          petpoojaId: petpoojaId, // ✅ MAIN FIX
        };
      });

      batch.set(
        ref,
        {
          name: item.itemname || "",
          category:
            categoryMap[item.item_categoryid || ""] ||
            "Uncategorized",
          description: item.itemdescription || "",
          images: item.item_image_url
            ? [item.item_image_url]
            : [],
          sku: item.itemid,

          variants: mappedVariants, // ✅ UPDATED

          updatedAt:
            admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  console.log(`✅ Synced ${items.length} products`);

  return {
    totalProducts: items.length,
  };
}