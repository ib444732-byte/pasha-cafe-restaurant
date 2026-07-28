"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Package,
  ShoppingCart,
  RefreshCw,
  CheckCircle,
  Utensils,
  FolderPlus,
  Users,
  Bike,
  Home,
  LogOut,
  Trash2,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar,
  Wallet,
  CreditCard,
  Banknote,
  Award,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
}

interface OrderItem {
  id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  
  // Sekme Yönetimi
  const [activeTab, setActiveTab] = useState<"orders" | "addProduct" | "users" | "analytics">("orders");
  const [orderSubTab, setOrderSubTab] = useState<"active" | "completed">("active");

  // YEREL TARİHİ YYYY-MM-DD BİÇİMİNDE ALAN YARDIMCI
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

  // Form State'leri
  const [newCategoryName, setNewCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    checkAdminAuth();
    fetchData();

    const channel = supabase
      .channel("realtime-admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      alert("Bu alana erişim yetkiniz yok.");
      router.replace("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const fetchData = async () => {
    fetchCategories();
    fetchProducts();
    fetchOrders();
    fetchProfiles();
  };

  const fetchCategories = async () => {
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (catData) {
      setCategories(catData);
      if (catData.length > 0 && !categoryId) {
        setCategoryId(catData[0].id);
      }
    }
  };

  const fetchProducts = async () => {
    const { data: prodData } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (prodData) setProducts(prodData);
  };

  const fetchOrders = async () => {
    const { data: orderData } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (orderData) setOrders(orderData);
  };

  const fetchProfiles = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*");

    if (profileData) setProfiles(profileData);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert("Rol güncellenirken hata oluştu: " + error.message);
    } else {
      alert("Kullanıcı rolü başarıyla güncellendi!");
      fetchProfiles();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Lütfen bir kategori adı yazın.");
      return;
    }

    setCatLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: newCategoryName.trim(),
          sort_order: categories.length + 1,
        },
      ])
      .select()
      .single();

    setCatLoading(false);

    if (error) {
      alert("Kategori eklenirken hata oluştu: " + error.message);
    } else {
      alert(`🎉 "${newCategoryName}" kategorisi eklendi!`);
      setNewCategoryName("");
      fetchCategories();
      if (data) setCategoryId(data.id);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      alert("Kategori silinirken hata: " + error.message);
    } else {
      fetchCategories();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !categoryId) {
      alert("Lütfen ürün başlığı, fiyatı ve kategorisini seçin.");
      return;
    }

    setLoading(true);
    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pasharestaurant")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Görsel yüklenirken hata oluştu: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("pasharestaurant")
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    }

    const { error: dbError } = await supabase.from("products").insert([
      {
        title,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        image_url: imageUrl,
        is_available: true,
      },
    ]);

    setLoading(false);

    if (dbError) {
      alert("Ürün eklenirken hata oluştu: " + dbError.message);
    } else {
      alert("🎉 Ürün başarıyla menüye eklendi!");
      setTitle("");
      setDescription("");
      setPrice("");
      setImageFile(null);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`"${title}" ürününü menüden silmek istediğinize emin misiniz?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Ürün silinirken hata: " + error.message);
    } else {
      fetchProducts();
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert("Durum güncellenemedi: " + error.message);
    } else {
      fetchOrders();
    }
  };

  // Sipariş Filtreleri
  const activeOrders = orders.filter(
    (o) => o.status === "bekliyor" || o.status === "hazirlaniyor" || o.status === "yolda"
  );
  const completedOrders = orders.filter(
    (o) => o.status === "teslim_edildi" || o.status === "iptal"
  );

  // Tarih Karşılaştırması İçin UTC/Yerel Saat Dönüştürücüsü
  const getOrderLocalDate = (createdAtStr: string) => {
    if (!createdAtStr) return "";
    const dateObj = new Date(createdAtStr);
    return getLocalDateString(dateObj);
  };

  // TARİH HESAPLAMALARI
  const todayStr = getLocalDateString(new Date());

  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayObj);

  const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

  // Sadece Teslim Edilen Siparişler
  const deliveredOrders = orders.filter((o) => o.status === "teslim_edildi" && o.created_at);

  // 1. Bugünün Cirosu
  const todayRevenue = deliveredOrders
    .filter((o) => getOrderLocalDate(o.created_at) === todayStr)
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // 2. Dünün Cirosu
  const yesterdayRevenue = deliveredOrders
    .filter((o) => getOrderLocalDate(o.created_at) === yesterdayStr)
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // 3. Bu Ayın Cirosu
  const thisMonthRevenue = deliveredOrders
    .filter((o) => getOrderLocalDate(o.created_at).startsWith(currentYearMonth))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // 4. Takvimden Seçilen Günün Siparişleri & Cirosu
  const selectedDateOrders = deliveredOrders.filter(
    (o) => getOrderLocalDate(o.created_at) === selectedDate
  );

  const selectedDateTotalRevenue = selectedDateOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const selectedDateCashRevenue = selectedDateOrders
    .filter((o) => o.payment_method?.toLowerCase().includes("nakit"))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const selectedDateCardRevenue = selectedDateOrders
    .filter((o) => o.payment_method?.toLowerCase().includes("kart") || o.payment_method?.toLowerCase().includes("pos"))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // --- ÜRÜN BAZLI SATIŞ ANALİZİ (SEÇİLEN TARİHE GÖRE) ---
  const productSalesMap: { [title: string]: { quantity: number; revenue: number } } = {};

  selectedDateOrders.forEach((order) => {
    if (order.order_items && Array.isArray(order.order_items)) {
      order.order_items.forEach((item) => {
        const title = item.product_title || "Bilinmeyen Ürün";
        const qty = item.quantity || 1;
        const rev = (item.unit_price || 0) * qty;

        if (!productSalesMap[title]) {
          productSalesMap[title] = { quantity: 0, revenue: 0 };
        }
        productSalesMap[title].quantity += qty;
        productSalesMap[title].revenue += rev;
      });
    }
  });

  const sortedProductSales = Object.entries(productSalesMap)
    .map(([title, stats]) => ({ title, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  const maxSalesQuantity = sortedProductSales.length > 0 ? sortedProductSales[0].quantity : 1;

  // Takvim Açma Tetikleyicisi
  const openDatePicker = () => {
    if (dateInputRef.current) {
      if ("showPicker" in dateInputRef.current) {
        try {
          (dateInputRef.current as any).showPicker();
        } catch (err) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* BAŞLIK VE SEKME BUTONLARI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black text-pink-500 uppercase tracking-wide flex items-center gap-2">
              <Utensils className="w-6 h-6" /> YÖNETİCİ PANELİ
            </h1>
            <p className="text-xs text-slate-400 mt-1">Pasha Cafe Restaurant Yönetim Ekranı</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800 shrink-0"
            >
              <Home className="w-4 h-4 text-pink-500" /> Ana Sayfa
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/30 transition border border-red-500/30 shrink-0"
            >
              <LogOut className="w-4 h-4 text-red-500" /> Çıkış Yap
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "orders"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Siparişler
            </button>

            <button
              onClick={() => setActiveTab("addProduct")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "addProduct"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4" /> Ürün / Kategori
            </button>

            {/* HESAPLAR / ANALİZ SEKMESİ */}
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Hesaplar / Analiz
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" /> Kullanıcılar & Kuryeler
            </button>
          </div>
        </div>

        {/* 1. SEKME: SİPARİŞLER */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderSubTab("active")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    orderSubTab === "active"
                      ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Canlı Siparişler ({activeOrders.length})
                </button>
                <button
                  onClick={() => setOrderSubTab("completed")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    orderSubTab === "completed"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edilenler / Geçmiş ({completedOrders.length})
                </button>
              </div>

              <button
                onClick={fetchOrders}
                className="p-2 bg-slate-950 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {(orderSubTab === "active" ? activeOrders : completedOrders).length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-400">
                  {orderSubTab === "active"
                    ? "Harika! Şu an bekleyen canlı sipariş yok."
                    : "Tamamlanmış sipariş kaydı bulunmuyor."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(orderSubTab === "active" ? activeOrders : completedOrders).map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {order.customer_name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{order.customer_phone}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase border ${
                          order.status === "bekliyor"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : order.status === "hazirlaniyor"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : order.status === "yolda"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 leading-relaxed">
                      📍 {order.delivery_address}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500">{order.payment_method}</p>
                        <p className="font-black text-pink-500 text-sm">₺{order.total_amount.toFixed(2)}</p>
                      </div>

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 transition cursor-pointer"
                      >
                        <option value="bekliyor">Bekliyor</option>
                        <option value="hazirlaniyor">Hazırlanıyor (Mutfakta)</option>
                        <option value="yolda">Kuryeye Ver (Yolda)</option>
                        <option value="teslim_edildi">Teslim Edildi (Geçmişe At)</option>
                        <option value="iptal">İptal Et</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. SEKME: HESAPLAR / ANALİZ */}
        {activeTab === "analytics" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* ÜST DÖNEMSEL CİRO ÖZET KARTLARI (BUGÜN, DÜN, BU AY) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* BUGÜN */}
              <div className="bg-gradient-to-br from-pink-600 to-pink-700 p-5 rounded-3xl shadow-xl space-y-1 text-white border border-pink-500/30">
                <span className="text-[11px] font-extrabold uppercase opacity-80 tracking-wider">Bugünün Cirosu</span>
                <p className="text-2xl font-black">₺{todayRevenue.toFixed(2)}</p>
                <p className="text-[10px] opacity-75">{todayStr} (Bugün Toplam)</p>
              </div>

              {/* DÜN */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1 text-white">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Dünün Cirosu</span>
                <p className="text-2xl font-black text-amber-400">₺{yesterdayRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">{yesterdayStr}</p>
              </div>

              {/* BU AY */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1 text-white">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Bu Ayın Toplamı</span>
                <p className="text-2xl font-black text-blue-400">₺{thisMonthRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">Bu Ay Genel Toplam</p>
              </div>
            </div>

            {/* TARİH SEÇİCİ UST BAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-500" /> Detaylı Günlük Döküm
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tarih seçerek istediğiniz günün nakit ve kart detaylarını inceleyin
                </p>
              </div>

              {/* TIKLANINCA TAKVİMİ DİREKT AÇAN BUTON */}
              <div 
                onClick={openDatePicker}
                className="flex items-center gap-3 bg-slate-950 border border-slate-800 hover:border-pink-500/50 px-4 py-3 rounded-2xl cursor-pointer transition shadow-inner group"
              >
                <Calendar className="w-5 h-5 text-pink-500 group-hover:scale-110 transition shrink-0" />
                <span className="text-xs font-bold text-slate-300">Tarih Seç:</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-extrabold focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* SEÇİLEN TARİHİN DETAY KARTLARI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* SEÇİLEN GÜN TOPLAM */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Seçilen Gün Toplam</span>
                  <Wallet className="w-5 h-5 text-pink-500" />
                </div>
                <p className="text-2xl font-black text-pink-500">₺{selectedDateTotalRevenue.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">{selectedDateOrders.length} Adet Sipariş</p>
              </div>

              {/* KAPIDA NAKİT */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Kapıda Nakit</span>
                  <Banknote className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400">₺{selectedDateCashRevenue.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">Nakit Tahsil Edilen</p>
              </div>

              {/* KAPIDA KREDİ KARTI */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Kapıda POS / Kart</span>
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-purple-400">₺{selectedDateCardRevenue.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">POS Cihazından Çekilen</p>
              </div>
            </div>

            {/* EN ÇOK SATAN ÜRÜNLER (ÜRÜN BAZLI SATIŞ ANALİZİ) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> {selectedDate} Tarihli Ürün Satış Sıralaması (En Çok Satanlar)
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Toplam {sortedProductSales.length} Farklı Ürün Satıldı</span>
              </div>

              {sortedProductSales.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Bu tarihte satılmış herhangi bir ürün kaydı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedProductSales.map((item, index) => {
                    const percentage = Math.round((item.quantity / maxSalesQuantity) * 100);
                    return (
                      <div key={item.title} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              index === 0 ? "bg-amber-500 text-slate-950" :
                              index === 1 ? "bg-slate-300 text-slate-950" :
                              index === 2 ? "bg-amber-700 text-white" : "bg-slate-800 text-slate-400"
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-bold text-white text-sm">{item.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-right">
                            <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl text-xs">
                              {item.quantity} Adet Satıldı
                            </span>
                            <span className="font-black text-pink-500 text-sm">
                              ₺{item.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Görsel Oran Çubuğu */}
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              index === 0 ? "bg-amber-500" : "bg-pink-500"
                            }`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEÇİLEN TARİHE AİT SİPARİŞ LİSTESİ */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {selectedDate} Tarihli Sipariş Dökümü ({selectedDateOrders.length})
              </h3>

              {selectedDateOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Bu tarihte teslim edilmiş herhangi bir sipariş bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{order.customer_name}</p>
                        <p className="text-xs text-slate-400">{order.customer_phone} • {order.payment_method}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-pink-500">₺{Number(order.total_amount).toFixed(2)}</p>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold border border-emerald-500/30">
                          Teslim Edildi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. SEKME: KATEGORİ / ÜRÜN EKLEME VE SİLME LİSTESİ */}
        {activeTab === "addProduct" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-pink-500 flex items-center gap-2">
                <FolderPlus className="w-4 h-4" /> 1. Adım: Yeni Kategori Ekle / Yönet
              </h3>
              
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kategori Adı"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-slate-100 text-slate-900 font-semibold border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-600"
                />
                <button
                  type="submit"
                  disabled={catLoading}
                  className="bg-pink-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shrink-0 hover:bg-pink-700 transition"
                >
                  {catLoading ? "..." : "Ekle"}
                </button>
              </form>

              <div className="pt-2">
                <p className="text-[11px] text-slate-400 font-semibold mb-2">Mevcut Kategoriler (Silmek için tıklayın):</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-slate-300"
                    >
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-red-400 hover:text-red-300 transition p-0.5"
                        title="Kategoriyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddProduct}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
            >
              <h2 className="text-base font-bold text-pink-500 mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5" /> 2. Adım: Menüye Yeni Ürün Ekle
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Kategori Seçin</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-100 text-slate-900 font-semibold rounded-xl px-4 py-3 text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Ürün Başlığı</label>
                <input
                  type="text"
                  placeholder="Ürün Başlığı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-100 text-slate-900 font-semibold rounded-xl px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Açıklama</label>
                <textarea
                  placeholder="Açıklama"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-100 text-slate-900 font-semibold rounded-xl px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-100 text-slate-900 font-semibold rounded-xl px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Ürün Görseli</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-100 text-slate-800 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-pink-600 font-bold text-white rounded-xl text-xs flex items-center justify-center gap-2 mt-4 hover:bg-pink-700 transition"
              >
                {loading ? "Yükleniyor..." : "Menüye Ekle"}
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-pink-500 flex items-center gap-2 mb-2">
                <Utensils className="w-4 h-4" /> 3. Adım: Menüdeki Ürünleri Yönet / Sil
              </h3>

              {products.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Menüde ürün bulunmuyor.</p>
              ) : (
                <div className="space-y-2">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.title} className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500">
                            Yok
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">{prod.title}</p>
                          <p className="text-[10px] text-pink-500 font-semibold">₺{prod.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition"
                        title="Ürünü Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SEKME: KULLANICI & KURYE YÖNETİMİ */}
        {activeTab === "users" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" /> Kayıtlı Kullanıcılar ve Kurye Atama
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              {profiles.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Kullanıcı bulunamadı.</p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {profile.full_name || "İsimsiz Kullanıcı"}
                        {profile.role === "admin" && (
                          <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] px-2 py-0.5 rounded-full font-black">
                            YÖNETİCİ
                          </span>
                        )}
                        {profile.role === "courier" && (
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                            <Bike className="w-3 h-3" /> KURYE
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{profile.phone || "Telefon Yok"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={profile.role}
                        onChange={(e) => updateUserRole(profile.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-pink-500"
                      >
                        <option value="customer">Müşteri</option>
                        <option value="courier">Kurye</option>
                        <option value="admin">Yönetici</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}