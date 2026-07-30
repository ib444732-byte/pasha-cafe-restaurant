"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ShoppingBag, Plus, Minus, Star, Heart, CheckCircle2, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Product {
  id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}

interface ProductReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Ürüne ait onaylanmış yorumlar ve ortalama puan
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [productAvgRating, setProductAvgRating] = useState<number>(4.9);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchProductReviews();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !data) {
      alert("Ürün bulunamadı.");
      router.push("/");
      return;
    }

    setProduct(data);
    setLoading(false);
  };

  const fetchProductReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setProductReviews(data);
      const total = data.reduce((sum, item) => sum + item.rating, 0);
      setProductAvgRating(Number((total / data.length).toFixed(1)));
    } else {
      setProductReviews([]);
      setProductAvgRating(4.9);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    setAddedAnimation(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {}

    setTimeout(() => {
      setAddedAnimation(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center text-slate-500 font-bold text-xs">
        Ürün detayları yükleniyor...
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 font-sans pb-28">
      {/* GÖRSEL VE ÜST NAVİGASYON */}
      <div className="relative h-72 sm:h-96 w-full bg-slate-900">
        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
          }
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "text-red-500 fill-red-500" : "text-slate-600"
              }`}
            />
          </button>
        </div>
      </div>

      {/* İÇERİK KARTI */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-20 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff1773] bg-pink-50 px-2.5 py-1 rounded-full">
                PASHA LEZZETLERİ
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {product.title}
              </h1>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-2xl text-xs font-black shrink-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{productAvgRating}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            {product.description ||
              "Pasha Cafe & Restaurant mutfağında günlük taze malzemeler ve özel baharat karışımlarıyla özenle hazırlanan nefis lezzet."}
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Birim Fiyat
            </span>
            <span className="text-2xl font-black text-[#ff1773]">
              {product.price.toFixed(2)} ₺
            </span>
          </div>
        </div>

        {/* ADET SEÇİM KARTI */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Porsiyon / Adet</span>
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-white text-slate-800 font-black text-sm flex items-center justify-center shadow-sm hover:bg-slate-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-black px-2 text-slate-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-[#ff1773] text-white font-black text-sm flex items-center justify-center shadow-sm hover:bg-[#d90d5c]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 🌟 BU ÜRÜNE AİT ONAYLANMIŞ YORUMLAR BÖLÜMÜ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#ff1773]" /> Bu Ürün İçin Yapılan Yorumlar ({productReviews.length})
          </h2>

          {productReviews.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">
              Bu ürün için henüz onaylanmış bir yorum bulunmuyor. İlk değerlendiren siz olun! (<Link href="/orders" className="text-[#ff1773] font-bold underline">Geçmiş Siparişlerim</Link>)
            </div>
          ) : (
            <div className="space-y-3">
              {productReviews.map((rev) => (
                <div key={rev.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rev.customer_name}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-black text-slate-700">{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-slate-600 italic">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-400 block text-right">
                    {new Date(rev.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ALT SABİT SEPETE EKLE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">TOPLAM TUTAR</p>
            <p className="text-xl font-black text-slate-900">
              {(product.price * quantity).toFixed(2)} ₺
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex-1 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-[#ff1773] hover:bg-[#d90d5c] text-white"
            }`}
          >
            {addedAnimation ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Sepete Eklendi!
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" /> Sepete Ekle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}