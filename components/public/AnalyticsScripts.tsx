import Script from "next/script";

interface AnalyticsScriptsProps {
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  headScripts?: string | null;
}

export function AnalyticsScripts({
  googleAnalyticsId,
  googleTagManagerId,
  facebookPixelId,
  tiktokPixelId,
  headScripts,
}: AnalyticsScriptsProps) {
  return (
    <>
      {/* Google Tag Manager */}
      {googleTagManagerId && (
        <>
          <Script
            id="gtm-head"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${googleTagManagerId}');`,
            }}
          />
        </>
      )}

      {/* Google Analytics (GA4) — only when no GTM */}
      {googleAnalyticsId && !googleTagManagerId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${googleAnalyticsId}');`,
            }}
          />
        </>
      )}

      {/* Meta (Facebook) Pixel */}
      {facebookPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${facebookPixelId}');
fbq('track', 'PageView');`,
          }}
        />
      )}

      {/* TikTok Pixel */}
      {tiktokPixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${tiktokPixelId}');
  ttq.page();
}(window, document, 'ttq');`,
          }}
        />
      )}

      {/* Custom head scripts: raw HTML/JS entered by tenant_owner/tenant_admin in
          /integracoes (see app/api/integrations/save/route.ts). Not sanitized —
          this field is an intentional power feature (third-party tracking tags
          often require arbitrary inline script), restricted to admin/owner roles
          and audit-logged on every change. Treat it as equivalent to direct
          deploy access to this tenant's site. */}
      {headScripts && (
        <div
          id="custom-head-scripts"
          dangerouslySetInnerHTML={{ __html: headScripts }}
          style={{ display: "none" }}
        />
      )}
    </>
  );
}

export function GTMNoScript({ gtmId }: { gtmId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
