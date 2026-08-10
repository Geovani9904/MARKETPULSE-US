import Script from 'next/script';

interface AdProps {
  adId: string; // Tu ID que te dará Dianomi al registrarte
}

export default function FinancialAd({ adId }: AdProps) {
  return (
    <div className="my-8 border-t border-b border-neutral-800 py-6">
      {/* Contenedor donde se inyectará el anuncio */}
      <div id={adId} className="dianomi-ad-container" />
      
      {/* Script de carga asíncrona para no afectar el rendimiento */}
      <Script
        src="//ads.dianomi.com/v2/loader.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Lógica de inicialización de Dianomi
        }}
      />
    </div>
  );
}