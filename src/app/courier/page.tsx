"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  LogOut,
  RefreshCw,
  Clock,
  PackageCheck,
  UserCheck,
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  courier_id?: string;
}

export default function CourierPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my_orders" | "completed">("available");

  useEffect(() => {
    checkCourierAuth();

    // Realtime Canlı Sipariş Dinleyici
    const channel = supabase
      .channel("realtime-courier-orders")
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

  const checkCourierAuth = async () => {
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

    if (profile?.role !== "courier" && profile?.role !== "admin") {
      alert("Bu sayfaya sadece kuryeler erişebilir.");
      router.replace("/");
      return;
    }

    setCurrentUser(user);
    fetchOrders();
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  // Kuryenin Siparişi Üstlenmesi ("Siparişi Ben Aldım")
  const claimOrder = async (orderId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from("orders")
      .update({
        status: "yolda",
        courier_id: currentUser.id,
      })
      .eq("id", orderId);

    if (error) {
      alert("Sipariş üstlenilirken hata oluştu: " + error.message);
    } else {
      alert("🚀 Sipariş üzerinize alındı ve duruma 'Yolda' yazıldı!");
      fetchOrders();
      setActiveTab("my_orders");
    }
  };

  // Siparişi Teslim Etme
  const markAsDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "teslim_edildi" })
      .eq("id", orderId);

    if (error) {
      alert("Hata oluştu: " + error.message);
    } else {
      alert("🎉 Sipariş başarıyla teslim edildi!");
      fetchOrders();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // Sipariş Filtreleri
  // 1. Havuzdaki Boş Siparişler (Hazırlanıyor veya Bekliyor durumunda olan ve henüz kuryesi olmayanlar)
  const availableOrders = orders.filter(
    (o) => (o.status === "hazirlaniyor" || o.status === "bekliyor") && !o.courier_id
  );

  // 2. Giriş Yapan Kuryenin Üzerindeki Yoldaki Siparişler
  const myActiveOrders = orders.filter(
    (o) => o.courier_id === currentUser?.id && o.status === "yolda"
  );

  // 3. Kuryenin Teslim Ettiği Geçmiş Siparişler
  const myCompletedOrders = orders.filter(
    (o) => o.courier_id === currentUser?.id && o.status === "teslim_edildi"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ÜST PANEL BAŞLIĞI */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-wider">
                KURYE PANELİ
              </h1>
              <p className="text-xs text-slate-400">Canlı Teslimat Yönetim Ekranı</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-2.5 bg-slate-900 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition flex items-center gap-1 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" /> Çıkış
            </button>
          </div>
        </div>

        {/* SEKME BUTONLARI */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("available")}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "available"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Alınabilir ({availableOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("my_orders")}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "my_orders"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bike className="w-3.5 h-3.5" /> Üzerimdekiler ({myActiveOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Bitenler ({myCompletedOrders.length})
          </button>
        </div>

        {/* SİPARİŞ LİSTESİ */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 font-bold">
            Siparişler Yükleniyor...
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. SEKME: ALINABİLİR / SAHİPSİZ SİPARİŞLER */}
            {activeTab === "available" && (
              availableOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-500">
                  Şu an üstlenilmeyi bekleyen yeni paket yok.
                </div>
              ) : (
                availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base">{order.customer_name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{order.customer_phone}</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-bold uppercase">
                        Sipariş Boşta
                      </span>
                    </div>

                    <p className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                      📍 {order.delivery_address}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500">{order.payment_method}</p>
                        <p className="font-black text-pink-500 text-base">₺{order.total_amount.toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => claimOrder(order.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                      >
                        <UserCheck className="w-4 h-4" /> Siparişi Ben Alıyorum
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* 2. SEKME: KUR YENİN ÜZERİNDEKİ (YOLDAKİ) SİPARİŞLER */}
            {activeTab === "my_orders" && (
              myActiveOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-500">
                  Üzerinizde aktif teslimat bulunmuyor. "Alınabilir" sekmesinden sipariş alabilirsiniz.
                </div>
              ) : (
                myActiveOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border-2 border-purple-500/40 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base">{order.customer_name}</h3>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="inline-flex items-center gap-1 text-xs text-pink-400 font-bold mt-1 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" /> {order.customer_phone}
                        </a>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-md font-extrabold uppercase animate-pulse">
                        🚀 Yolda
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <p className="text-xs text-slate-300 leading-relaxed">📍 {order.delivery_address}</p>

                      {/* HARİTADA AÇ BUTONU (Otomatik Kars Şehri İle) */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          order.delivery_address + ", Kars"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-500/30 transition mt-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Haritada Yol Tarifi Al
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-500">{order.payment_method}</p>
                        <p className="font-black text-pink-500 text-base">₺{order.total_amount.toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => markAsDelivered(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                      >
                        <PackageCheck className="w-4 h-4" /> Teslim Edildi
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* 3. SEKME: BİTEN SİPARİŞLER */}
            {activeTab === "completed" && (
              myCompletedOrders.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-500">
                  Henüz teslim ettiğiniz bir sipariş kaydı yok.
                </div>
              ) : (
                myCompletedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{order.customer_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{order.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">₺{order.total_amount.toFixed(2)}</p>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        Teslim Edildi
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}