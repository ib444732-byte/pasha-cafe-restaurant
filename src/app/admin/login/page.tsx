"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Lock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Supabase Auth ile giriş yap
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Giriş Başarısız: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Kullanıcının admin olup olmadığını kontrol et
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile && profile.role === "admin") {
        router.push("/admin");
      } else {
        alert("Yetkisiz Erişim: Bu hesap yönetici yetkisine sahip değil!");
        await supabase.auth.signOut();
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-[#ff1773]/20" />

      <div className="relative max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#ff1773]/20 border border-[#ff1773]/40 text-[#ff1773] flex items-center justify-center mx-auto mb-2 shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Yönetici Paneli Girişi</h1>
          <p className="text-xs text-slate-400">Pasha Cafe Restaurant Admin Girişi</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Yönetici E-Posta</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@pasha.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#ff1773] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#ff1773] font-medium"
              />
            </div>
          </div>

          {/* KVKK VE GİZLİLİK POLİTİKASI ONAY KUTUSU */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              required
              id="adminKvkk"
              className="mt-0.5 accent-[#ff1773] cursor-pointer"
            />
            <label htmlFor="adminKvkk" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
              <Link href="/legal?type=kvkk" target="_blank" className="text-[#ff1773] font-bold underline">KVKK Aydınlatma Metni</Link>'ni ve <Link href="/legal?type=gizlilik" target="_blank" className="text-[#ff1773] font-bold underline">Gizlilik Politikası</Link>'nı okudum, onaylıyorum.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff1773] hover:bg-[#d90d5c] text-white font-black py-3.5 rounded-2xl transition shadow-lg text-sm tracking-wide uppercase mt-2"
          >
            {loading ? "Giriş Yapılıyor..." : "Yönetici Girişi Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}