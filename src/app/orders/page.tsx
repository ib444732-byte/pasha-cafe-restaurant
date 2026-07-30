"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Package, Star, Calendar, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  payment_method: string;
  delivery_address: string;
  order_items: OrderItem[];
}

export default function PastOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Yorum Yapma Modali
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const handleOpenReviewModal = (order: Order) => {
    setSelectedOrder(order);
    // Varsayılan olarak siparişteki ilk ürünün ID'sini seçiyoruz ki boş gitme riski olmasın
    setSelectedProductId(order.order_items?.[0]?.product_id || null);
    setRating(5);
    setComment("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedOrder) return;

    if (!comment.trim()) {
      alert("Lütfen bir yorum yazın.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert([
      {
        user_id: user.id,
        order_id: selectedOrder.id,
        product_id: selectedProductId ? String(selectedProductId) : null, // Ürün ID'sinin tam gitmesi sağlandı
        customer_name: user.user_metadata?.full_name || "Müşteri",
        rating: rating,
        comment: comment.trim(),
        is_approved: false,
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert("Hata oluştu: " + error.message);
    } else {
      alert("Yorumunuz yayınlanacak.");
      setReviewModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-black text-slate-900">Geçmiş Siparişlerim</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-bold">Siparişler yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-600">Henüz geçmiş siparişiniz bulunmuyor.</p>
            <Link
              href="/"
              className="inline-block bg-[#ff1773] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md hover:bg-[#d90d5c] transition"
            >
              Menüye Git
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.status === "teslim_edildi";
              const dateObj = new Date(order.created_at);
              const dateStr = dateObj.toLocaleDateString("tr-TR");
              const timeStr = dateObj.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={order.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-black text-slate-900">Sipariş ID: #{order.id.substring(0, 8)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#ff1773]" /> {dateStr} • <Clock className="w-3 h-3 text-[#ff1773]" /> {timeStr}
                      </p>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border ${
                      isDelivered 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {order.status === "teslim_edildi" ? "Teslim Edildi" : order.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700">Ürünler:</p>
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-slate-600 bg-slate-50 p-2 rounded-xl">
                        <span><strong className="text-[#ff1773]">{item.quantity}x</strong> {item.product_title}</span>
                        <span className="font-bold">{(item.unit_price * item.quantity).toFixed(2)} ₺</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400">Toplam Tutar</p>
                      <p className="text-sm font-black text-[#ff1773]">{Number(order.total_amount).toFixed(2)} ₺</p>
                    </div>

                    {isDelivered && (
                      <button
                        onClick={() => handleOpenReviewModal(order)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" /> Siparişi Değerlendir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-[#ff1773] flex items-center gap-2">
              <Star className="w-5 h-5 fill-[#ff1773]" /> Siparişi Değerlendir
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Değerlendirilecek Ürün</label>
                  <select
                    value={selectedProductId || ""}
                    onChange={(e) => setSelectedProductId(e.target.value || null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#ff1773]"
                  >
                    {selectedOrder.order_items.map((item) => (
                      <option key={item.product_id} value={item.product_id}>
                        {item.product_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">Puanınız</label>
                <div className="flex gap-2 text-amber-400 justify-center py-2 bg-amber-50/50 rounded-2xl border border-amber-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Yorumunuz</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Yemekler ve servis nasıldı?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#ff1773] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff1773] hover:bg-[#d90d5c] text-white font-black py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}