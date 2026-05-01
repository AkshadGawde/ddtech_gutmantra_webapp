import { motion } from "motion/react";
import { LogOut, Mail, MapPin, Phone, Calendar, Package, Loader, Edit2, Save, X, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: any[];
  paymentMethod: string;
  transactionId?: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface UserProfileProps {
  onNavigate: (view: any) => void;
}

export default function UserProfile({ onNavigate }: UserProfileProps) {
  const { user, userData, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [editData, setEditData] = useState({
    name: userData?.name || "",
    phone: userData?.phone || "",
    street: userData?.street || "",
    city: userData?.city || "",
    state: userData?.state || "",
    zipCode: userData?.zipCode || "",
  });

  useEffect(() => {
    if (user?.uid) {
      fetchOrders();
      loadAddresses();
    }
  }, [user?.uid]);

  useEffect(() => {
    setEditData({
      name: userData?.name || "",
      phone: userData?.phone || "",
      street: userData?.street || "",
      city: userData?.city || "",
      state: userData?.state || "",
      zipCode: userData?.zipCode || "",
    });
  }, [userData]);

  const fetchOrders = async () => {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", user?.uid)
      );
      const snapshot = await getDocs(ordersQuery);
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
      setOrders(ordersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      if (userData?.addresses) {
        setAddresses(userData.addresses);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.uid) return;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: editData.name,
        phone: editData.phone,
        street: editData.street,
        city: editData.city,
        state: editData.state,
        zipCode: editData.zipCode,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pt-28 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Profile Card */}
            <div className="md:col-span-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                {/* Profile Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-3xl blur-2xl opacity-50" />

                <div className="relative bg-white rounded-3xl p-6 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-shadow">
                  {/* Profile Image */}
                  <div className="mb-6 flex justify-center">
                    {userData?.profileImage ? (
                      <div className="relative">
                        <img
                          src={userData.profileImage}
                          alt={userData?.name}
                          className="w-28 h-28 rounded-2xl border-4 border-primary/20 object-cover shadow-md"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-5xl font-bold shadow-md border-4 border-primary/20">
                          {getInitials(userData?.name || "")}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {userData?.name}
                    </h2>
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                      {userData?.role === "admin" ? "Admin Member" : "Premium Member"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Member since{" "}
                      {userData?.createdAt
                        ? new Date(
                            userData.createdAt.toDate?.() || userData.createdAt
                          ).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-3 rounded-xl hover:bg-primary/20 transition-all font-bold uppercase text-xs tracking-wider"
                    >
                      <Edit2 size={16} />
                      {isEditing ? "Cancel" : "Edit Info"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl hover:bg-red-100 transition-all font-bold uppercase text-xs tracking-wider"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3 space-y-6">
              {/* Account Information Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border-2 border-primary/10 p-6 shadow-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Mail size={22} />
                    Account Information
                  </h3>
                  {isEditing && (
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-all font-bold text-sm uppercase tracking-wider"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Email (Read-only) */}
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                      <Mail size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-1">
                        Email Address
                      </p>
                      <p className="text-sm font-bold text-gray-900">{userData?.email || user?.email}</p>
                    </div>
                  </div>

                  {/* Phone (Editable) */}
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-1">
                        Phone Number
                      </p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) =>
                            setEditData({ ...editData, phone: e.target.value })
                          }
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-sm font-medium"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-900">
                          {userData?.phone || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary/10 p-3 rounded-lg flex-shrink-0">
                      <Calendar size={20} className="text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-1">
                        Member Since
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {userData?.createdAt
                          ? new Date(
                              userData.createdAt.toDate?.() || userData.createdAt
                            ).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-1">
                        Account Status
                      </p>
                      <p className="text-sm font-bold text-green-600">
                        {userData?.role === "admin" ? "Verified Admin" : "Verified User"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Delivery Address Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border-2 border-secondary/10 p-6 shadow-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                    <MapPin size={22} />
                    Delivery Address
                  </h3>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Editable Address Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        placeholder="Full Name"
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                      />
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        placeholder="Phone"
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                      />
                    </div>

                    <input
                      type="text"
                      value={editData.street}
                      onChange={(e) => setEditData({ ...editData, street: e.target.value })}
                      placeholder="Street Address"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        placeholder="City"
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                      />
                      <input
                        type="text"
                        value={editData.state}
                        onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                        placeholder="State"
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                      />
                    </div>

                    <input
                      type="text"
                      value={editData.zipCode}
                      onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })}
                      placeholder="PIN Code"
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">{userData?.name}</p>
                      <p className="text-sm text-gray-700">{userData?.phone}</p>
                      <p className="text-sm text-gray-700">{userData?.street}</p>
                      <p className="text-sm text-gray-700">
                        {userData?.city}, {userData?.state} {userData?.zipCode}
                      </p>
                    </div>
                    {!(userData?.street) && (
                      <p className="text-xs text-gray-500 italic mt-4">No address added yet. Click Edit Info to add one.</p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Quick Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-primary/20">
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                    Total Orders
                  </p>
                  <p className="text-4xl font-bold text-primary">{orders.length}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {orders.length === 1 ? "1 order placed" : `${orders.length} orders placed`}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-6 border-2 border-secondary/20">
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">
                    Total Spent
                  </p>
                  <p className="text-4xl font-bold text-secondary">
                    ₹{orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Across all purchases</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Order History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border-2 border-primary/10 p-6 shadow-md"
        >
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <Package size={24} />
            Order History
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="animate-spin text-primary" size={40} />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-primary/30" />
              </div>
              <p className="text-gray-600 font-bold mb-4 text-lg">No orders yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Start shopping to see your orders here
              </p>
              <button
                onClick={() => onNavigate("category", { category: "atta" })}
                className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold uppercase text-sm tracking-wider inline-block"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="border-2 border-gray-100 rounded-xl p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <p className="text-sm font-bold text-primary">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 font-medium">
                        {new Date(order.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="text-xs text-gray-600 space-y-1 font-medium">
                        <p>
                          <span className="font-bold">Items:</span> {order.items?.length || 0}
                        </p>
                        <p>
                          <span className="font-bold">Payment:</span> {order.paymentMethod}
                        </p>
                        {order.transactionId && (
                          <p>
                            <span className="font-bold">Transaction ID:</span>{" "}
                            {order.transactionId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">
                        Order Total
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        ₹{order.total?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">
                        Items Ordered:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold"
                          >
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
