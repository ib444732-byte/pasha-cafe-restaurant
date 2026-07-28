"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock, MapPin, Phone, ShoppingBag, Utensils, Bike } from "lucide-react";

interface OrderItem {
  id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

interface OrderDetail {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

// 1. ASIL SİPARİŞ İÇERİĞİ (Tüm senin mantığın burada)
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("id");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // URL'den veya localStorage'dan sipariş ID'sini al
    const targetOrderId = orderIdFromUrl || localStorage.getItem("last_order_id");

    if (targetOrderId) {
      fetchOrderDetails(targetOrderId);

      // Realtime Dinleyici: Admin durum değiştirdiğinde canlı güncellensin
      const channel = supabase
        .channel(`order-status-${targetOrderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${targetOrderId}`,
          },
          (payload) => {
            setOrder(payload.new as OrderDetail);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [orderIdFromUrl]);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);

    // 1. Sipariş Ana Bilgilerini Çek
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError) {
      console.error("Sipariş çekilemedi:", orderError.message);
    } else if (orderData) {
      setOrder(orderData);

      // 2. Sipariş Kalemlerini (Ürünleri) Çek
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (itemsData) setOrderItems(itemsData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-semibold">Sipariş detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h1 className="text-lg font-bold text-slate-200">Sipariş Bulunamadı</h1>
          <p className="text-xs text-slate-400">
            Aktif bir sipariş kaydı tespit edilemedi. Ana sayfadan sipariş verebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* ÜST BAŞLIK & BAŞARI MESAJI */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl">
          <div className="w-16 h-16 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto border border-pink-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white">Siparişiniz Alındı!</h1>
          <p className="text-xs text-slate-400">
            Teşekkürler <span className="text-slate-200 font-bold">{order.customer_name}</span>, siparişin mutfağa iletildi.
          </p>
        </div>

        {/* CANLI SİPARİŞ DURUMU CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-500" /> Sipariş Durumu
          </h2>

          <div className="grid grid-cols-4 gap-2 text-center pt-2">
            {/* Bekliyor */}
            <div className={`p-3 rounded-2xl border text-xs font-bold transition ${
              order.status === "bekliyor" 
                ? "bg-amber-500/20 border-amber-500 text-amber-400" 
                : "bg-slate-950 border-slate-800/80 text-slate-600"
            }`}>
              <Clock className="w-4 h-4 mx-auto mb-1" />
              <span>Bekliyor</span>
            </div>

            {/* Hazırlanıyor */}
            <div className={`p-3 rounded-2xl border text-xs font-bold transition ${
              order.status === "hazirlaniyor" 
                ? "bg-blue-500/20 border-blue-500 text-blue-400" 
                : "bg-slate-950 border-slate-800/80 text-slate-600"
            }`}>
              <Utensils className="w-4 h-4 mx-auto mb-1" />
              <span>Mutfakta</span>
            </div>

            {/* Yolda */}
            <div className={`p-3 rounded-2xl border text-xs font-bold transition ${
              order.status === "yolda" 
                ? "bg-purple-500/20 border-purple-500 text-purple-400" 
                : "bg-slate-950 border-slate-800/80 text-slate-600"
            }`}>
              <Bike className="w-4 h-4 mx-auto mb-1" />
              <span>Yolda</span>
            </div>

            {/* Teslim Edildi */}
            <div className={`p-3 rounded-2xl border text-xs font-bold transition ${
              order.status === "teslim_edildi" 
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                : "bg-slate-950 border-slate-800/80 text-slate-600"
            }`}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              <span>Teslim</span>
            </div>
          </div>
        </div>

        {/* SİPARİŞ İÇERİĞİ VE BİLGİLER */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sipariş Detayı
          </h2>

          <div className="space-y-2 border-b border-slate-800 pb-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">
                  {item.quantity}x {item.product_title}
                </span>
                <span className="text-slate-400 font-bold">
                  ₺{(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-400 pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <span>{order.delivery_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-pink-500 shrink-0" />
              <span>{order.customer_phone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Ödeme Yöntemi</p>
              <p className="text-xs text-slate-300 font-semibold">{order.payment_method}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Toplam Tutar</p>
              <p className="text-base font-black text-pink-500">₺{order.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 2. VERCEL BUILD HATASINI ÇÖZEN ANA BİLEŞEN (Suspense sarmalı)
export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-semibold">Sipariş detayı yükleniyor...</p>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}