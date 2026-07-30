"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function LegalContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "kvkk";

  return (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
      {type === "kvkk" && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 border-b pb-2">6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ</h2>
          
          <p className="font-bold text-slate-800">
            Pasha Cafe & Restaurant olarak, veri sorumlusu sıfatıyla, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca müşterilerimizin ve ziyaretçilerimizin kişisel verilerinin güvenliğine ve gizliliğine büyük önem vermekteyiz.
          </p>

          <h3 className="font-bold text-slate-900 pt-2">1. İşlenen Kişisel Verileriniz ve Toplama Yöntemleri</h3>
          <p>
            Web sitemiz (<span className="italic">pashacatering.com / sipariş platformumuz</span>) üzerinden üye olurken, sipariş verirken veya bizimle iletişime geçtiğinizde aşağıdaki kişisel verileriniz elektronik ortamda toplanmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad, soyad, telefon numarası.</li>
            <li><strong>Lokasyon / Adres Bilgileri:</strong> İl, ilçe, mahalle, cadde/sokak, bina/daire numarası ve adres tarifleri.</li>
            <li><strong>İşlem ve Sipariş Bilgileri:</strong> Geçmiş siparişleriniz, sepet içerikleriniz, ödeme tercihleriniz ve restoranımıza ilettiğiniz değerlendirme/yorumlar.</li>
          </ul>

          <h3 className="font-bold text-slate-900 pt-2">2. Kişisel Verilerin İşlenme Amaçları</h3>
          <p>Toplanan kişisel verileriniz şu amaçlarla işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Üyelik işlemlerinin gerçekleştirilmesi ve hesap güvenliğinin sağlanması,</li>
            <li>Siparişlerinizin alınması, hazırlanması, kurye/teslimat süreçlerinin yürütülmesi ve sizinle iletişim kurulması,</li>
            <li>Müşteri memnuniyetinin artırılması, talep ve şikayetlerin yönetilmesi,</li>
            <li>Yasal düzenlemelerin gerektirdiği fatura, muhasebe ve denetim işlemlerinin yerine getirilmesi.</li>
          </ul>

          <h3 className="font-bold text-slate-900 pt-2">3. Kişisel Verilerin Aktarımı</h3>
          <p>
            Kişisel verileriniz, ticari amaçla kesinlikle üçüncü şahıslara satılmaz veya kiralanmaz. Yalnızca sipariş teslimatının yapılabilmesi amacıyla saha personeli/kuryelerimiz ile ve yasal zorunluluklar çerçevesinde yetkili kamu kurum ve kuruluşları ile paylaşılabilir.
          </p>

          <h3 className="font-bold text-slate-900 pt-2">4. KVKK Kapsamındaki Haklarınız</h3>
          <p>
            KVKK'nın 11. maddesi gereğince; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, eksik veya yanlış işlenmişse düzeltilmesini isteme ve silinmesini talep etme hakkına sahipsiniz.
          </p>
        </div>
      )}

      {type === "gizlilik" && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 border-b pb-2">GİZLİLİK POLİTİKASI VE VERİ SAKLAMA SÜRELERİ</h2>

          <p className="font-bold text-slate-800">
            Pasha Cafe & Restaurant olarak müşterilerimizin verilerinin gizliliği bizim için en üst düzey önceliktir. İşbu Gizlilik Politikası, verilerinizin nasıl toplandığını, korunduğunu ve ne kadar süre saklandığını açıklar.
          </p>

          <h3 className="font-bold text-slate-900 pt-2">1. Veri Güvenliği ve Altyapı</h3>
          <p>
            Sistemimiz üzerinden gerçekleştirilen tüm veri iletişimleri SSL güvenlik sertifikalarıyla şifrelenmektedir. Şifreleriniz veritabanımızda açık olarak asla saklanmaz (kriptografik olarak hash'lenir). Kredi kartı veya banka kartı bilgileriniz hiçbir şekilde Pasha Cafe & Restaurant sunucularında tutulmamaktadır.
          </p>

          <h3 className="font-bold text-slate-900 pt-2">2. Kişisel Verilerin Saklama Süreleri (Ne Kadar Süre Tutuluyor?)</h3>
          <p>
            Kişisel verileriniz, işlendikleri amaç için gerekli olan süre boyunca veya ilgili mevzuatlarda öngörülen zamanaşımı süreleri boyunca saklanmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Üyelik ve Hesap Bilgileri:</strong> Hesabınız aktif olduğu sürece saklanır. Üyeliğinizi sonlandırmayı talep ettiğinizde, yasal yükümlülükler saklı kalmak kaydıyla verileriniz sistemimizden silinir veya anonim hale getirilir.
            </li>
            <li>
              <strong>Sipariş ve Fatura Verileri:</strong> Türk Ticaret Kanonu ve Vergi Usul Kanunu hükümleri gereği, gerçekleştirilen tüm ticari işlemler ve sipariş geçmişi/finansal kayıtlar <strong>yasal zorunluluk gereği 10 (on) yıl süreyle</strong> güvenli veritabanlarımızda saklanmak zorundadır. Bu süre sonunda verilerim imha protokollerine uygun olarak silinir.
            </li>
            <li>
              <strong>Müşteri Yorumları ve Değerlendirmeler:</strong> Ürünler veya restoran için yaptığınız yorumlar, platformun kalitesi ve şeffaflığı açısından siz hesabınızı kapatana veya silinmesini talep edene kadar yayında kalır.
            </li>
          </ul>

          <h3 className="font-bold text-slate-900 pt-2">3. Kullanıcı Hakları ve İletişim</h3>
          <p>
            Gizlilik politikamızla ilgili her türlü soru, öneri veya veri silme/güncelleme talepleriniz için işletmemiz ile resmi iletişim kanallarımız (telefon veya adresimiz) üzerinden her zaman irtibat kurabilirsiniz.
          </p>
        </div>
      )}

      {type === "cerez" && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 border-b pb-2">ÇEREZ (COOKIE) POLİTİKASI</h2>

          <p className="font-bold text-slate-800">
            Web sitemizdeki kullanıcı deneyiminizi geliştirmek ve temel fonksiyonları yerine getirmek amacıyla çerezler kullanılmaktadır.
          </p>

          <h3 className="font-bold text-slate-900 pt-2">1. Çerez Nedir ve Neden Kullanılır?</h3>
          <p>
            Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcınız aracılığıyla cihazınıza veya ağ sunucusuna depolanan küçük metin dosyalarıdır. Sitemizde kullanılan çerezler temel olarak şunları sağlar:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Oturum Yönetimi:</strong> Giriş yaptığınızda oturumunuzun açık kalması ve sayfa geçişlerinde kimliğinizin doğrulanması,</li>
            <li><strong>Sepet Bilgisi:</strong> Alışveriş sepetinize eklediğiniz ürünlerin tarayıcınızda (LocalStorage / oturum çerezleri) güvenle tutulması.</li>
          </ul>

          <h3 className="font-bold text-slate-900 pt-2">2. Çerezleri Nasıl Yönetebilirsiniz?</h3>
          <p>
            Tarayıcınızın ayarlarını değiştirerek çerezleri reddedebilir veya silebilirsiniz. Ancak çerezlerin devre dışı bırakılması durumunda sepet yönetimi veya üye girişi gibi temel platform özelliklerinin bir kısmı çalışmayabilir.
          </p>
        </div>
      )}
    </div>
  );
}

export default function LegalPage() {
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
              <ShieldCheck className="w-5 h-5 text-[#ff1773]" /> Yasal Bilgilendirme ve Politikalar
            </h1>
          </div>
        </div>

        <Suspense fallback={<div className="text-xs text-slate-400">Yükleniyor...</div>}>
          <LegalContent />
        </Suspense>
      </div>
    </div>
  );
}