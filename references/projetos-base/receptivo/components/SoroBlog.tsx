'use client';

import Script from 'next/script';

export default function SoroBlog() {
  return (
    <>
      <div id="soro-blog" />
      <Script
        src="https://app.trysoro.com/api/embed/b18e6260-d087-4e88-a9ae-ba53ec34a78a"
        strategy="afterInteractive"
      />
    </>
  );
}
