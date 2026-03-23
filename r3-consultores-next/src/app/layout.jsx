import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta'
});

export const metadata = {
  title: "R3 Consultores | Asesoría Contable, Financiera y Tributaria",
  description: "Firma experta en soluciones integrales contables, rentas, trámites DIAN y acompañamiento financiero para el éxito de su negocio.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${jakarta.variable} font-jakarta bg-[#f8fafc] text-[#111827] antialiased`}>
        {children}
      </body>
    </html>
  );
}
