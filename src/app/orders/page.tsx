"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Clock,
  Utensils,
  Bike,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowLeft,
  Package,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

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

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();

    const channel = supabase
      .channel("realtime-customer-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchMyOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);

      // 1. Yerel hafızadaki sipariş ID ve Telefon bilgilerini okuyalım
      const lastOrderId = typeof window !== "undefined" ? localStorage.getItem("last_order_id") : null;
      const lastOrderPhone = typeof window !== "undefined" ? localStorage.getItem("last_order_phone") : null;

      // 2. Kullanıcı oturumunu alalım
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      const conditions: string[] = [];

      // Oturum varsa
      if (user) {
        conditions.push(`user_id.eq.${user.id}`);

        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();

        if (profile?.phone) {
          conditions.push(`customer_phone.eq.${profile.phone}`);
        }
      }

      // Yerel hafızadaki sipariş ID'si varsa
      if (lastOrderId) {
        conditions.push(`id.eq.${lastOrderId}`);
      }

      // Yerel hafızadaki telefon numarası varsa
      if (lastOrderPhone) {
        conditions.push(`customer_phone.eq.${lastOrderPhone}`);
      }

      // Şartlardan herhangi biri uyarsa getir
      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
        const { data } = await query;

        if (data && data.length > 0) {
          setOrders(data as Order[]);
          setLoading(false);
          return;
        }
      }

      setOrders([]);
    } catch (err) {
      console.error("Siparişler getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "bekliyor":
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Sipariş Alındı (Bekliyor)
          </span>
        );
      case "hazirlaniyor":
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" /> Mutfakta Hazırlanıyor
          </span>
        );
      case "hazir":
        return (
          <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Sipariş Hazır (Kurye Bekleniyor)
          </span>
        );
      case "yolda":
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <Bike className="w-3.5 h-3.5" /> Kurye Yolda!
          </span>
        );
      case "teslim_edildi":
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case "iptal":
      case "iptal_edildi":
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> İPTAL EDİLDİ
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ÜST BAŞLIK */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-pink-500" /> Ana Sayfaya Dön
          </Link>

          <h1 className="text-lg font-black text-pink-500 uppercase tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> SİPARİŞLERİM
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Siparişleriniz yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <p className="text-sm font-bold text-slate-400">Henüz aktif bir siparişiniz bulunmuyor.</p>
            <Link
              href="/"
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              Menüyü İncele & Sipariş Ver
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 shadow-xl transition ${
                  order.status === "iptal" || order.status === "iptal_edildi"
                    ? "border-red-500/30"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Sipariş No: #{order.id ? order.id.substring(0, 8) : "-"}
                    </p>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* İPTAL EDİLDİ UYARISI BANNERI */}
                {(order.status === "iptal" || order.status === "iptal_edildi") && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Bu sipariş restoran yönetimi tarafından iptal edilmiştir.</span>
                  </div>
                )}

                {/* Ürün Listesi */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-slate-300">
                        <span>
                          <strong className="text-pink-500">{item.quantity}x</strong> {item.product_title}
                        </span>
                        <span className="font-bold">₺{(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-[11px]">Sipariş detayları getiriliyor...</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{order.payment_method}</p>
                    <p className="text-base font-black text-pink-500">₺{Number(order.total_amount).toFixed(2)}</p>
                  </div>

                  <p className="text-xs text-slate-400 max-w-[200px] text-right truncate">
                    📍 {order.delivery_address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}