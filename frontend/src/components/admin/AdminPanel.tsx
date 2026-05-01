import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Edit, Upload, X, Save } from "lucide-react";
import { addProduct, getProducts, uploadProductImage, Product } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    category: "atta",
    description: "",
    price: 0,
    unit: "kg",
    images: [],
    isFeatured: false,
    isBestSeller: false
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const url = await uploadProductImage(e.target.files[0]);
        setNewProduct(prev => ({
          ...prev,
          images: [...(prev.images || []), url]
        }));
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setLoading(true);
    try {
      await addProduct(newProduct as Omit<Product, "id">);
      setIsAdding(false);
      setNewProduct({
        name: "",
        category: "atta",
        description: "",
        price: 0,
        unit: "kg",
        images: [],
        isFeatured: false,
        isBestSeller: false
      });
      fetchProducts();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="p-20 text-center">Loading Auth...</div>;
  if (!isAdmin) return <div className="p-20 text-center text-red-500 font-bold">Access Denied. Admin Only.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter">Admin <span className="text-primary italic font-serif font-normal">Dashboard</span></h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary-dark transition-all"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">New Product</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Product Name</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-4 bg-bg-warm rounded-2xl border border-black/5 focus:outline-none focus:border-primary"
                  placeholder="e.g. Premium Sharbati Atta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full p-4 bg-bg-warm rounded-2xl border border-black/5 focus:outline-none focus:border-primary"
                  >
                    <option value="atta">Atta</option>
                    <option value="oils">Oils</option>
                    <option value="spices">Spices</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Price (₹)</label>
                  <input 
                    type="number" 
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    className="w-full p-4 bg-bg-warm rounded-2xl border border-black/5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Description</label>
                <textarea 
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full p-4 bg-bg-warm rounded-2xl border border-black/5 focus:outline-none focus:border-primary h-32"
                  placeholder="Tell us about the product..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Images</label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {newProduct.images?.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={url} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setNewProduct({...newProduct, images: newProduct.images?.filter((_, idx) => idx !== i)})}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all">
                    <Upload size={24} className="opacity-30 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Upload</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newProduct.isFeatured}
                    onChange={e => setNewProduct({...newProduct, isFeatured: e.target.checked})}
                    className="w-5 h-5 rounded border-black/10 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold">Featured</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newProduct.isBestSeller}
                    onChange={e => setNewProduct({...newProduct, isBestSeller: e.target.checked})}
                    className="w-5 h-5 rounded border-black/10 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold">Best Seller</span>
                </label>
              </div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-accent text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                <Save size={18} /> {loading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-bg-warm border-b border-black/5">
            <tr>
              <th className="p-6 text-xs font-bold uppercase tracking-widest opacity-50">Product</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest opacity-50">Category</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest opacity-50">Price</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest opacity-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-bg-warm/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={product.images[0]} className="w-12 h-12 rounded-lg object-cover" />
                    <span className="font-bold">{product.name}</span>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {product.category}
                  </span>
                </td>
                <td className="p-6 font-bold">₹{product.price}</td>
                <td className="p-6">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit size={16} /></button>
                    <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center opacity-50">Loading products...</div>}
        {!loading && products.length === 0 && <div className="p-20 text-center opacity-50">No products found.</div>}
      </div>
    </div>
  );
}
