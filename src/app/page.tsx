"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Phone,
  MapPin,
  Clock,
  Star,
  Plus,
  Minus,
  Heart,
  ShoppingBag,
  Flame,
  X,
  ShieldCheck,
  LogOut,
  Utensils,
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  const searchRef = useRef<HTMLDivElement>(null);

  // Kullanıcı Oturumu
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Misafir");
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Kapıda Nakit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    checkUserSession();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        if (profile.full_name) {
          setProfileName(profile.full_name);
          setCustomerName(profile.full_name);
        }
        if (profile.phone) setCustomerPhone(profile.phone);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProfileName("Misafir");
    setIsAdmin(false);
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

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
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

    const searchLower = searchTerm.trim().toLocaleLowerCase('tr-TR');

    if (!searchLower) return matchesCategory;

    const titleMatches = (product.title || "")
      .toLocaleLowerCase('tr-TR')
      .includes(searchLower);

    const descMatches = (product.description || "")
      .toLocaleLowerCase('tr-TR')
      .includes(searchLower);

    return matchesCategory && (titleMatches || descMatches);
  });

  const searchSuggestions = searchTerm.trim()
    ? products.filter((p) =>
        (p.title || "")
          .toLocaleLowerCase('tr-TR')
          .includes(searchTerm.trim().toLocaleLowerCase('tr-TR'))
      ).slice(0, 5)
    : [];

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleOpenOrderModal = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (!customerName || !customerPhone || !deliveryAddress) {
      alert("Lütfen isim, telefon ve adres alanlarını doldurun.");
      return;
    }

    setSubmitting(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: currentUser.id,
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
      alert("Sipariş alınamadı: " + orderError.message);
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

    await supabase.from("order_items").insert(orderItems);

    setSubmitting(false);
    setIsModalOpen(false);
    setCart([]);

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.setItem("last_order_id", orderData.id);
      localStorage.setItem("last_order_phone", customerPhone);
    }

    router.push(`/order-success?id=${orderData.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 font-sans pb-28">
      {/* 1. ÜST HEADER */}
      <header className="bg-[#ff1773] text-white pt-6 pb-8 px-4 md:px-8 shadow-md">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            {/* Sol Üst Logo ve Profil Adı */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900/40 border border-white/20 flex items-center justify-center font-black text-[11px] text-pink-100 uppercase tracking-widest">
                PASHA
              </div>
              <div>
                <p className="text-base font-black text-white">
                  Merhaba{currentUser && profileName !== "Misafir" ? `, ${profileName}` : ""}
                </p>
              </div>
            </div>

            {/* Sağ Üst Giriş / Kayıt Butonu */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3.5 py-2 rounded-full backdrop-blur-sm transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Yönetim
                </Link>
              )}

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Çıkış
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-white text-[#ff1773] hover:bg-slate-100 text-xs font-black px-5 py-2 rounded-full transition shadow-sm flex items-center gap-1.5"
                >
                  Giriş / Kayıt →
                </Link>
              )}
            </div>
          </div>

          {/* CANLI VE DAHA BÜYÜK ÖNERİLİ ARAMA ÇUBUĞU */}
          <div className="relative pt-1 z-30" ref={searchRef}>
            <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Yemek, kategori veya malzeme ara (Örn: Hamburger)"
              value={searchTerm}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-full pl-11 pr-10 py-2.5 text-xs focus:outline-none shadow-md font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setIsSearchOpen(false);
                }}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 🎯 BÜYÜTÜLMÜŞ ÖNERİ PANELİ (DROPDOWN) */}
            {isSearchOpen && searchTerm.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 text-slate-800">
                <div className="p-3 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 bg-slate-50/50">
                  <Utensils className="w-3.5 h-3.5 text-[#ff1773]" /> Arama Önerileri
                </div>

                {searchSuggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {searchSuggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="p-3.5 hover:bg-pink-50/40 transition flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={product.title}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition duration-200"
                          />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 group-hover:text-[#ff1773] transition">
                              {product.title}
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-1 font-medium mt-0.5">
                              {product.description || "Lezzetli seçim"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-[#ff1773]">
                            {product.price.toFixed(2)} ₺
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className="w-8 h-8 rounded-full bg-[#ff1773] text-white flex items-center justify-center hover:bg-[#d90d5c] shadow-md transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-slate-400 font-bold">
                    "{searchTerm}" ile eşleşen bir yemek bulunamadı.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Silik Yönetici Giriş Linki */}
          <div className="text-[10px] text-pink-100/80 pt-0.5">
            <Link href="/admin" className="hover:underline">Yönetici Girişi</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
        {/* 2. ÖNE ÇIKAN RESTORAN KARTI */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="relative h-64 sm:h-80 md:h-96 bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80"
              alt="Pasha Cafe Kebap Dürüm"
              className="w-full h-full object-cover object-center opacity-90 transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
            
            {/* ÜCRETSİZ TESLİMAT ROZETİ */}
            <div className="absolute top-5 left-5 bg-[#ff1773] text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              ÜCRETSİZ TESLİMAT
            </div>

            <div className="absolute bottom-5 left-6 right-6 text-white flex justify-between items-end">
              <div>
                <span className="text-[11px] text-pink-200 font-extrabold uppercase tracking-widest">ÖNE ÇIKAN</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-white leading-none mt-1">
                  Pasha Cafe Restaurant
                </h1>
              </div>

              {/* Puan Rozeti */}
              <div className="flex items-center gap-1.5 bg-white/95 text-slate-900 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg">
                <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
                <span>4.8</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 text-xs text-slate-600 space-y-2 bg-white">
            <p className="font-semibold text-slate-500">Cafe • Burger • Kebap • Tatlı • Baklava • Kahve</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px]">
              <p className="flex items-center gap-1.5 font-bold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-[#ff1773]" /> 0474 212 10 15
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#ff1773] shrink-0" /> Ortakapı Mah. Gazi Ahmet Muhtar Paşa Cad. No: 95
              </p>
              <p className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-[#ff1773]" /> 25-35 dk • Min. sipariş 100,00 ₺
              </p>
            </div>
          </div>
        </section>

        {/* 3. 🔥 ÇOK SATANLAR BÖLÜMÜ */}
        {!searchTerm && (
          <section className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> Çok Satanlar
            </h2>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {products.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="w-40 sm:w-44 bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-sm shrink-0 flex flex-col justify-between"
                >
                  <div 
                    onClick={() => router.push(`/product/${product.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="relative h-28 w-full bg-slate-100 rounded-xl overflow-hidden mb-2">
                      <img
                        src={product.image_url || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xs truncate group-hover:text-[#ff1773] transition">
                      {product.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ff1773] text-xs">
                      {product.price.toFixed(2)} ₺
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-6 h-6 rounded-full bg-[#ff1773] text-white flex items-center justify-center hover:bg-[#d90d5c] transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. KATEGORİ SEKMELERİ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#ff1773] text-white shadow-md shadow-pink-900/20"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tümü
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#ff1773] text-white shadow-md shadow-pink-900/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 5. ÜRÜN IZGARASI (GRID LAYOUT) */}
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 font-bold">Menü Yükleniyor...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
              {searchTerm ? `"${searchTerm}" aramasına uygun ürün bulunamadı.` : "Bu kategoride ürün bulunmuyor."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const isFav = favorites[product.id];

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-2.5 flex flex-col justify-between shadow-sm hover:shadow-md transition relative group"
                  >
                    {/* Favori Kalp İkonu */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "text-red-500 fill-red-500" : ""}`} />
                    </button>

                    {/* Tıklanınca Ürün Detayına Gitme Alanı */}
                    <div
                      onClick={() => router.push(`/product/${product.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="relative h-32 sm:h-36 w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                        <img
                          src={product.image_url || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#ff1773] transition">
                          {product.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {product.description || "Nefis taze malzeme."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                      <span className="font-black text-[#ff1773] text-xs sm:text-sm">
                        {product.price.toFixed(2)} ₺
                      </span>

                      {inCart ? (
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-5 h-5 rounded bg-white text-[#ff1773] font-bold text-xs flex items-center justify-center shadow-sm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-black px-1">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-5 h-5 rounded bg-[#ff1773] text-white font-bold text-xs flex items-center justify-center shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-[#ff1773] hover:bg-[#d90d5c] text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ekle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 6. ALT PEMBE SEPET YÜZEN BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-6xl mx-auto bg-[#ff1773] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-40 border border-pink-400/30">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-extrabold opacity-90">SEPET TOPLAMI</p>
            <p className="text-xl font-black">{cartTotal.toFixed(2)} ₺</p>
          </div>
          <button
            onClick={handleOpenOrderModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            Siparişi Tamamla <ShoppingBag className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      )}

      {/* SİPARİŞ TAMAMLAMA MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-800 border border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-[#ff1773] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Sipariş Bilgileri
            </h2>

            <form onSubmit={handleCompleteOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Adınız Soyadınız</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#ff1773]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Telefon Numaranız</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#ff1773]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Teslimat Adresiniz</label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#ff1773] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Ödeme Yöntemi</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#ff1773]"
                >
                  <option value="Kapıda Nakit">Kapıda Nakit Ödeme</option>
                  <option value="Kapıda Kredi Kartı">Kapıda Kredi Kartı (POS)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Toplam Tutar</p>
                  <p className="text-base font-black text-[#ff1773]">{cartTotal.toFixed(2)} ₺</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#ff1773] hover:bg-[#d90d5c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? "Gönderiliyor..." : "Siparişi Onayla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}