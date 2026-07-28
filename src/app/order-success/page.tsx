"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_order_id", orderId);
      }

      supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single()
        .then(({ data }) => {
          if (data) setOrder(data);
        });
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wide">
            Siparişiniz Alındı!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Harika lezzetler hazırlanmak üzere mutfağa iletildi.
          </p>
        </div>

        {order && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
              <span>Sipariş No:</span>
              <span className="font-bold text-white">#{order.id.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Tutar:</span>
              <span className="font-black text-pink-500 text-sm">₺{Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Ödeme:</span>
              <span className="font-semibold text-slate-300">{order.payment_method}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/orders"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30"
          >
            <ShoppingBag className="w-4 h-4" /> Siparişimi Takip Et <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs py-3 rounded-2xl transition border border-slate-800 flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 text-pink-500" /> Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">Yükleniyor...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}