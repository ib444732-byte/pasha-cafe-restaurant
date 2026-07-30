"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LegalPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "kvkk";

  const getTitle = () => {
    switch (type) {
      case "gizlilik": return "Gizlilik Politikası";
      case "cerez": return "Çerez Politikası";
      default: return "KVKK Aydınlatma Metni";
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ff1773]" /> {getTitle()}
            </h1>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {type === "kvkk" && (
            <>
              <p className="font-bold text-slate-800">6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla Pasha Cafe & Restaurant olarak kişisel verileriniz aşağıda açıklanan kapsamda işlenecektir.</p>
              <h3 className="font-bold text-slate-900 pt-2">1. Kişisel Verilerin İşlenme Amacı</h3>
              <p>Toplanan kişisel verileriniz (Ad, soyad, telefon, teslimat adresi vb.), siparişlerinizin size en hızlı ve güvenli şekilde ulaştırılması, üyelik işlemlerinin gerçekleştirilmesi ve müşteri memnuniyetinin artırılması amaçlarıyla 6698 sayılı Kanun'un 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları dahilinde işlenmektedir.</p>
              <h3 className="font-bold text-slate-900 pt-2">2. Kişisel Verilerin Aktarımı</h3>
              <p>Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü şahıs veya kurumla ticari amaçla paylaşılmaz. Sadece kurye ve teslimat süreçlerinin yürütülmesi amacıyla ilgili operasyonel birimlerle paylaşılır.</p>
            </>
          )}

          {type === "gizlilik" && (
            <>
              <p className="font-bold text-slate-800">Pasha Cafe & Restaurant olarak müşterilerimizin gizliliğine büyük önem veriyoruz.</p>
              <h3 className="font-bold text-slate-900 pt-2">1. Bilgi Güvenliği</h3>
              <p>Sitemiz üzerinden paylaştığınız tüm şifre ve kişisel bilgileriniz yüksek güvenlikli veritabanlarında şifrelenmiş olarak saklanmaktadır. Kredi kartı bilgileriniz kesinlikle sistemimizde tutulmamaktadır.</p>
              <h3 className="font-bold text-slate-900 pt-2">2. İletişim Tercihleri</h3>
              <p>Sipariş durumu ve bilgilendirmeler dışında tarafınıza istenmeyen pazarlama mesajları gönderilmemektedir.</p>
            </>
          )}

          {type === "cerez" && (
            <>
              <p className="font-bold text-slate-800">Çerez (Cookie) Politikası hakkında bilgilendirme.</p>
              <h3 className="font-bold text-slate-900 pt-2">1. Çerez Nedir?</h3>
              <p>Web sitemizi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza depolanan küçük metin dosyalarıdır. Bu dosyalar oturumunuzun açık kalması ve sepetinizin hatırlanması gibi temel fonksiyonlar için kullanılır.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}