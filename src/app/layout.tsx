import type { Metadata } from "next";
import "./globals.css";

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@400;500;600;700&display=swap";

export const metadata: Metadata = {
  title: "Vizu — Editor de Apresentações",
  description: "Editor de apresentações profissional com inteligência artificial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fontes carregadas sem bloquear o render inicial (media=print + swap para 'all' quando prontas) */}
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} media="print" data-font-swap="true" />
        <noscript>
          <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
        </noscript>
        {/* Anti-flash: aplica tema antes do paint + libera as fontes assíncronas */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=localStorage.getItem('vizu-theme')||'auto';var d=p==='dark'||(p==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.setAttribute('data-theme-pref',p);document.querySelectorAll('link[data-font-swap]').forEach(function(l){l.onload=function(){l.media='all';};if(l.sheet)l.media='all';});})();`,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
