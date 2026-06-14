import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Upload, X, Save, Settings2, Search,
  Package, Wheat, AlertTriangle, CheckCircle2, LogOut,
  RefreshCw,
} from "lucide-react";
import {
  addProduct, getProducts, uploadProductImage,
  updateProductGrindOptions, Product,
} from "../../services/productService";

// ─── tiny helpers ────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: "all",    label: "All",    color: "bg-accent/10 text-accent" },
  { key: "atta",   label: "Atta",   color: "bg-primary/10 text-primary" },
  { key: "oils",   label: "Oils",   color: "bg-blue-100 text-blue-700" },
  { key: "spices", label: "Spices", color: "bg-secondary/10 text-secondary" },
  { key: "other",  label: "Other",  color: "bg-purple-100 text-purple-700" },
];

const GRIND_PRESETS = ["Normal", "Fine (Breek)", "Coarse (Mota)"];

const CAT_COLOR: Record<string, string> = {
  atta:   "bg-primary/10 text-primary",
  oils:   "bg-blue-100 text-blue-700",
  spices: "bg-secondary/10 text-secondary",
  other:  "bg-purple-100 text-purple-700",
};

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("gm_admin_auth");
    window.location.reload();
  };

  // filters
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState<string>("all");

  // add-product drawer
  const [isAdding, setIsAdding]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "", category: "atta", description: "", price: 0,
    images: [], isFeatured: false, isBestSeller: false,
  });

  // grind editor
  const [grindProduct, setGrindProduct] = useState<Product | null>(null);
  const [grindList, setGrindList]       = useState<string[]>([]);
  const [grindInput, setGrindInput]     = useState("");
  const [savingGrind, setSavingGrind]   = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error("Fetch products failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── computed ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = products;
    if (activeTab !== "all") list = list.filter(p => p.category === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeTab, search]);

  const stats = useMemo(() => {
    const atta = products.filter(p => p.category === "atta");
    return {
      total: products.length,
      atta: atta.length,
      withGrind: atta.filter(p => (p.grindOptions || []).length > 0).length,
      noGrind:   atta.filter(p => (p.grindOptions || []).length === 0).length,
    };
  }, [products]);

  // ── add product ────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(e.target.files[0]);
      setNewProduct(p => ({ ...p, images: [...(p.images || []), url] }));
    } catch { } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setSaving(true);
    try {
      await addProduct(newProduct as Omit<Product, "id">);
      setIsAdding(false);
      setNewProduct({ name: "", category: "atta", description: "", price: 0, images: [], isFeatured: false, isBestSeller: false });
      fetchProducts();
    } catch (e) { console.error("Save failed:", e); }
    finally { setSaving(false); }
  };

  // ── grind editor ───────────────────────────────────────────────────────────
  const openGrind = (p: Product) => {
    setGrindProduct(p);
    setGrindList(p.grindOptions || []);
    setGrindInput("");
  };

  const addGrind = () => {
    const v = grindInput.trim();
    if (!v || grindList.includes(v)) return;
    setGrindList(prev => [...prev, v]);
    setGrindInput("");
  };

  const saveGrind = async () => {
    if (!grindProduct) return;
    setSavingGrind(true);
    try {
      await updateProductGrindOptions(grindProduct.id, grindList);
      setProducts(prev =>
        prev.map(p => p.id === grindProduct.id ? { ...p, grindOptions: grindList } : p)
      );
      setGrindProduct(null);
    } catch (e) { console.error("Save grind failed:", e); }
    finally { setSavingGrind(false); }
  };

  // ── guards ─────────────────────────────────────────────────────────────────

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F0]">

      {/* ── TOP NAV ── */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <span className="font-bold text-sm">GutMantra</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">
              {import.meta.env.VITE_ADMIN_EMAIL}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── PAGE TITLE ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Product Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage products & grind options</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white border border-black/5 hover:bg-black/5 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Package,       label: "Total Products",  value: stats.total,     color: "bg-accent/5 text-accent",        iconBg: "bg-accent/10" },
            { icon: Wheat,         label: "Atta Products",   value: stats.atta,      color: "bg-primary/5 text-primary",      iconBg: "bg-primary/10" },
            { icon: CheckCircle2,  label: "Grind Set",       value: stats.withGrind, color: "bg-secondary/5 text-secondary",  iconBg: "bg-secondary/10" },
            { icon: AlertTriangle, label: "Grind Missing",   value: stats.noGrind,   color: "bg-amber-50 text-amber-600",     iconBg: "bg-amber-100" },
          ].map(({ icon: Icon, label, value, color, iconBg }) => (
            <div key={label} className={`${color} rounded-2xl p-4 border border-black/5 bg-white`}>
              <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── GRIND MISSING BANNER ── */}
        {stats.noGrind > 0 && activeTab === "atta" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3"
          >
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {stats.noGrind} atta product{stats.noGrind > 1 ? "s" : ""} missing grind options.
              Click <strong>Grind</strong> on each product to set them.
            </p>
          </motion.div>
        )}

        {/* ── FILTER BAR ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-black/5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.key
                    ? "bg-accent text-white shadow"
                    : "bg-white border border-black/5 text-gray-500 hover:bg-black/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── PRODUCT TABLE ── */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-gray-300">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading products…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-gray-400">
              <Package size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F5F0] border-b border-black/5">
                    {["Product", "Category", "Variants", "Grind", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filtered.map(product => {
                    const grinds = product.grindOptions || [];
                    const isAtta = product.category === "atta";
                    const grindOk = isAtta && grinds.length > 0;
                    const grindMissing = isAtta && grinds.length === 0;

                    return (
                      <tr key={product.id} className="hover:bg-[#FAFAF8] transition-colors">

                        {/* Product */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                              onError={e => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
                              }}
                            />
                            <div>
                              <p className="font-bold text-sm leading-tight">{product.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">₹{product.price}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${CAT_COLOR[product.category] || "bg-gray-100 text-gray-600"}`}>
                            {product.category}
                          </span>
                        </td>

                        {/* Variants */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-gray-500">
                            {(product.variants || []).filter(v => v.quantity !== "Default").length || "—"}
                          </span>
                        </td>

                        {/* Grind */}
                        <td className="px-5 py-4">
                          {grindOk && (
                            <div className="flex flex-wrap gap-1">
                              {grinds.map(g => (
                                <span key={g} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                          {grindMissing && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <AlertTriangle size={11} /> Not set
                            </span>
                          )}
                          {!isAtta && <span className="text-gray-300 text-xs">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isAtta && (
                              <button
                                onClick={() => openGrind(product)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  grindOk
                                    ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                                    : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                                }`}
                              >
                                <Settings2 size={12} />
                                {grindOk ? `Grind (${grinds.length})` : "Set Grind"}
                              </button>
                            )}
                            <button className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── RESULTS COUNT ── */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </div>

      {/* ══ ADD PRODUCT DRAWER ══ */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
                <h2 className="text-lg font-bold">New Product</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <Field label="Product Name">
                  <input
                    value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Sharbati Atta" className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category">
                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value as any })} className={inputCls}>
                      <option value="atta">Atta</option>
                      <option value="oils">Oils</option>
                      <option value="spices">Spices</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Base Price (₹)">
                    <input
                      type="number" value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3} className={inputCls} placeholder="Describe the product…"
                  />
                </Field>

                <Field label="Images">
                  <div className="grid grid-cols-3 gap-3">
                    {newProduct.images?.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button
                          onClick={() => setNewProduct({ ...newProduct, images: newProduct.images?.filter((_, idx) => idx !== i) })}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all">
                      {uploading
                        ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        : <><Upload size={20} className="opacity-30 mb-1" /><span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Upload</span></>
                      }
                      <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} accept="image/*" />
                    </label>
                  </div>
                </Field>

                <div className="flex gap-6">
                  {[["isFeatured", "Featured"], ["isBestSeller", "Best Seller"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setNewProduct({ ...newProduct, [key]: !(newProduct as any)[key] })}
                        className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${(newProduct as any)[key] ? "bg-primary" : "bg-gray-200"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${(newProduct as any)[key] ? "translate-x-5" : ""}`} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="px-6 py-5 border-t border-black/5">
                <button
                  onClick={handleSave} disabled={saving || !newProduct.name}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
                >
                  {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save size={16} /> Save Product</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ GRIND EDITOR MODAL ══ */}
      <AnimatePresence>
        {grindProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setGrindProduct(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-black/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Grind Options</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{grindProduct.name}</p>
                  </div>
                  <button onClick={() => setGrindProduct(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors ml-4 shrink-0">
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Presets */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Quick Add</p>
                  <div className="flex flex-wrap gap-2">
                    {GRIND_PRESETS.map(g => {
                      const added = grindList.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => !added && setGrindList(prev => [...prev, g])}
                          disabled={added}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            added
                              ? "border-secondary/30 bg-secondary/10 text-secondary cursor-default"
                              : "border-black/10 text-gray-600 hover:border-secondary hover:text-secondary hover:bg-secondary/5"
                          }`}
                        >
                          {added ? <CheckCircle2 size={11} /> : <Plus size={11} />} {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom input */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Add Custom</p>
                  <div className="flex gap-2">
                    <input
                      value={grindInput}
                      onChange={e => setGrindInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addGrind()}
                      placeholder="e.g. Extra Fine"
                      className="flex-1 px-4 py-2.5 bg-[#F5F5F0] rounded-xl border border-black/5 focus:outline-none focus:border-secondary text-sm"
                    />
                    <button
                      onClick={addGrind}
                      className="px-4 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-secondary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Current list */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Selected Grinds {grindList.length > 0 && <span className="ml-1 bg-secondary text-white px-1.5 py-0.5 rounded-full">{grindList.length}</span>}
                  </p>
                  {grindList.length === 0 ? (
                    <div className="py-4 text-center bg-[#F5F5F0] rounded-xl border-2 border-dashed border-black/10">
                      <p className="text-xs text-gray-400">No grinds selected yet. Use presets above.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {grindList.map(g => (
                        <span key={g} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-bold">
                          {g}
                          <button
                            onClick={() => setGrindList(prev => prev.filter(x => x !== g))}
                            className="w-4 h-4 bg-secondary/20 hover:bg-red-100 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
                          >
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={saveGrind}
                  disabled={savingGrind}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {savingGrind
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    : <><Save size={15} /> Save to Database</>}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2">Saved grind options survive PetPooja syncs</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── micro helpers ────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-2.5 bg-[#F5F5F0] rounded-xl border border-black/5 focus:outline-none focus:border-primary text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
