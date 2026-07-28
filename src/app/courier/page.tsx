"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Bike, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  User, 
  Volume2, 
  VolumeX,
  LogOut,
  RefreshCw,
  AlertCircle
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
  courier_id: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export default function CourierPage() {
  const [activeTab, setActiveTab] = useState<"available" | "mine" | "completed">("available");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierName, setCourierName] = useState<string>("");
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState<boolean>(false);

  // Ses efekti için AudioContext
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ses çalma fonksiyonu (Tarayıcı kısıtlamalarını aşacak şekilde güçlendirildi)
  const playNotificationSound = () => {
    if (!isSoundEnabled) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      
      // Tarayıcı sesi askıya aldıysa (suspended) zorla uyandır
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // First Tone (Yüksek sesli İlk Bip)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5 note
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Second Tone (Daha Yüksek İkinci Bip)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now + 0.25); // D6 note
      gain2.gain.setValueAtTime(0.5, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.5);

      // Cihaz Titreşimi (Mobil tarayıcılar için)
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (err) {
      console.error("Ses çalma hatası:", err);
    }
  };

  // Kurye ismi tanımlama
  useEffect(() => {
    let savedCourier = localStorage.getItem("courier_name");
    if (!savedCourier) {
      savedCourier = prompt("Lütfen Kurye Adınızı Girin:") || "Kurye 1";
      localStorage.setItem("courier_name", savedCourier);
    }
    setCourierName(savedCourier);
    fetchOrders();

    // Supabase Realtime Dinleyici (Yeni sipariş veya durum değişikliğinde ses çal)
    const channel = supabase
      .channel("courier-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          fetchOrders();
          
          // Eğer yeni sipariş eklendiyse veya durumu değiştiyse ses çal & titret
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Tarayıcı Ses İznini Aktifleştirme (Kullanıcı dokunduğu an sesi uyandırır)
  const enableAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      setAudioPermissionGranted(true);
      playNotificationSound(); // İzin verildiğini doğrulamak için test sesi çal
    } catch (err) {
      console.error("Ses izni etkinleştirme hatası:", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Siparişler çekilemedi:", error.message);
    } else if (ordersData) {
      setOrders(ordersData);
    }
    setLoading(false);
  };

  // Siparişi Üzerine Alma
  const claimOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: courierName,
        status: "yolda",
      })
      .eq("id", orderId);

    if (error) {
      alert("Sipariş üstlenilirken hata oluştu: " + error.message);
    } else {
      fetchOrders();
    }
  };

  // Sipariş Durumunu Değiştirme
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Durum güncellenirken hata oluştu: " + error.message);
    } else {
      fetchOrders();
    }
  };

  // Kurye Değiştirme / Çıkış
  const handleLogout = () => {
    localStorage.removeItem("courier_name");
    const newName = prompt("Yeni Kurye Adını Girin:") || "Kurye 1";
    localStorage.setItem("courier_name", newName);
    setCourierName(newName);
    fetchOrders();
  };

  // Filtrelenmiş Siparişler
  const availableOrders = orders.filter((o) => !o.courier_id && o.status !== "teslim_edildi" && o.status !== "iptal");
  const myOrders = orders.filter((o) => o.courier_id === courierName && o.status !== "teslim_edildi" && o.status !== "iptal");
  const completedOrders = orders.filter((o) => o.courier_id === courierName && o.status === "teslim_edildi");

  const displayedOrders = 
    activeTab === "available" ? availableOrders :
    activeTab === "mine" ? myOrders : completedOrders;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* ÜST HEADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center border border-pink-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                KURYE PANELİ
              </h1>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <User className="w-3 h-3 text-pink-400" /> {courierName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sesi Aç/Kapat Butonu */}
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                isSoundEnabled 
                  ? "bg-pink-500/10 border-pink-500/30 text-pink-400" 
                  : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
              title={isSoundEnabled ? "Sesli Bildirim Açık" : "Sesli Bildirim Kapalı"}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Yenile Butonu */}
            <button
              onClick={fetchOrders}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Kurye Değiştir */}
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-red-500/20 border border-slate-700 text-slate-400 hover:text-red-400 rounded-xl transition"
              title="Kurye Değiştir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SES İZNİ UYARI BANNERI (Tarayıcı ilk açıldığında tık isteği) */}
        {!audioPermissionGranted && isSoundEnabled && (
          <div 
            onClick={enableAudio}
            className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/20 transition"
          >
            <div className="flex items-center gap-2 text-xs text-pink-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Sipariş sesli bildirimlerini aktif etmek için tıklayın</span>
            </div>
            <span className="text-[10px] bg-pink-500 text-white px-2 py-1 rounded-lg font-bold">Aktifleştir</span>
          </div>
        )}

        {/* SEKMELER (TABS) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("available")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "available"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Alınabilir</span>
            {availableOrders.length > 0 && (
              <span className="ml-1 bg-slate-950/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {availableOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("mine")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "mine"
                ? "bg-pink-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Üzerimdekiler</span>
            {myOrders.length > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {myOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bitenler</span>
            {completedOrders.length > 0 && (
              <span className="ml-1 bg-slate-950/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {completedOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* LİSTE */}
        {loading ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-7 h-7 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Siparişler yükleniyor...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              {activeTab === "available" && "Şu anda boşta bekleyen sipariş yok."}
              {activeTab === "mine" && "Üzerinizde aktif sipariş bulunmuyor."}
              {activeTab === "completed" && "Henüz tamamlanmış siparişiniz yok."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl transition"
              >
                {/* Kart Üst Bilgi */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {order.customer_name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-pink-500" />
                      <a href={`tel:${order.customer_phone}`} className="hover:underline">
                        {order.customer_phone}
                      </a>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      order.status === "bekliyor"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : order.status === "hazirlaniyor"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : order.status === "yolda"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {order.status === "bekliyor" && "Bekliyor"}
                    {order.status === "hazirlaniyor" && "Mutfakta"}
                    {order.status === "yolda" && "Yolda"}
                    {order.status === "teslim_edildi" && "Teslim Edildi"}
                  </span>
                </div>

                {/* Adres */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 leading-relaxed font-medium">
                    {order.delivery_address}
                  </span>
                </div>

                {/* Ürünler Özet */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-1 border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.product_title}</span>
                        <span className="font-semibold text-slate-300">₺{(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alt Bilgi & Aksiyon Butonu */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Ödeme / Tutar</p>
                    <p className="text-xs font-bold text-slate-200">
                      {order.payment_method} - <span className="text-pink-500 font-extrabold text-sm">₺{order.total_amount.toFixed(2)}</span>
                    </p>
                  </div>

                  {/* Butonlar */}
                  {activeTab === "available" && (
                    <button
                      onClick={() => claimOrder(order.id)}
                      className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95"
                    >
                      Üzerime Alıyorum
                    </button>
                  )}

                  {activeTab === "mine" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "teslim_edildi")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Teslim Et
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}