// app/TrackingProvider.tsx — Server Component
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

/** Retorna true apenas para IDs que são strings não-vazias e não são o literal "null"/"undefined" */
function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value !== 'null' && value !== 'undefined';
}

export default async function TrackingProvider() {
  let settings: Record<string, unknown> | null = null;

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('google_tag_manager_id, meta_pixel_id, google_analytics_id')
      .single();

    if (!error && data) settings = data;
  } catch (err) {
    console.error('TrackingProvider: erro ao carregar settings', err);
  }

  if (!settings) return null;

  const gtmId    = isValidId(settings.google_tag_manager_id) ? settings.google_tag_manager_id : null;
  const pixelId  = isValidId(settings.meta_pixel_id)         ? settings.meta_pixel_id         : null;
  const gaId     = isValidId(settings.google_analytics_id)   ? settings.google_analytics_id   : null;

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {/* Google Analytics 4 (direto, sem GTM) */}
      {gaId && !gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
