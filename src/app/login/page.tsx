"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Phone, Lock, User, ShoppingBag, ShieldCheck, PhoneCall, MapPin } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form State'leri
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Şifre Tekrarı State'i
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Akıllı Yönetici Girişi Yönlendirmesi
  const handleAdminRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && profile.role === "admin") {
        router.push("/admin");
        return;
      }
    }
    router.push("/admin/login");
  };

  // Giriş Yapma İşlemi
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const digitsOnly = phone.replace(/\D/g, "");
    const rawTenDigits = digitsOnly.startsWith("0") ? digitsOnly.substring(1) : digitsOnly;
    const rawElevenDigits = `0${rawTenDigits}`;

    const candidateEmails = [
      `${rawTenDigits}@pasha.com`,
      `${rawElevenDigits}@pasha.com`,
    ];

    let success = false;

    for (const email of candidateEmails) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (!error) {
        success = true;
        break;
      }
    }

    setLoading(false);

    if (success) {
      router.push("/");
    } else {
      alert("Giriş başarısız: Telefon numaranızı veya şifrenizi kontrol ediniz.");
    }
  };

  // Kayıt Olma İşlemi (Çift Şifre Kontrollü)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !confirmPassword || !fullName) {
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    // Şifre Eşleşme Kontrolü
    if (password !== confirmPassword) {
      alert("Girdiğiniz şifreler birbiriyle eşleşmiyor! Lütfen kontrol ediniz.");
      return;
    }

    if (password.length < 6) {
      alert("Şifreniz en az 6 karakterden oluşmalıdır.");
      return;
    }

    setLoading(true);

    const digitsOnly = phone.replace(/\D/g, "");
    const rawTenDigits = digitsOnly.startsWith("0") ? digitsOnly.substring(1) : digitsOnly;
    const formattedPhone = `0${rawTenDigits}`;
    const formattedEmail = `${rawTenDigits}@pasha.com`;

    const { data, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone: formattedPhone,
        },
      },
    });

    if (error) {
      alert("Kayıt oluşturulamadı: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert([
        {
          id: data.user.id,
          full_name: fullName,
          phone: formattedPhone,
          role: "customer",
        },
      ]);

      alert("🎉 Kaydınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...");
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* 1. ARKA PLAN YEMEK GÖRSELİ */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Sağ Üst Yönetici Girişi Linki */}
      <div className="absolute top-4 right-6 z-20 text-xs text-white/80 hover:text-white font-medium">
        <button
          type="button"
          onClick={handleAdminRedirect}
          className="flex items-center gap-1 hover:underline cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Yönetici Girişi
        </button>
      </div>

      <div className="relative max-w-md w-full space-y-3.5 text-center z-10 py-6">
        {/* LOGO VE BAŞLIK */}
        <div className="space-y-1 mb-2">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center font-black text-xs mx-auto mb-2 tracking-widest shadow-xl">
            PASHA
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight drop-shadow-md">
            Pasha Cafe Restaurant
          </h1>
          <p className="text-xs text-slate-200 font-medium drop-shadow">
            Lezzetin En İyi Adresi
          </p>
        </div>

        {/* 2. MİSAFİR OLARAK DEVAM ET KAPSÜL BUTONU */}
        <button
          onClick={() => router.push("/")}
          className="w-full bg-[#edf4fb] hover:bg-white text-slate-900 font-extrabold text-sm py-3.5 rounded-full transition shadow-xl flex items-center justify-center gap-2 border border-white/80"
        >
          <ShoppingBag className="w-4 h-4 text-slate-700" /> Misafir Olarak Devam Et
        </button>

        {/* 3. GİRİŞ YAP / KAYIT OL İKİLİ TAB KAPSÜLÜ */}
        <div className="bg-[#edf4fb]/90 p-1 rounded-full border border-white flex shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-black transition ${
              activeTab === "login"
                ? "bg-[#334155] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-black transition ${
              activeTab === "register"
                ? "bg-[#334155] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* 4. FORM İNPUTLARI */}
        <form
          onSubmit={activeTab === "login" ? handleLogin : handleRegister}
          className="space-y-3"
        >
          {activeTab === "register" && (
            <div className="relative">
              <User className="absolute left-5 top-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#edf4fb] text-slate-900 placeholder-slate-500 rounded-full pl-12 pr-5 py-3.5 text-xs sm:text-sm focus:outline-none font-bold shadow-md border border-white"
              />
            </div>
          )}

          {/* TELEFON NUMARASI ALANI */}
          <div className="relative">
            <Phone className="absolute left-5 top-4 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              required
              placeholder="Telefon Numaranız (Örn: 0532...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#edf4fb] text-slate-900 placeholder-slate-500 rounded-full pl-12 pr-5 py-3.5 text-xs sm:text-sm focus:outline-none font-bold shadow-md border border-white"
            />
          </div>

          {/* ŞİFRE ALANI */}
          <div className="relative">
            <Lock className="absolute left-5 top-4 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#edf4fb] text-slate-900 placeholder-slate-500 rounded-full pl-12 pr-5 py-3.5 text-xs sm:text-sm focus:outline-none font-bold shadow-md border border-white"
            />
          </div>

          {/* SADECE KAYIT OL TABINDA ÇIKAN 2. ŞİFRE (ŞİFRE TEKRARI) ALANI */}
          {activeTab === "register" && (
            <div className="relative">
              <Lock className="absolute left-5 top-4 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Şifrenizi Tekrar Giriniz"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#edf4fb] text-slate-900 placeholder-slate-500 rounded-full pl-12 pr-5 py-3.5 text-xs sm:text-sm focus:outline-none font-bold shadow-md border border-white"
              />
            </div>
          )}

          {/* GİRİŞ / KAYIT BUTONU */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff1773] hover:bg-[#d90d5c] text-white font-black text-sm py-4 rounded-full transition shadow-2xl mt-1 tracking-wide uppercase"
          >
            {loading
              ? "İşlem yapılıyor..."
              : activeTab === "login"
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>

        {activeTab === "login" && (
          <div className="pt-0.5 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className="text-xs text-white/90 hover:text-white underline font-bold drop-shadow cursor-pointer"
            >
              Hesabınız yok mu? Hemen Kayıt Olun
            </button>
          </div>
        )}

        {/* ALT BİLGİ KARTICIKLARI */}
        <div className="bg-[#edf4fb] border border-white rounded-3xl p-4.5 text-left space-y-2 shadow-2xl mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 text-[#ff1773]" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                Pasha Cafe Restaurant
              </p>
              <p className="text-[#ff1773] font-black text-xs sm:text-sm">
                0474 212 10 15
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-1 border-t border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-[#ff1773]" />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">
              Ortakapı Mahallesi Gazi Ahmet Muhtar Paşa Caddesi No: 95 Merkez / Kars
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}