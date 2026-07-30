"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Phone, Lock, User, ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form State'leri
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Giriş Yapma İşlemi (Telefon Numarası ile)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPhone = phone.replace(/\s+/g, "");
    const formattedEmail = `${cleanPhone}@pasha.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password: password,
    });

    setLoading(false);

    if (error) {
      alert("Giriş yapılamadı: Lütfen telefon numaranızı ve şifrenizi kontrol edin.");
    } else {
      router.push("/");
    }
  };

  // Kayıt Olma İşlemi
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !fullName) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    const cleanPhone = phone.replace(/\s+/g, "");
    const formattedEmail = `${cleanPhone}@pasha.com`;

    const { data, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone: cleanPhone,
        },
      },
    });

    if (error) {
      alert("Kayıt olunamadı: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert([
        {
          id: data.user.id,
          full_name: fullName,
          phone: cleanPhone,
          role: "customer",
        },
      ]);

      alert("🎉 Kayıt başarıyla tamamlandı! Giriş yapılıyor...");
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* 1. DEMODAKİ ARKA PLAN YEMEK GÖRSELİ (KARARTILMIŞ VE NET) */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      {/* Hafif karartma katmanı */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Sağ Üst Silik Yönetici Girişi Linki */}
      <div className="absolute top-4 right-6 z-20 text-xs text-white/80 hover:text-white font-medium">
        <Link href="/admin" className="flex items-center gap-1 hover:underline">
          <ShieldCheck className="w-3.5 h-3.5" /> Yönetici Girişi
        </Link>
      </div>

      <div className="relative max-w-sm w-full space-y-4 text-center z-10">
        {/* LOGO VE BAŞLIK */}
        <div className="space-y-1">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-black text-xs mx-auto mb-2 tracking-widest">
            PASHA
          </div>
          <h1 className="text-2xl font-black font-serif text-white tracking-tight drop-shadow-md">
            Pasha Cafe Restaurant
          </h1>
          <p className="text-xs text-slate-200 font-medium drop-shadow">
            Lezzetin En İyi Adresi
          </p>
        </div>

        {/* 2. MİSAFİR OLARAK DEVAM ET KAPSÜL BUTONU */}
        <button
          onClick={() => router.push("/")}
          className="w-full bg-[#e1f0ff] hover:bg-white text-slate-800 font-bold text-xs py-3 rounded-full transition shadow-lg flex items-center justify-center gap-2 border border-white/60"
        >
          <ShoppingBag className="w-4 h-4 text-slate-600" /> Misafir Olarak Devam Et
        </button>

        {/* 3. GİRİŞ YAP / KAYIT OL İKİLİ TAB KAPSÜLÜ */}
        <div className="bg-[#e1f0ff]/90 p-1 rounded-full border border-white/80 flex shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 rounded-full text-xs font-black transition ${
              activeTab === "login"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 rounded-full text-xs font-black transition ${
              activeTab === "register"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* 4. FORM İNPUTLARI (BEYAZ KAPSÜL YAPISI) */}
        <form
          onSubmit={activeTab === "login" ? handleLogin : handleRegister}
          className="space-y-2.5"
        >
          {activeTab === "register" && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#e1f0ff] text-slate-900 placeholder-slate-500 rounded-full pl-11 pr-4 py-3 text-xs focus:outline-none font-semibold shadow-md border border-white/80"
              />
            </div>
          )}

          {/* Telefon Numarası Alanı */}
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              required
              placeholder="Telefon Numaranız"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#e1f0ff] text-slate-900 placeholder-slate-500 rounded-full pl-11 pr-4 py-3 text-xs focus:outline-none font-semibold shadow-md border border-white/80"
            />
          </div>

          {/* Şifre Alanı */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#e1f0ff] text-slate-900 placeholder-slate-500 rounded-full pl-11 pr-4 py-3 text-xs focus:outline-none font-semibold shadow-md border border-white/80"
            />
          </div>

          {/* PEMBE CANLI GİRİŞ YAP BUTONU */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff1773] hover:bg-[#d90d5c] text-white font-black text-xs py-3.5 rounded-full transition shadow-xl mt-1 tracking-wide uppercase"
          >
            {loading
              ? "İşlem yapılıyor..."
              : activeTab === "login"
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}