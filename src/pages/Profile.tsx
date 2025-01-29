import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  isValidPhone,
  isValidName,
  validateCustomerInfo,
} from "../utils/validation";
import {
  User,
  Save,
  AlertCircle,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PasswordResetForm } from "../components/PasswordResetForm";
import { useNavigate } from "react-router-dom";

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

const ORDERS_PER_PAGE = 3;

type Tab = "profile" | "orders";

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      navigate("/", {
        state: { message: "You have been signed out successfully" },
      });
      return;
    }

    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
        }

        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items (
              id,
              name,
              quantity,
              price
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        setOrders(ordersData || []);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = validateCustomerInfo(profile);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          address: profile.address,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({ submit: "Failed to update profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // Calculate total pages and current page orders
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const currentOrders = orders.slice(
    currentPage * ORDERS_PER_PAGE,
    (currentPage + 1) * ORDERS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-vitanic-dark-olive/60">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-vitanic-pale-olive">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "text-vitanic-olive border-b-2 border-vitanic-olive"
                : "text-vitanic-dark-olive/60 hover:text-vitanic-dark-olive hover:bg-vitanic-pale-olive/20"
            }`}
          >
            <User size={20} />
            My Information
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "orders"
                ? "text-vitanic-olive border-b-2 border-vitanic-olive"
                : "text-vitanic-dark-olive/60 hover:text-vitanic-dark-olive hover:bg-vitanic-pale-olive/20"
            }`}
          >
            <ShoppingBag size={20} />
            My Orders
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Profile Tab */}
          <div className={activeTab === "profile" ? "block" : "hidden"}>
            <div className="space-y-8">
              {/* Profile Information Section */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-vitanic-pale-olive rounded-full">
                    <User className="w-8 h-8 text-vitanic-dark-olive" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-vitanic-dark-olive">
                      My Profile
                    </h1>
                    <p className="text-vitanic-dark-olive/60">
                      Manage your personal information
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                        First Name <span className="text-vitanic-olive">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-vitanic-pale-olive"
                        }`}
                        required
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                        Last Name <span className="text-vitanic-olive">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile({ ...profile, lastName: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                          errors.lastName
                            ? "border-red-500"
                            : "border-vitanic-pale-olive"
                        }`}
                        required
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 border rounded-md bg-gray-50 text-gray-500 border-vitanic-pale-olive"
                    />
                    <p className="mt-1 text-sm text-vitanic-dark-olive/60">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                      Phone Number <span className="text-vitanic-olive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                        errors.phone
                          ? "border-red-500"
                          : "border-vitanic-pale-olive"
                      }`}
                      required
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                      Address <span className="text-vitanic-olive">*</span>
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                        errors.address
                          ? "border-red-500"
                          : "border-vitanic-pale-olive"
                      }`}
                      rows={3}
                      required
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-600">{successMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md transition-all duration-200 ${
                      saving
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-vitanic-dark-olive hover:shadow-md active:transform active:scale-[0.98]"
                    }`}
                  >
                    <Save size={20} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>

              <PasswordResetForm />
            </div>
          </div>

          {/* Orders Tab */}
          <div className={activeTab === "orders" ? "block" : "hidden"}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-vitanic-pale-olive rounded-full">
                <ShoppingBag className="w-8 h-8 text-vitanic-dark-olive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-vitanic-dark-olive">
                  My Orders
                </h2>
                <p className="text-vitanic-dark-olive/60">
                  View your order history
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-vitanic-dark-olive/60">
                  You haven't placed any orders yet.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {currentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-vitanic-pale-olive rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-vitanic-dark-olive/60">
                          Order #{order.id}
                        </p>
                        <p className="text-sm text-vitanic-dark-olive/60">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-vitanic-pale-olive text-vitanic-dark-olive">
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm text-vitanic-dark-olive/80 gap-8"
                        >
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t border-vitanic-pale-olive">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-vitanic-dark-olive">
                            Total
                          </span>
                          <span className="font-semibold text-vitanic-olive">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-vitanic-pale-olive">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        currentPage === 0
                          ? "text-vitanic-dark-olive/40 cursor-not-allowed"
                          : "text-vitanic-dark-olive hover:bg-vitanic-pale-olive"
                      }`}
                    >
                      <ChevronLeft size={20} />
                      Previous
                    </button>
                    <span className="text-sm text-vitanic-dark-olive/60">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        currentPage === totalPages - 1
                          ? "text-vitanic-dark-olive/40 cursor-not-allowed"
                          : "text-vitanic-dark-olive hover:bg-vitanic-pale-olive"
                      }`}
                    >
                      Next
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
