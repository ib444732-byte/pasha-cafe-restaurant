"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Bike,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  RefreshCw,
  Utensils,
  Package,
} from "lucide-react";

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
  courier_id: string | null;
  order_items?: OrderItem[];
}

export default function CourierPage() {
  const router = useRouter();

  const [currentCourier, setCurrentCourier] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"available" | "myOrders" | "history">("available");

  // Ses İznini Tarayıcı Hafızasından (localStorage) Okuyalım
  const [audioAllowed, setAudioAllowed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("courier_audio_enabled") === "true";
    }
    return false;
  });

  useEffect(() => {
    checkCourierAuth();

    // DÜZENLEME: Realtime bağlantısı yanında her 5 saniyede bir otomatik sessiz tarama yapalım (Sayfa yenilemeye gerek kalmaz)
    const interval = setInterval(() => {
      fetchCourierOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleAudio = (enable: boolean) => {
    setAudioAllowed(enable);
    if (typeof window !== "undefined") {
      localStorage.setItem("courier_audio_enabled", enable ? "true" : "false");
    }
  };

  const checkCourierAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "courier" && profile?.role !== "admin") {
      alert("Bu alana erişim yetkiniz yok.");
      router.replace("/");
      return;
    }

    setCurrentCourier(profile);
    fetchCourierOrders();
    subscribeToRealtimeOrders();
  };

  const fetchCourierOrders = async () => {
    const { data: orderData } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (orderData) {
      setOrders(orderData as Order[]);
    }
  };

  const subscribeToRealtimeOrders = () => {
    const channel = supabase
      .channel("courier-orders-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchCourierOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const claimOrder = async (orderId: string) => {
    if (!currentCourier) return;

    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: currentCourier.id,
        status: "yolda",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (error) {
      alert("Sipariş üzerine alınamadı: " + error.message);
    } else {
      alert("🚀 Sipariş üzerinize alındı ve 'Yolda' olarak güncellendi!");
      fetchCourierOrders();
      setActiveSubTab("myOrders");
    }
  };

  const completeOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "teslim_edildi",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (error) {
      alert("Sipariş tamamlanamadı: " + error.message);
    } else {
      alert("🎉 Sipariş başarıyla teslim edildi!");
      fetchCourierOrders();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ALINABİLİR SİPARİŞLER (Boştaki tüm siparişler)
  const availableOrders = orders.filter(
    (o) =>
      !o.courier_id &&
      o.status !== "teslim_edildi" &&
      o.status !== "iptal" &&
      o.status !== "iptal_edildi"
  );

  // ÜZERİMDEKİ SİPARİŞLER
  const myActiveOrders = orders.filter(
    (o) => o.courier_id === currentCourier?.id && o.status === "yolda"
  );

  // BİTEN SİPARİŞLER GEÇMİŞİ
  const myCompletedOrders = orders.filter(
    (o) => o.courier_id === currentCourier?.id && (o.status === "teslim_edildi" || o.status === "iptal" || o.status === "iptal_edildi")
  );

  // Sipariş Durum Rozeti Fonksiyonu
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "bekliyor":
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> YENİ SİPARİŞ
          </span>
        );
      case "hazirlaniyor":
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
            <Utensils className="w-3 h-3" /> MUTFAKTA HAZIRLANIYOR
          </span>
        );
      case "hazir":
        return (
          <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1 animate-pulse">
            <Package className="w-3 h-3" /> KURYEYE HAZIR
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ÜST BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white uppercase tracking-wider">KURYE PANELİ</h1>
              <p className="text-xs text-slate-400">{currentCourier?.full_name || "Kurye Hesabı"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAudio(!audioAllowed)}
              className={`p-2.5 rounded-xl border transition ${
                audioAllowed
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-950 text-slate-400 border-slate-800"
              }`}
              title={audioAllowed ? "Sesli Bildirim Açık" : "Sesli Bildirim Kapalı"}
            >
              {audioAllowed ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={fetchCourierOrders}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SES AÇMA BANNERI */}
        {!audioAllowed && (
          <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <span className="text-purple-200">Sipariş sesli uyarılarını kalıcı açmak için tıklayın:</span>
            <button
              onClick={() => toggleAudio(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl transition shrink-0"
            >
              Aktifleştir
            </button>
          </div>
        )}

        {/* SEKME BUTONLARI */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("available")}
            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "available"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" /> Alınabilir ({availableOrders.length})
          </button>

          <button
            onClick={() => setActiveSubTab("myOrders")}
            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "myOrders"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bike className="w-4 h-4" /> Üzerimdekiler ({myActiveOrders.length})
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Bitenler ({myCompletedOrders.length})
          </button>
        </div>

        {/* 1. SEKME: ALINABİLİR SİPARİŞLER */}
        {activeSubTab === "available" && (
          <div className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
                Alınabilir hazır sipariş bulunmuyor.
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{order.customer_name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-pink-500" /> {order.customer_phone}
                      </p>
                    </div>
                    <div>{renderStatusBadge(order.status)}</div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{order.delivery_address}</p>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 text-xs space-y-1">
                      {order.order_items.map((i) => (
                        <p key={i.id} className="text-slate-400">
                          <strong className="text-pink-400">{i.quantity}x</strong> {i.product_title}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{order.payment_method}</p>
                      <p className="text-base font-black text-pink-500">₺{Number(order.total_amount).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => claimOrder(order.id)}
                      className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-pink-600/30 flex items-center gap-2"
                    >
                      <Bike className="w-4 h-4" /> Üzerime Alıyorum
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. SEKME: ÜZERİMDEKİ AKTİF SİPARİŞLER */}
        {activeSubTab === "myOrders" && (
          <div className="space-y-4">
            {myActiveOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
                Şu an üzerinizde taşınmakta olan sipariş yok.
              </div>
            ) : (
              myActiveOrders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{order.customer_name}</h3>
                      <a 
                        href={`tel:${order.customer_phone}`} 
                        className="text-xs text-pink-400 font-bold flex items-center gap-1 mt-0.5 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> {order.customer_phone} (Ara)
                      </a>
                    </div>
                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                      YOLDA
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{order.delivery_address}</p>
                    </div>
                    
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-bold px-3 py-1.5 rounded-xl transition shrink-0"
                    >
                      Harita
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{order.payment_method}</p>
                      <p className="text-base font-black text-pink-500">₺{Number(order.total_amount).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => completeOrder(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Teslim Ettim
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. SEKME: BİTEN SİPARİŞ GEÇMİŞİ */}
        {activeSubTab === "history" && (
          <div className="space-y-3">
            {myCompletedOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
                Teslim ettiğiniz sipariş kaydı bulunmuyor.
              </div>
            ) : (
              myCompletedOrders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">{order.customer_name}</p>
                    <p className="text-xs text-slate-400">{order.payment_method}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-pink-500">₺{Number(order.total_amount).toFixed(2)}</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold border border-emerald-500/30">
                      Teslim Edildi
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}