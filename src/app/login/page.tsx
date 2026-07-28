"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Lock, Phone, Mail, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false); // Yönetici Giriş Modu

  // Form State'leri
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // OTURUMU AÇIK KULLANICIYI KONTROL ET VE PANELDEN GERİ DÖNMESİNİ ENGELLE
  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "customer";
      if (role === "admin") router.replace("/admin");
      else if (role === "courier") router.replace("/courier");
      else router.replace("/");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isAdminMode) {
      // 1. YÖNETİCİ GİRİŞİ (E-POSTA + ŞİFRE)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        alert("Yönetici girişi başarısız: " + error.message);
      } else if (data.user) {
        router.replace("/admin");
      }
    } else if (isRegister) {
      // 2. MÜŞTERİ KAYDI (TELEFON + ŞİFRE)
      const cleanPhone = phone.replace(/\s+/g, ""); // Boşlukları kaldır
      const syntheticEmail = `${cleanPhone}@pashacafe.com`; // Supabase Auth için telefon bazlı e-posta

      const { error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: cleanPhone,
            role: "customer",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("unique constraint")) {
          alert("⚠️ Bu telefon numarası ile zaten bir hesap oluşturulmuş! Lütfen Giriş Yapın.");
        } else {
          alert("Kayıt hatası: " + error.message);
        }
      } else {
        alert("🎉 Kayıt başarılı! Telefon numaranızla giriş yapabilirsiniz.");
        setIsRegister(false);
      }
    } else {
      // 3. MÜŞTERİ / KURYE GİRİŞİ (TELEFON + ŞİFRE)
      const cleanPhone = phone.replace(/\s+/g, "");
      const syntheticEmail = `${cleanPhone}@pashacafe.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });

      if (error) {
        alert("Giriş başarısız: Telefon numaranızı veya şifrenizi kontrol edin.");
      } else if (data.user) {
        // Kullanıcının veritabanındaki rolünü çek
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const role = profile?.role || "customer";

        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "courier") {
          router.replace("/courier");
        } else {
          router.replace("/");
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* ÜST BAŞLIK */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-pink-500 uppercase tracking-wider">
            PASHA CAFE RESTAURANT
          </h1>
          <p className="text-xs text-slate-400">
            {isAdminMode
              ? "Yönetici Paneli Girişi"
              : isRegister
              ? "Telefon Numaranızla Kaydolun"
              : "Telefon Numaranızla Giriş Yapın"}
          </p>
        </div>

        {/* YÖNETİCİ MODUNDA DEĞİLSEK KAYIT / GİRİŞ SEKME SEÇİMİ */}
        {!isAdminMode && (
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                !isRegister ? "bg-pink-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                isRegister ? "bg-pink-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleAuth} className="space-y-3">
          
          {/* YÖNETİCİ MODU FARKLI İNPUTLAR GÖSTERİR */}
          {isAdminMode ? (
            <>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Yönetici E-posta (yoneticiadmin@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Yönetici Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* MÜŞTERİ VEYA KURYE FORMU (SADECE TELEFON) */}
              {isRegister && (
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Adınız Soyadınız"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  required
                  placeholder="Telefon Numaranız (Örn: 05320000000)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 mt-2"
          >
            {loading
              ? "İşlem Yapılıyor..."
              : isAdminMode
              ? "Yönetici Olarak Giriş Yap"
              : isRegister
              ? "Kayıt Ol"
              : "Giriş Yap"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* ALT KISIM: YÖNETİCİ GİRİŞİ BUTONU */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          {isAdminMode ? (
            <button
              type="button"
              onClick={() => setIsAdminMode(false)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Müşteri Girişine Dön
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdminMode(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-pink-400 transition font-semibold"
            >
              <ShieldCheck className="w-4 h-4 text-pink-500" /> Yönetici Paneli Girişi
            </button>
          )}
        </div>

      </div>
    </div>
  );
}