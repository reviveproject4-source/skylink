"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  ExternalLink,
  Copy,
  Save,
  Check,
  Smartphone,
  Monitor,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Code2,
  Eye,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  pricePromo: number;
  accessLink?: string | null;
  filePath?: string | null;
}

interface MetaPixelItem {
  id: string;
  name: string;
  pixelId: string;
  capiToken?: string | null;
}

interface LpStudioEditorProps {
  initialLp?: {
    id?: string;
    title: string;
    slug: string;
    htmlContent: string;
    productId?: string | null;
    metaPixelId?: string | null;
    customPixelId?: string | null;
    isLive?: boolean;
  };
  products: Product[];
  metaPixels: MetaPixelItem[];
}

export default function LpStudioEditor({
  initialLp,
  products,
  metaPixels,
}: LpStudioEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState(initialLp?.id || null);
  const [title, setTitle] = useState(initialLp?.title || "Halaman Utama");
  const [slug, setSlug] = useState(initialLp?.slug || "promo");
  const [productId, setProductId] = useState(
    initialLp?.productId || (products[0]?.id ?? "")
  );

  // Meta Pixel assignment for this specific Landing Page
  const [metaPixelId, setMetaPixelId] = useState(
    initialLp?.metaPixelId || (metaPixels[0]?.id ?? "")
  );
  const [customPixelId, setCustomPixelId] = useState(
    initialLp?.customPixelId || ""
  );

  // Selected pixel details
  const activePixel =
    metaPixels.find((p) => p.id === metaPixelId) || null;
  const targetPixelId =
    metaPixelId === "custom"
      ? customPixelId.trim()
      : activePixel?.pixelId || "";

  // Validasi Aset Produk (Poin 5: Cek apakah produk memiliki link atau file)
  const selectedProduct = products.find((p) => p.id === productId);
  const isProductMissingAsset =
    selectedProduct &&
    !Boolean(selectedProduct.accessLink?.trim() || selectedProduct.filePath?.trim());

  const [htmlContent, setHtmlContent] = useState(
    initialLp?.htmlContent ||
      `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Landing Page Produk Digital</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-sky-50 to-white min-h-screen font-sans text-slate-800">
  <div class="max-w-2xl mx-auto px-6 py-16 text-center">
    <span class="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
      Rilisan Baru
    </span>
    <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
      Kuasai Skill Digital Hari Ini
    </h1>
    <p class="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
      Akses materi premium eksklusif untuk melipatgandakan omset dan performa bisnis Anda.
    </p>

    <!-- Pricing Card -->
    <div class="mt-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-left">
      <div class="flex items-baseline justify-between border-b pb-4 mb-6">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Harga Spesial</span>
          <span class="text-3xl font-black text-sky-600">Rp 99.000</span>
          <span class="text-sm text-slate-400 line-through ml-2">Rp 299.000</span>
        </div>
        <span class="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full">Hemat 67%</span>
      </div>

      <ul class="space-y-3 text-sm text-slate-700 mb-8">
        <li class="flex items-center gap-2">✅ Full Video Materi HD + Modul Praktek</li>
        <li class="flex items-center gap-2">✅ Akses Lifetime (Seumur Hidup)</li>
        <li class="flex items-center gap-2">✅ Dukungan Konsultasi Personal</li>
      </ul>

      <a id="btn-order" href="/checkout/${products[0]?.id || ''}?lp=${slug}" class="block w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-center rounded-2xl shadow-lg shadow-sky-500/25 transition-all text-lg">
        🔥 Beli Sekarang (Akses Instan)
      </a>
      <p class="text-center text-xs text-slate-400 mt-2.5">Garansi 100% materi terupdate & pengiriman otomatis</p>
    </div>
  </div>
</body>
</html>`
  );

  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Pixel detection logic: checks if the assigned pixel ID is present in html
  const hasPixel = (() => {
    if (!targetPixelId) {
      // If no pixel assigned yet, check if ANY fbq is in code
      return htmlContent.includes("fbq(") || htmlContent.includes("connect.facebook.net");
    }
    return (
      htmlContent.includes(targetPixelId) ||
      (htmlContent.includes("fbq(") && htmlContent.includes("init"))
    );
  })();

  // Handle file upload (.html)
  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setHtmlContent(content);
        }
      };
      reader.readAsText(file);
    }
  };

  // Insert standard Meta pixel script automatically for THIS LP
  const injectPixelCode = () => {
    const fbId = targetPixelId || "123456789012345";
    const pixelSnippet = `
  <!-- Meta Pixel Code for LP: ${title} -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${fbId}');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
`;

    if (htmlContent.includes("</head>")) {
      setHtmlContent(htmlContent.replace("</head>", `${pixelSnippet}\n</head>`));
    } else {
      setHtmlContent(`${pixelSnippet}\n${htmlContent}`);
    }
  };

  // Save Landing Page
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = id ? `/api/landing-pages/${id}` : "/api/landing-pages";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          htmlContent,
          productId: productId || null,
          metaPixelId: metaPixelId === "custom" ? null : metaPixelId || null,
          customPixelId: metaPixelId === "custom" ? customPixelId : null,
          isLive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan landing page");
      }

      if (!id && data.id) {
        setId(data.id);
      }

      const nowTime = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSavedTime(nowTime);

      const liveUrl = `${window.location.origin}/lp/${data.slug || slug}`;
      setSavedUrl(liveUrl);
      setShowConfirmModal(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(savedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleHtmlFileUpload}
        accept=".html,.htm"
        className="hidden"
      />

      {/* TOP ACTION TOOLBAR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/landing-pages"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Kembali ke Daftar LP"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-slate-800 text-sm px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-brand-500 focus:bg-slate-50 outline-hidden transition-colors"
                placeholder="Nama Landing Page..."
              />
              <span className="text-xs text-slate-300">/</span>
              <div className="flex items-center text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <span>/lp/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono bg-transparent outline-hidden font-semibold text-brand-700 w-28"
                  placeholder="slug-url"
                />
              </div>
            </div>
            {lastSavedTime && (
              <p className="text-[10px] text-slate-400 pl-2">
                Tersimpan {lastSavedTime}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Unggah .html</span>
          </button>

          {id && (
            <Link
              href={`/lp/${slug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Live</span>
            </Link>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan & Tayangkan"}</span>
          </button>
        </div>
      </header>

      {/* SUB TOOLBAR: Connected Product & Meta Pixel Selector */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-3">
          {/* Product selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Produk Tujuan:</span>
            <select
              value={productId || ""}
              onChange={(e) => setProductId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-brand-700 text-xs"
            >
              <option value="">-- Pilih Produk Terhubung --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300">|</span>

          {/* META PIXEL SELECTOR (Setiap LP bisa beda pixel!) */}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-bold text-[10px]">
              f
            </div>
            <span className="font-semibold text-slate-700">Meta Pixel LP ini:</span>
            <select
              value={metaPixelId || ""}
              onChange={(e) => setMetaPixelId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 text-xs"
            >
              <option value="">-- Tanpa Pixel --</option>
              {metaPixels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pixelId})
                </option>
              ))}
              <option value="custom">✏️ Input Manual Pixel ID Lain...</option>
            </select>

            {metaPixelId === "custom" && (
              <input
                type="text"
                placeholder="ID Pixel (15-16 digit)"
                value={customPixelId}
                onChange={(e) => setCustomPixelId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold w-36"
              />
            )}
          </div>

          {/* Pixel status badge */}
          {hasPixel ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              <Check className="w-3 h-3" />
              Pixel Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-bold text-[11px] border border-red-200">
              <AlertTriangle className="w-3 h-3" />
              Pixel Belum Terpasang
            </span>
          )}
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setDevicePreview("desktop")}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              devicePreview === "desktop"
                ? "bg-brand-50 text-brand-700 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[11px]">Desktop</span>
          </button>
          <button
            onClick={() => setDevicePreview("mobile")}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              devicePreview === "mobile"
                ? "bg-brand-50 text-brand-700 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px]">Mobile (HP)</span>
          </button>
        </div>
      </div>

      {/* RED BANNER: PERINGATAN PRODUK TANPA ASET */}
      {isProductMissingAsset && (
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs flex items-center justify-between font-bold animate-in fade-in duration-200 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>
              ⚠️ PERINGATAN: Produk file atau link belum terisi! Produk &quot;{selectedProduct?.name}&quot; belum memiliki link akses atau file materi digital. Pembeli tidak akan menerima materi jika checkout.
            </span>
          </div>
          <Link
            href="/admin/products"
            target="_blank"
            className="bg-white text-red-700 px-3 py-1 rounded-lg text-xs font-black hover:bg-red-50 transition-colors shadow-2xs shrink-0"
          >
            Lengkapi Link Produk &rarr;
          </Link>
        </div>
      )}

      {/* SPLIT SCREEN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* SISI KIRI: KODE HTML */}
        <div className="w-1/2 bg-[#0f172a] text-slate-100 flex flex-col border-r border-slate-700/80">
          {/* Code Editor Header */}
          <div className="px-4 py-2.5 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300 font-semibold">
              <Code2 className="w-4 h-4 text-brand-400" />
              <span>&lt;&gt; KODE HTML HALAMAN</span>
            </div>

            <div className="flex items-center gap-2">
              {!hasPixel && (
                <button
                  onClick={injectPixelCode}
                  className="px-2.5 py-1 rounded-md bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  + Sisipkan Script Meta Pixel ({targetPixelId || "Default"})
                </button>
              )}
            </div>
          </div>

          {/* RED WARNING BANNER IF NO PIXEL */}
          {!hasPixel && (
            <div className="bg-red-950/80 border-b border-red-800/80 p-3 text-xs flex items-start gap-2.5 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-red-400 block font-bold">
                  PERINGATAN: Meta Pixel {targetPixelId ? `(${targetPixelId})` : ""} belum terpasang di kode halaman ini!
                </strong>
                <span className="text-red-300 text-[11px] leading-relaxed">
                  Landing page tetap bisa disimpan dan diakses live, namun event PageView / konversi Meta Ads belum dapat terlacak. Klik tombol "+ Sisipkan Script Meta Pixel" di atas atau tempel kode pixel Anda di dalam tag &lt;head&gt;.
                </span>
              </div>
            </div>
          )}

          {/* HTML Textarea Editor */}
          <div className="flex-1 relative font-mono text-xs">
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-full bg-[#0f172a] text-sky-100 p-4 font-mono text-xs resize-none outline-hidden focus:ring-0 leading-relaxed tracking-wide"
              spellCheck={false}
            />
          </div>
        </div>

        {/* SISI KANAN: PREVIEW LANGSUNG */}
        <div className="w-1/2 bg-slate-200/80 flex flex-col items-center overflow-hidden">
          {/* Preview Toolbar */}
          <div className="w-full px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 font-semibold">
              <Eye className="w-3.5 h-3.5 text-brand-600" />
              <span>PRATINJAU LANGSUNG</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {devicePreview === "mobile" ? "Tampilan Mobile 375px" : "Tampilan Desktop 100%"}
            </span>
          </div>

          {/* Iframe Container */}
          <div className="flex-1 w-full p-4 flex items-center justify-center overflow-auto">
            <div
              className={`bg-white transition-all shadow-2xl overflow-hidden rounded-2xl border border-slate-300/80 flex flex-col ${
                devicePreview === "mobile"
                  ? "w-[375px] h-[720px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl relative"
                  : "w-full h-full"
              }`}
            >
              {devicePreview === "mobile" && (
                <div className="h-5 bg-slate-800 flex items-center justify-center">
                  <div className="w-16 h-3 bg-black rounded-full" />
                </div>
              )}
              <iframe
                title="Pratinjau Landing Page"
                srcDoc={htmlContent}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL ON SAVE REVISION / PUBLISH */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Landing Page Berhasil Disimpan & Live!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Konfirmasi link resmi halaman Anda yang siap digunakan untuk beriklan atau dibagikan:
            </p>

            {/* Official Live Link Box */}
            <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-left">
              <div className="truncate text-xs font-mono font-semibold text-brand-700">
                {savedUrl}
              </div>
              <button
                onClick={copyLiveUrl}
                className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Pixel status reminder */}
            <div className="mt-4 text-[11px] text-left p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Meta Pixel Terhubung: </span>
              {hasPixel ? (
                <span className="text-emerald-600 font-bold">
                  ✅ {targetPixelId ? `ID: ${targetPixelId}` : "Terpasang & Siap Melacak Event"}
                </span>
              ) : (
                <span className="text-red-500 font-bold">
                  ⚠️ Belum Terpasang di Kode (Dapat ditambahkan kapan saja)
                </span>
              )}
            </div>

            {/* Peringatan Aset Kosong di Konfirmasi Modal */}
            {isProductMissingAsset && (
              <div className="mt-3 text-[11px] text-left p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
                <strong className="block text-red-700">⚠️ Peringatan Aset Belum Lengkap:</strong>
                Produk ini belum memiliki file upload atau link materi digital. Segera lengkapi di menu Produk agar pembeli tidak menerima produk kosong setelah membayar.
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup & Lanjutkan Edit
              </button>
              <Link
                href={savedUrl}
                target="_blank"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Halaman Live</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
