import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vizu — Editor de Apresentações",
  description: "Editor de apresentações profissional com inteligência artificial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="color-scheme" content="light dark" />
        {/* Anti-flash: aplica tema antes do paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=localStorage.getItem('vizu-theme')||'auto';var d=p==='dark'||(p==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.setAttribute('data-theme-pref',p);})();`,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
