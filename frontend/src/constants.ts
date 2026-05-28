export interface Product {
  id: string;
  name: string;
  category: "atta" | "oils" | "spices";
  subcategory?: string;
  price: number;
  unit: string;
  image: string;
  description: string;
  isBestSeller?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  color: string;
  subcategories?: { name: string; slug: string }[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Premium Atta",
    slug: "atta",
    image: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779983517/azu6umhtuzprerhazok7.jpg",
    description: "Stone-ground, nutrient-rich flours for the perfect rotis.",
    color: "bg-orange-50",
    subcategories: [
      { name: "Multigrain Atta", slug: "multigrain" },
      { name: "Wheat Atta", slug: "wheat" },
      { name: "Millets Atta", slug: "millets" },
      { name: "Healthy Atta", slug: "healthy" },
    ],
  },
  {
    id: "cat-2",
    name: "Cold Pressed Oil",
    slug: "oils",
    image: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779983517/ohketk9lydqv6jqhxglm.jpg",
    description: "Pure, unrefined oils extracted using traditional methods.",
    color: "bg-green-50",
  },
  {
    id: "cat-3",
    name: "Handmade Spices",
    slug: "spices",
    image: "https://res.cloudinary.com/dk7ynv44a/image/upload/v1779983518/khhbdic0qg1ixfgb149a.jpg",
    description: "Authentic, aromatic spices ground to perfection.",
    color: "bg-amber-50",
  },
];

export const PRODUCTS: Product[] = [
  // ATTA - Multigrain
  {
    id: "p-2",
    name: "Multigrain Atta",
    category: "atta",
    subcategory: "multigrain",
    price: 85,
    unit: "kg",
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400",
    description: "A healthy blend of 7 grains for a balanced diet.",
    isBestSeller: true,
  },
  // ATTA - Wheat
  {
    id: "p-1",
    name: "Sharbati Wheat Atta",
    category: "atta",
    subcategory: "wheat",
    price: 65,
    unit: "kg",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    description: "Premium Sharbati wheat from Sehore, stone-ground for maximum nutrition.",
  },
  // ATTA - Millets
  {
    id: "p-7",
    name: "Jowar Atta",
    category: "atta",
    subcategory: "millets",
    price: 75,
    unit: "kg",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400",
    description: "Freshly ground sorghum flour, gluten-free and rich in fiber.",
  },
  {
    id: "p-8",
    name: "Bajra Atta",
    category: "atta",
    subcategory: "millets",
    price: 70,
    unit: "kg",
    image: "https://images.unsplash.com/photo-1615485240384-552e4c4e815e?auto=format&fit=crop&q=80&w=400",
    description: "Traditional pearl millet flour, perfect for winter bhakris.",
  },
  // ATTA - Healthy
  {
    id: "p-13",
    name: "Diabetic Friendly Atta",
    category: "atta",
    subcategory: "healthy",
    price: 95,
    unit: "kg",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    description: "Low GI flour blend specially crafted for sugar management.",
  },

  // OILS
  {
    id: "p-3",
    name: "Wood Pressed Groundnut Oil",
    category: "oils",
    price: 240,
    unit: "L",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    description: "Traditionally extracted groundnut oil, rich in Vitamin E.",
    isBestSeller: true,
  },
  {
    id: "p-4",
    name: "Cold Pressed Mustard Oil",
    category: "oils",
    price: 210,
    unit: "L",
    image: "https://images.unsplash.com/photo-162070612211c-6194448e2950?auto=format&fit=crop&q=80&w=400",
    description: "Pungent and pure mustard oil for authentic Indian cooking.",
  },
  {
    id: "p-9",
    name: "Cold Pressed Coconut Oil",
    category: "oils",
    price: 320,
    unit: "L",
    image: "https://images.unsplash.com/photo-1621460245180-60409496e5b0?auto=format&fit=crop&q=80&w=400",
    description: "Pure edible coconut oil, extracted from sun-dried copra.",
  },
  {
    id: "p-10",
    name: "Wood Pressed Safflower Oil",
    category: "oils",
    price: 280,
    unit: "L",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    description: "Heart-healthy Kardi oil, traditionally wood-pressed.",
  },

  // SPICES
  {
    id: "p-5",
    name: "Handmade Turmeric Powder",
    category: "spices",
    price: 120,
    unit: "250g",
    image: "https://images.unsplash.com/photo-1615485240384-552e4c4e815e?auto=format&fit=crop&q=80&w=400",
    description: "High-curcumin turmeric, sun-dried and hand-ground.",
    isBestSeller: true,
  },
  {
    id: "p-6",
    name: "Special Garam Masala",
    category: "spices",
    price: 180,
    unit: "100g",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebe058d?auto=format&fit=crop&q=80&w=400",
    description: "A secret blend of 15 whole spices for rich aroma.",
  },
  {
    id: "p-11",
    name: "Red Chilli Powder",
    category: "spices",
    price: 150,
    unit: "250g",
    image: "https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&q=80&w=400",
    description: "Spicy and vibrant red chilli powder, hand-pounded.",
  },
  {
    id: "p-12",
    name: "Coriander Powder",
    category: "spices",
    price: 90,
    unit: "250g",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebe058d?auto=format&fit=crop&q=80&w=400",
    description: "Aromatic Dhaniya powder, freshly ground from premium seeds.",
  },
];
