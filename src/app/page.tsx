"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  MapPin,
  Star,
  Phone,
  Clock,
  X,
  CheckCircle2,
  User,
  LogOut,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Product {
  id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Home() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Oturum State'i ve Yönetici Rolü
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sipariş Modalı ve Form State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Kapıda Nakit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    checkUserSession();
  }, []);

  // Giriş yapmış kullanıcıyı ve rolünü kontrol et
  const checkUserSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.role === "admin") setIsAdmin(true);
        if (profile.full_name) setCustomerName(profile.full_name);
        if (profile.phone) setCustomerPhone(profile.phone);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
    setCustomerName("");
    setCustomerPhone("");
    alert("Çıkış yapıldı.");
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (catData) setCategories(catData);

    const { data: prodData } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true);

    if (prodData) setProducts(prodData);
    setLoading(false);
  };

  // Ürünü Doğrudan Vitrinden Silme (Sadece Admin İçin)
  const handleDeleteProductDirectly = async (productId: string, title: string) => {
    if (!confirm(`"${title}" ürününü menüden kaldırmak istediğinize emin misiniz?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      alert("Ürün silinirken hata oluştu: " + error.message);
    } else {
      alert(`"${title}" menüden silindi.`);
      fetchData();
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleOpenOrderModal = () => {
    if (!currentUser) {
      alert("Sipariş verebilmek için lütfen önce giriş yapın veya kayıt olun.");
      router.push("/login");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Sipariş verebilmek için lütfen önce giriş yapın.");
      router.push("/login");
      return;
    }

    if (!customerName || !customerPhone || !deliveryAddress) {
      alert("Lütfen isim, telefon ve adres alanlarını eksiksiz doldurun.");
      return;
    }

    setSubmitting(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          total_amount: cartTotal,
          status: "bekliyor",
          is_notified: false,
        },
      ])
      .select()
      .single();

    if (orderError) {
      alert("Sipariş verilirken hata oluştu: " + orderError.message);
      setSubmitting(false);
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_title: item.product.title,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    setSubmitting(false);

    if (itemsError) {
      alert("Sipariş detayları kaydedilemedi: " + itemsError.message);
      return;
    }

    setIsModalOpen(false);
    setCart([]);

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.setItem("last_order_id", orderData.id);
    }
    router.push(`/order-success?id=${orderData.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28">
      {/* ÜST BANNER VE RESTORAN BİLGİSİ (GENİŞLETİLMİŞ MAX-W-5XL) */}
      <div className="relative bg-slate-900 text-white overflow-hidden shadow-md">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-8 space-y-4">
          {/* Rozet & Sağ Üst Butonlar */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-pink-600 text-white text-xs font-black px-3.5 py-1.5 rounded-lg tracking-wider uppercase shadow-md">
              <span>🚀 ÜCRETSİZ TESLİMAT</span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Yönetici Paneli
                </button>
              )}

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold px-3.5 py-1.5 rounded-lg backdrop-blur-md transition border border-red-500/30"
                >
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg backdrop-blur-md transition border border-white/20"
                >
                  <User className="w-4 h-4 text-pink-400" /> Giriş Yap / Kayıt
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight">
                PASHA CAFE RESTAURANT
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Cafe • Burger • Kebap • Tatlı • Baklava • Kahve
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-md shrink-0 self-start md:self-auto">
              <Star className="w-4 h-4 fill-white" />
              <span>4.8 (Çok İyi)</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-pink-500 shrink-0" /> 
              <span className="font-semibold">0474 212 10 15</span>
            </p>
            <p className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Ortakapı Mah. Gazi Ahmet Muhtar Paşa Cad. No: 95 Kars</span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-pink-500 shrink-0" /> 
              <span>25-35 dk • Min. sipariş 100,00 ₺</span>
            </p>
          </div>
        </div>
      </div>

      {/* İÇERİK ALANI (MAX-W-5XL VE FERAH YAPI) */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* ARAMA VE KATEGORİ LİSTESİ */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-pink-600" />
            <input
              type="text"
              placeholder="Yemek, kategori veya malzeme ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30 scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tümü
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30 scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ÜRÜN LİSTESİ (BİLGİSAYARDA DÜZGÜN 2'Lİ GRID YAPISI) */}
        <main>
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400 font-bold">
              Menü Yükleniyor...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-500 space-y-2 shadow-sm">
              <p className="font-semibold text-slate-700 text-sm">
                Bu kategoride henüz ürün bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm hover:shadow-md transition"
                  >
                    {/* Sol Görsel */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 bg-slate-100">
                          Görsel Yok
                        </div>
                      )}
                    </div>

                    {/* Orta Bilgi */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description || "Nefis taze lezzet."}
                      </p>
                      <p className="text-pink-600 font-black text-base mt-2">
                        {product.price.toFixed(2)} ₺
                      </p>
                    </div>

                    {/* Sağ Sepet ve Admin Sil Butonu */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProductDirectly(product.id, product.title)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-200 transition cursor-pointer"
                          title="Ürünü Menüden Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {inCart ? (
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-xl">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-pink-600 font-bold shadow-sm hover:bg-slate-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-xs px-1 text-slate-800">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-7 h-7 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold shadow-sm hover:bg-pink-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-pink-600/20"
                        >
                          <Plus className="w-4 h-4" /> Ekle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ALT PEMBE SEPET BAR (GENİŞLETİLMİŞ) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-5xl mx-auto bg-pink-600 text-white font-bold p-4 rounded-2xl shadow-2xl shadow-pink-600/40 flex items-center justify-between z-40 border border-pink-500/50">
          <div>
            <p className="text-[10px] opacity-90 uppercase tracking-widest font-extrabold">
              Sepet Toplamı
            </p>
            <p className="text-xl leading-none font-black">{cartTotal.toFixed(2)} ₺</p>
          </div>
          <button
            onClick={handleOpenOrderModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
          >
            Siparişi Tamamla <ShoppingBag className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      )}

      {/* SİPARİŞ TAMAMLAMA MODAL PENCERESİ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900 border border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-pink-600 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Sipariş Bilgileri
            </h2>

            <form onSubmit={handleCompleteOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  required
                  placeholder="İbrahim Balcı"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Telefon Numaranız
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0532 000 00 00"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Teslimat Adresiniz
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mahalle, Cadde, Sokak, Bina No / Daire..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                >
                  <option value="Kapıda Nakit">Kapıda Nakit Ödeme</option>
                  <option value="Kapıda Kredi Kartı">Kapıda Kredi Kartı (POS)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Toplam Tutar</p>
                  <p className="text-lg font-black text-pink-600">{cartTotal.toFixed(2)} ₺</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-pink-600/20"
                >
                  {submitting ? (
                    "Gönderiliyor..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Siparişi Onayla
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}