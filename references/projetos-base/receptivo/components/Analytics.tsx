'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import * as analytics from '@/utils/analytics'; // Importar o utilitário

type Props = {
  metaPixelId?: string;
  googleAnalyticsId?: string;
  googleAdsId?: string;
};

export default function Analytics({ metaPixelId, googleAnalyticsId, googleAdsId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);

  // Efeito para rastrear navegação (PageView) em trocas de rota (SPA)
  useEffect(() => {
    if (initialized) {
      // Pequeno delay para garantir que o título da página atualizou (opcional, mas bom para SEO/Analytics)
      setTimeout(() => {
        analytics.pageView(pathname);
      }, 500);
    } else {
      setInitialized(true);
    }
  }, [pathname, searchParams, initialized]);

  return (
    <>
      {/* --- GOOGLE ANALYTICS & ADS (GTAG) --- */}
      {(googleAnalyticsId || googleAdsId) && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId || googleAdsId}`}
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // Config GA4
              ${googleAnalyticsId ? `gtag('config', '${googleAnalyticsId}', { 
                page_path: window.location.pathname,
                send_page_view: true 
              });` : ''}

              // Config Google Ads
              ${googleAdsId ? `gtag('config', '${googleAdsId}', { 'allow_enhanced_conversions': true });` : ''}
            `}
          </Script>
        </>
      )}

      {/* --- META PIXEL (Facebook) --- */}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            // Inicializa com dados vazios por enquanto. 
            // Em checkout, use "Advanced Matching" se tiver e-mail do user.
            fbq('init', '${metaPixelId}'); 
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}