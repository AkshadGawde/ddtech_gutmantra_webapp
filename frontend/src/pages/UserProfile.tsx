import { motion } from "motion/react";
import { toast } from "sonner";

import {
  LogOut,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Package,
  Loader,
  Edit2,
  Save,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useState, useEffect, useMemo } from "react";
import {
  formatAddress,
  getDisplayName,
  getUserInitials,
} from "@/utils/userHelpers";

import {

  collection,

  query,

  where,

  onSnapshot,

  doc,

  updateDoc,

  orderBy

} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Order {

  id: string;

  orderID: string;

  status: string;

  statusLabel: string;

  items: Array<{ name: string; price: number; quantity: number }>;

  total: number;

  paymentMode: string;

  createdAt: any;

  updatedAt: any;

}

interface UserProfileProps {

  onNavigate: (view: any) => void;

}

export default function UserProfile({ onNavigate }: UserProfileProps) {

  const { user, userData, logout } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  // Change-password form state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwData, setPwData] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const [editData, setEditData] = useState({
  name: "",
  phone: "",

  streetAddress: "",
  apartment: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",

});

  useEffect(() => {
  if (!userData || isEditing) return;

  setEditData({
    name: getDisplayName(userData, user),

    phone: userData.phone || "",

    streetAddress:
      userData.address?.streetAddress || "",

    apartment:
      userData.address?.apartment || "",

    city:
      userData.address?.city || "",

    state:
      userData.address?.state || "",

    pinCode:
      userData.address?.pinCode || "",

    country:
      userData.address?.country || "India",

  });
}, [userData, user, isEditing]);

  const displayName = getDisplayName(userData ?? undefined, user);
  const addressLines = useMemo(() => {
    const formatted = formatAddress(userData?.address);
    return formatted ? formatted.split("\n") : [];
  }, [userData?.address]);

  const hasAddress = addressLines.length > 0;

  /* ================= REALTIME ORDERS ================= */

  useEffect(() => {

    if (!user?.uid) return;

    setLoading(true);

    const q = query(

      collection(db, "orders"),

      where("userId", "==", user.uid),

      orderBy("createdAt", "desc")

    );

    const unsubscribe = onSnapshot(

      q,

      (snapshot) => {

        const ordersData = snapshot.docs.map((doc) => ({

          id: doc.id,

          ...doc.data(),

        })) as Order[];

        setOrders(ordersData);

        setLoading(false);

      },

      (error) => {

        console.error("❌ Realtime error:", error);

        setLoading(false);

      }

    );

    return () => unsubscribe();

  }, [user?.uid]);


  /* ================= STATUS MAPPING ================= */

  const mapStatus = (status: string) => {

    switch (status) {

      case "1":

        return "processing";

      case "10":

        return "completed";

      case "-1":

        return "cancelled";

      case "4":

        return "dispatched";

      case "5":

        return "ready";

      default:

        return "pending";

    }

  };

  /* ================= PROFILE SAVE ================= */

  const handleSaveProfile = async () => {
  try {
    if (!user?.uid) return;

    const firstName =
      editData.name.trim().split(" ")[0] || "";

    const lastName =
      editData.name
        .trim()
        .split(" ")
        .slice(1)
        .join(" ") || "";

    const fullAddress = formatAddress({
      streetAddress: editData.streetAddress,
      apartment: editData.apartment,
      city: editData.city,
      state: editData.state,
      pinCode: editData.pinCode,
      country: editData.country,
    });

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
      name: editData.name,

      updatedAt: new Date(),

      address: {
        firstName,
        lastName,

        streetAddress:
          editData.streetAddress,

        apartment:
          editData.apartment,

        city:
          editData.city,

        state:
          editData.state,

        pinCode:
          editData.pinCode,

        country:
          editData.country,

        fullAddress,
      },

      // legacy support
      street: editData.streetAddress,
      city: editData.city,
      state: editData.state,
      zipCode: editData.pinCode,
    });

    setIsEditing(false);
  } catch (error) {
    console.error(
      "Error saving profile:",
      error
    );
  }
};

  const handleLogout = async () => {

    await logout();

    onNavigate("home");

  };

  const API_BASE = import.meta.env.VITE_API_URL || "https://api.gutmantra.in";

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "At least 8 characters required.";
    if (!/[A-Z]/.test(pw)) return "Must include an uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Must include a lowercase letter.";
    if (!/\d/.test(pw)) return "Must include a number.";
    if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw)) return "Must include a special character.";
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    const validationErr = validatePassword(pwData.newPassword);
    if (validationErr) { setPwError(validationErr); return; }
    if (pwData.newPassword !== pwData.confirmPassword) { setPwError("Passwords do not match."); return; }
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) { setPwError("Authentication error. Please re-login."); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ password: pwData.newPassword, confirmPassword: pwData.confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setPwError(data.error || "Failed to update password."); return; }
      setPwSuccess("Password updated successfully!");
      setPwData({ newPassword: "", confirmPassword: "" });
      setTimeout(() => { setIsChangingPassword(false); setPwSuccess(""); }, 2000);
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const getInitials = (name: string) => getUserInitials(name);
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
                          alt={displayName}
                          className="w-28 h-28 rounded-2xl border-4 border-primary/20 object-cover shadow-md"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-5xl font-bold shadow-md border-4 border-primary/20">
                          {getInitials(displayName)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {displayName}
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

    disabled

    placeholder="Phone number"

    className="w-full px-3 py-2 border border-primary/20 rounded-lg text-sm font-medium bg-gray-100 cursor-not-allowed"

  />

) : (
                        <div className="flex items-center gap-2">

  <p className="text-sm font-bold text-gray-900">

    {userData?.phone || "Not provided"}

  </p>

  {userData?.phoneVerified ? (

    <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold uppercase tracking-wider">

      Verified

    </span>

  ) : (

    <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold uppercase tracking-wider">

      Unverified

    </span>

  )}

</div>

                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">

  Phone number is linked to loyalty rewards and order history.

</p>
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
                    </div>

                    <input
                      type="text"
                      value={editData.streetAddress}

onChange={(e) =>

  setEditData({

    ...editData,

    streetAddress: e.target.value,

  })}
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
                      value={editData.pinCode}

onChange={(e) =>

  setEditData({

    ...editData,

    pinCode: e.target.value,

  })

}
                      placeholder="PIN Code"
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {hasAddress ? (
                      <div className="space-y-2">
                        <p className="font-bold text-gray-900">{displayName}</p>
                        {userData?.phone && (
                          <p className="text-sm text-gray-700">{userData.phone}</p>
                        )}
                        {addressLines.map((line, index) => (
                          <p key={index} className="text-sm text-gray-700">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-bold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 italic mt-4">
                          No address added yet. Click Edit Info to add one.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Change Password Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border-2 border-primary/10 p-6 shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Lock size={22} />
                    Password
                  </h3>
                  <button
                    onClick={() => {
                      setIsChangingPassword(!isChangingPassword);
                      setPwError(""); setPwSuccess("");
                      setPwData({ newPassword: "", confirmPassword: "" });
                    }}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary/20 transition-all font-bold uppercase text-xs tracking-wider"
                  >
                    {isChangingPassword ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {!isChangingPassword ? (
                  <p className="text-sm text-gray-500">
                    Use a strong password to keep your account secure.
                  </p>
                ) : (
                  <form onSubmit={handleChangePassword} noValidate className="space-y-4">
                    {pwError && (
                      <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                        <span className="shrink-0 mt-0.5">⚠</span> {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-start gap-2 bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3">
                        <span className="shrink-0 mt-0.5">✓</span> {pwSuccess}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        New Password
                      </label>
                      <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                        <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                          <Lock size={16} className="text-gray-400" />
                        </span>
                        <input
                          type={showNewPw ? "text" : "password"}
                          placeholder="Min 8 chars, upper, lower, number, symbol"
                          value={pwData.newPassword}
                          onChange={(e) => { setPwData({ ...pwData, newPassword: e.target.value }); setPwError(""); }}
                          disabled={pwLoading}
                          className="flex-1 px-4 py-3 text-sm outline-none bg-white disabled:opacity-50"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="px-3 bg-gray-50 border-l-2 border-gray-200 text-gray-400"
                        >
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Confirm Password
                      </label>
                      <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-primary overflow-hidden transition-colors">
                        <span className="flex items-center px-3 bg-gray-50 border-r-2 border-gray-200">
                          <Lock size={16} className="text-gray-400" />
                        </span>
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          placeholder="Repeat your new password"
                          value={pwData.confirmPassword}
                          onChange={(e) => { setPwData({ ...pwData, confirmPassword: e.target.value }); setPwError(""); }}
                          disabled={pwLoading}
                          className="flex-1 px-4 py-3 text-sm outline-none bg-white disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="px-3 bg-gray-50 border-l-2 border-gray-200 text-gray-400"
                        >
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <ul className="text-[11px] text-gray-400 space-y-0.5 pl-1">
                      {([
                        [/.{8,}/, "At least 8 characters"],
                        [/[A-Z]/, "One uppercase letter"],
                        [/[a-z]/, "One lowercase letter"],
                        [/\d/, "One number"],
                        [/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/, "One special character"],
                      ] as [RegExp, string][]).map(([re, label]) => (
                        <li
                          key={label}
                          className={`flex items-center gap-1.5 ${re.test(pwData.newPassword) ? "text-green-600" : ""}`}
                        >
                          <span>{re.test(pwData.newPassword) ? "✓" : "·"}</span> {label}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="submit"
                      disabled={
                        pwLoading ||
                        !pwData.newPassword ||
                        !pwData.confirmPassword ||
                        !!validatePassword(pwData.newPassword) ||
                        pwData.newPassword !== pwData.confirmPassword
                      }
                      className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                    >
                      {pwLoading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                      ) : "Update Password"}
                    </button>
                  </form>
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
      {orders.map((order, index) => {
        const normalizedStatus = mapStatus(order.status || "");

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            className="border-2 border-gray-100 rounded-xl p-5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">

              {/* LEFT */}
              <div className="flex-1 min-w-[250px]">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <p className="text-sm font-bold text-primary">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>

                  {(() => {
                    const statusLabel = order.statusLabel || normalizedStatus;
                    const badgeClass = (() => {
                      switch (order.status) {
                        case "10":   return "bg-green-100 text-green-700";
                        case "1":
                        case "2":    return "bg-blue-100 text-blue-700";
                        case "4":
                        case "5":    return "bg-amber-100 text-amber-700";
                        case "-1":   return "bg-red-100 text-red-700";
                        default:     return "bg-yellow-100 text-yellow-700";
                      }
                    })();
                    return (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-gray-500 mb-3 font-medium">

  {order.updatedAt?.seconds

    ? new Date(

        order.updatedAt.seconds * 1000

      ).toLocaleDateString("en-IN", {

        year: "numeric",

        month: "short",

        day: "numeric",

        hour: "2-digit",

        minute: "2-digit",

      })

    : "Just now"}

</p>
                <div className="text-xs text-gray-600 space-y-1 font-medium">
                  <p>
                    <span className="font-bold">Items:</span>{" "}
                    {order.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex flex-col items-end gap-3">
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Order Total
                </p>
                <p className="text-3xl font-bold text-primary">
                  ₹{order.total?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 font-medium">{order.paymentMode || "COD"}</p>

                {/* CANCEL BUTTON */}
                {normalizedStatus === "pending" && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch("https://api.gutmantra.in/api/cancel-order", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            orderID: order.id,
                            reason: "User cancelled from app"
                          })
                        });

                        toast.success("Order cancellation requested");
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to cancel order");
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

            </div>

            {/* ITEMS */}
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
                      {item.name} × {item.quantity}  —  ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  )}
</motion.div>
      </div>
    </div>
  );
}