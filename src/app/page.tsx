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
  ShoppingCart,
  Trash2,
  MessageSquare,
  Package,
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

interface RestaurantSettings {
  phone: string;
  address: string;
  min_order_amount: number;
  delivery_time: string;
  free_delivery_text: string;
  free_delivery_limit: number;
  has_free_delivery_limit: boolean;
}

interface ApprovedReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const IL_LISTESI = [
  "Kars",
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın",
  "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
  "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya",
  "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize",
  "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli",
  "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const KARS_ILCELERI: { [key: string]: string[] } = {
  "Merkez": [
    "Ortakapı Mahallesi",
    "Atatürk Mahallesi",
    "Bahçelievler Mahallesi",
    "Bayrampaşa Mahallesi",
    "Bülbül Mahallesi",
    "Cevriye Mahallesi",
    "Cumhuriyet Mahallesi",
    "Fevzi Çakmak Mahallesi",
    "Halitpaşa Mahallesi",
    "İstasyon Mahallesi",
    "Kale İçi Mahallesi",
    "Karadağ Mahallesi",
    "Kazım Karabekir Mahallesi",
    "Örnek Mahallesi",
    "Paşaçayırı Mahallesi",
    "Sukapı Mahallesi",
    "Şehitler Mahallesi",
    "Yeni Mahalle",
    "Yenişehir Mahallesi"
  ],
  "Kağızman": ["Şahindere Mahallesi", "Toprakkale Mahallesi", "Bilekli Mahallesi", "Şehitler Mahallesi"],
  "Sarıkamış": ["Tepe Mahallesi", "Eski Sanayi Mahallesi", "İnönü Mahallesi", "Yeni Mahalle"],
  "Digor": ["Merkez Mahallesi"],
  "Selim": ["Çarşı Mahallesi", "Cumhuriyet Mahallesi"],
  "Akyaka": ["Boyuntaş Mahallesi", "Karakale Mahallesi"],
  "Arpaçay": ["Yalınkaya Mahallesi", "Merkez Mahallesi"],
  "Susuz": ["İnönü Mahallesi", "Cumhuriyet Mahallesi"]
};

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

  const [settings, setSettings] = useState<RestaurantSettings>({
    phone: "0474 212 10 15",
    address: "Ortakapı Mah. Gazi Ahmet Muhtar Paşa Cad. No: 95",
    min_order_amount: 100,
    delivery_time: "25-35 dk",
    free_delivery_text: "ÜCRETSİZ TESLİMAT",
    free_delivery_limit: 200,
    has_free_delivery_limit: true,
  });

  const [approvedReviews, setApprovedReviews] = useState<ApprovedReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(4.8);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("Misafir");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [selectedCity, setSelectedCity] = useState("Kars");
  const [selectedDistrict, setSelectedDistrict] = useState("Merkez");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("Ortakapı Mahallesi");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingDetails, setBuildingDetails] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Kapıda Nakit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    checkUserSession();
    fetchSettings();
    fetchApprovedReviews();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("restaurant_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) setSettings(data);
  };

  const fetchApprovedReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setApprovedReviews(data);
      const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
      const avg = totalRating / data.length;
      setAverageRating(Number(avg.toFixed(1)));
    } else {
      setAverageRating(4.8);
    }
  };

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

  const clearCart = () => {
    setCart([]);
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

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleOpenOrderModal = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setIsCartDrawerOpen(false);
    setIsModalOpen(true);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (city === "Kars") {
      setSelectedDistrict("Merkez");
      setSelectedNeighborhood("Ortakapı Mahallesi");
    } else {
      setSelectedDistrict("Merkez / İlçe");
      setSelectedNeighborhood("");
    }
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    if (selectedCity === "Kars" && KARS_ILCELERI[district]) {
      setSelectedNeighborhood(KARS_ILCELERI[district][0] || "");
    } else {
      setSelectedNeighborhood("");
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (!customerName || !customerPhone || !streetAddress) {
      alert("Lütfen ad, telefon, sokak ve adres bilgilerini eksiksiz doldurun.");
      return;
    }

    const fullDeliveryAddress = `${selectedCity} / ${selectedDistrict} / ${selectedNeighborhood} - ${streetAddress} ${buildingDetails ? `(${buildingDetails})` : ""}`;

    setSubmitting(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: currentUser.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: fullDeliveryAddress,
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
            <div className="flex items-center gap-3">
              {/* ŞIK, GİRİŞ EKRANI İLE UYUMLU GRİ/ANTRASİT DAİRESEL LOGO */}
              <div className="w-11 h-11 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-[10px] uppercase tracking-widest shadow-lg">
                PASHA
              </div>
              <div>
                <p className="text-base font-black text-white">
                  Merhaba{currentUser && profileName !== "Misafir" ? `, ${profileName}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser && (
                <Link
                  href="/orders"
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <Package className="w-4 h-4" />
                  <span>Geçmiş Siparişlerim</span>
                </Link>
              )}

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative bg-white text-[#ff1773] hover:bg-slate-100 text-xs font-black px-4 py-2 rounded-full transition shadow-md flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Sepetim</span>
                {totalCartCount > 0 && (
                  <span className="bg-slate-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black ml-0.5">
                    {totalCartCount}
                  </span>
                )}
              </button>

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
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Çıkış
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-full transition shadow-sm flex items-center gap-1.5"
                >
                  Giriş / Kayıt →
                </Link>
              )}
            </div>
          </div>

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

          {!currentUser && (
            <div className="text-[10px] text-pink-100/80 pt-0.5">
              <Link href="/login" className="hover:underline">Yönetici Girişi</Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
        {/* 2. DİNAMİK ÖNE ÇIKAN RESTORAN KARTI */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="relative h-64 sm:h-80 md:h-96 bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80"
              alt="Pasha Cafe Kebap Dürüm"
              className="w-full h-full object-cover object-center opacity-90 transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

            <div className="absolute top-5 left-5 bg-[#ff1773] text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              {settings.has_free_delivery_limit
                ? `${settings.free_delivery_limit} ₺ ÜZERİ ÜCRETSİZ TESLİMAT`
                : settings.free_delivery_text}
            </div>

            <div className="absolute bottom-5 left-6 right-6 text-white flex justify-between items-end">
              <div>
                <span className="text-[11px] text-pink-200 font-extrabold uppercase tracking-widest">ÖNE ÇIKAN</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-white leading-none mt-1">
                  Pasha Cafe Restaurant
                </h1>
              </div>

              {/* PUAN KUTUSUNA TIKLAYINCA YORUMLAR AÇILIR */}
              <button
                onClick={() => setReviewsModalOpen(true)}
                className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition cursor-pointer"
                title="Tüm Yorumları Gör"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{averageRating}</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 text-xs text-slate-600 space-y-2 bg-white">
            <p className="font-semibold text-slate-500">Cafe • Burger • Kebap • Tatlı • Baklava • Kahve</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px]">
              <p className="flex items-center gap-1.5 font-bold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-[#ff1773]" /> {settings.phone}
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#ff1773] shrink-0" /> {settings.address}
              </p>
              <p className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-[#ff1773]" /> {settings.delivery_time} • Min. sipariş {Number(settings.min_order_amount || 0).toFixed(2)} ₺
              </p>
            </div>
          </div>
        </section>

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
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "text-red-500 fill-red-500" : ""}`} />
                    </button>

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

        {/* ŞIK YASAL BİLGİLENDİRME FOOTER ALANI */}
        <footer className="max-w-6xl mx-auto px-4 md:px-8 py-8 mt-12 border-t border-slate-200 text-center space-y-3">
          <p className="text-xs font-bold text-slate-700">Pasha Cafe & Restaurant © 2026 Tüm Hakları Saklıdır.</p>
          <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-slate-500">
            <Link href="/legal?type=kvkk" className="hover:text-[#ff1773] transition">KVKK Aydınlatma Metni</Link>
            <span>•</span>
            <Link href="/legal?type=gizlilik" className="hover:text-[#ff1773] transition">Gizlilik Politikası</Link>
            <span>•</span>
            <Link href="/legal?type=cerez" className="hover:text-[#ff1773] transition">Çerez Politikası</Link>
          </div>
        </footer>
      </main>

      {/* ⭐ PUANA TIKLAYINCA AÇILAN YORUMLAR MODALI */}
      {reviewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#ff1773]" /> Müşteri Yorumları ({approvedReviews.length})
              </h3>
              <button
                onClick={() => setReviewsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {approvedReviews.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 font-bold">Henüz onaylanmış yorum bulunmuyor.</p>
              ) : (
                approvedReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rev.customer_name}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-black text-slate-700">{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
                    <span className="text-[10px] text-slate-400 block text-right font-medium">
                      {new Date(rev.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-6xl mx-auto bg-[#ff1773] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-40 border border-pink-400/30">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-extrabold opacity-90">SEPET TOPLAMI</p>
            <p className="text-xl font-black">{cartTotal.toFixed(2)} ₺</p>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            Sepetimi Gör <ShoppingCart className="w-4 h-4 text-pink-400" />
          </button>
        </div>
      )}

      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between relative animation-slide-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#ff1773]" />
                <h2 className="font-black text-slate-900 text-base">Sepetim ({totalCartCount})</h2>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-400 py-12">
                  <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-[#ff1773]">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm text-slate-600">Sepetiniz henüz boş</p>
                  <p className="text-xs max-w-xs">Lezzetli yemeklerimizden hemen sepetinize ekleyebilirsiniz.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.product.image_url ||
                          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={item.product.title}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                          {item.product.title}
                        </h4>
                        <p className="text-xs font-black text-[#ff1773] mt-0.5">
                          {(item.product.price * item.quantity).toFixed(2)} ₺
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 rounded-lg bg-white text-[#ff1773] font-black text-xs flex items-center justify-center shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black px-1.5">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.product)}
                        className="w-6 h-6 rounded-lg bg-[#ff1773] text-white font-black text-xs flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <button
                    onClick={clearCart}
                    className="text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold transition text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sepeti Temizle
                  </button>
                  <span className="font-bold text-slate-700">Teslimat Ücreti: ÜCRETSİZ</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-extrabold text-slate-500 uppercase">Ara Toplam</span>
                  <span className="text-xl font-black text-[#ff1773]">{cartTotal.toFixed(2)} ₺</span>
                </div>

                <button
                  onClick={handleOpenOrderModal}
                  className="w-full bg-[#ff1773] hover:bg-[#d90d5c] text-white font-black py-3.5 rounded-2xl transition shadow-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Siparişi Onayla <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-800 border border-slate-100 my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-[#ff1773] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Sipariş & Adres Bilgileri
            </h2>

            <form onSubmit={handleCompleteOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ff1773]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Telefon</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ff1773]"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                <p className="font-extrabold text-[#ff1773] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" /> Teslimat Adresi
                </p>

                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5 text-[11px]">1. İl Seçin</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#ff1773]"
                  >
                    {IL_LISTESI.map((il) => (
                      <option key={il} value={il}>{il}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5 text-[11px]">2. İlçe Seçin</label>
                  {selectedCity === "Kars" ? (
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#ff1773]"
                    >
                      {Object.keys(KARS_ILCELERI).map((ilce) => (
                        <option key={ilce} value={ilce}>{ilce}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="İlçe adını yazın"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#ff1773]"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5 text-[11px]">3. Mahalle Seçin</label>
                  {selectedCity === "Kars" && KARS_ILCELERI[selectedDistrict] ? (
                    <select
                      value={selectedNeighborhood}
                      onChange={(e) => setSelectedNeighborhood(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#ff1773]"
                    >
                      {KARS_ILCELERI[selectedDistrict].map((mah) => (
                        <option key={mah} value={mah}>{mah}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Mahalle adını yazın"
                      value={selectedNeighborhood}
                      onChange={(e) => setSelectedNeighborhood(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:border-[#ff1773]"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5 text-[11px]">4. Cadde / Sokak</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Gazi Ahmet Muhtar Paşa Cad."
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#ff1773]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5 text-[11px]">5. Bina No / Daire No / Adres Tarifi</label>
                  <input
                    type="text"
                    placeholder="Örn: No: 95 Kat: 2 Daire: 4 (Eczane üstü)"
                    value={buildingDetails}
                    onChange={(e) => setBuildingDetails(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#ff1773]"
                  />
                </div>
              </div>

              {/* KVKK ONAY KUTUSU (CHECKBOX) */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  required
                  id="kvkkCheck"
                  className="mt-0.5 accent-[#ff1773] cursor-pointer"
                />
                <label htmlFor="kvkkCheck" className="text-[11px] text-slate-500 leading-tight cursor-pointer">
                  <Link href="/legal?type=kvkk" target="_blank" className="text-[#ff1773] font-bold underline">KVKK Aydınlatma Metni</Link>'ni ve <Link href="/legal?type=gizlilik" target="_blank" className="text-[#ff1773] font-bold underline">Gizlilik Politikası</Link>'nı okudum, onaylıyorum.
                </label>
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