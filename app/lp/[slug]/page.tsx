import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { sendMetaCapiEvent } from "@/lib/capi";

export const dynamic = "force-dynamic";

export default async function PublicLandingPageRoute({
  params,
}: {
  params: { slug: string };
}) {
  const lp = await prisma.landingPage.findUnique({
    where: { slug: params.slug },
    include: {
      product: true,
      metaPixel: true,
    },
  });

  if (!lp || !lp.isLive) {
    notFound();
  }

  const pixelId = lp.metaPixel?.pixelId || lp.customPixelId || null;
  const capiToken = lp.metaPixel?.capiToken || null;
  const testCode = lp.metaPixel?.testCode || null;
  const productName = lp.product?.name || lp.title || "Produk Digital";
  const productPrice = lp.product?.pricePromo || 0;

  // Record visitor funnel (view) and server-side CAPI PageView
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const ip = headersList.get("x-forwarded-for") || undefined;

    await prisma.$transaction([
      prisma.landingPage.update({
        where: { id: lp.id },
        data: { viewsCount: { increment: 1 } },
      }),
      prisma.funnelLog.create({
        data: {
          landingPageId: lp.id,
          step: "view",
          ipAddress: ip,
          userAgent,
        },
      }),
    ]);

    // Send Server-side Meta Conversions API (CAPI) PageView if token is configured
    if (pixelId && capiToken) {
      sendMetaCapiEvent(pixelId, capiToken, testCode, {
        eventName: "PageView",
        sourceUrl: `https://domainanda.com/lp/${lp.slug}`,
        user: {
          ip,
          userAgent,
        },
        customData: {
          content_name: productName,
          value: productPrice,
          currency: "IDR",
        },
      }).catch((e) => console.error("Server CAPI PageView error:", e));
    }
  } catch (err) {
    console.error("Funnel view log error:", err);
  }

  // Inject Meta Pixel, CAPI Token Otomatis, dan Trigger InitiateCheckout ke tombol 'Saya Mau Beli / Tertarik'
  const trackingScript = `
<script id="skylink-meta-capi-engine">
(function() {
  var pixelId = ${JSON.stringify(pixelId || "")};
  var capiToken = ${JSON.stringify(capiToken || "")};
  var testCode = ${JSON.stringify(testCode || "")};
  var lpId = ${JSON.stringify(lp.id)};
  var lpSlug = ${JSON.stringify(lp.slug)};
  var productName = ${JSON.stringify(productName)};
  var productPrice = ${productPrice};

  // 1. Inisialisasi Meta Pixel Browser
  if (pixelId) {
    if (!window.fbq) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', pixelId);
    }
    fbq('track', 'PageView');
  }

  // 2. Event Listener Tombol Pembelian (Trigger Event: InitiateCheckout)
  function bindPurchaseCtaButtons() {
    var ctaKeywords = [
      'beli', 'saya mau beli', 'mau beli', 'tertarik', 'order', 'pesan',
      'checkout', 'ambil promo', 'dapatkan', 'miliki', 'daftar sekarang',
      'join sekarang', 'ambil sekarang', 'ya saya mau', 'amankan slot'
    ];
    
    var selectors = 'a, button, [role="button"], input[type="submit"], input[type="button"], .btn-order, #btn-order';
    var elements = document.querySelectorAll(selectors);

    elements.forEach(function(el) {
      if (el.getAttribute('data-capi-bound') === 'true') return;

      var text = (el.innerText || el.textContent || el.value || '').trim().toLowerCase();
      var href = (el.getAttribute('href') || '').toLowerCase();
      var id = (el.getAttribute('id') || '').toLowerCase();
      var className = (el.getAttribute('class') || '').toLowerCase();

      var isCta = ctaKeywords.some(function(kw) { return text.indexOf(kw) !== -1; }) ||
                  href.indexOf('checkout') !== -1 ||
                  id.indexOf('order') !== -1 ||
                  id.indexOf('beli') !== -1 ||
                  className.indexOf('order') !== -1 ||
                  className.indexOf('btn-') !== -1;

      if (isCta) {
        el.setAttribute('data-capi-bound', 'true');

        // Otomatis pastikan link checkout membawa parameter ?lp=slug
        if (el.tagName === 'A' && el.getAttribute('href')) {
          var curHref = el.getAttribute('href');
          if (curHref.indexOf('/checkout') !== -1 && curHref.indexOf('lp=') === -1) {
            var sepChar = curHref.indexOf('?') !== -1 ? '&' : '?';
            el.setAttribute('href', curHref + sepChar + 'lp=' + encodeURIComponent(lpSlug));
          }
        }

        el.addEventListener('click', function() {
          // Trigger Meta Pixel di Browser
          if (window.fbq && pixelId) {
            fbq('track', 'InitiateCheckout', {
              content_name: productName,
              value: productPrice,
              currency: 'IDR'
            });
          }

          // Trigger Meta CAPI Server (Token Otomatis)
          if (capiToken && pixelId) {
            var payload = JSON.stringify({
              eventName: 'InitiateCheckout',
              pixelId: pixelId,
              capiToken: capiToken,
              testCode: testCode,
              value: productPrice,
              currency: 'IDR',
              content_name: productName,
              landingPageId: lpId,
              sourceUrl: window.location.href
            });

            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/tracking/capi', payload);
            } else {
              fetch('/api/tracking/capi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
              }).catch(function(){});
            }
          }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPurchaseCtaButtons);
  } else {
    bindPurchaseCtaButtons();
  }
  setTimeout(bindPurchaseCtaButtons, 1000);
})();
</script>
`;

  let finalHtml = lp.htmlContent;

  // Auto-inject ?lp=slug ke semua link internal /checkout/ agar pelacakan sumber iklan 100% akurat
  try {
    finalHtml = finalHtml.replace(
      /href=(["'])([^"']*\/checkout\/[^"']*)(\1)/gi,
      (match, quote, url) => {
        if (url.includes("lp=")) return match;
        const sep = url.includes("?") ? "&" : "?";
        return `href=${quote}${url}${sep}lp=${encodeURIComponent(lp.slug)}${quote}`;
      }
    );
  } catch (e) {
    console.error("Link injection error:", e);
  }

  if (finalHtml.includes("</body>")) {
    finalHtml = finalHtml.replace("</body>", `${trackingScript}\n</body>`);
  } else if (finalHtml.includes("</html>")) {
    finalHtml = finalHtml.replace("</html>", `${trackingScript}\n</html>`);
  } else {
    finalHtml = `${finalHtml}\n${trackingScript}`;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: finalHtml }}
      className="w-full min-h-screen"
    />
  );
}