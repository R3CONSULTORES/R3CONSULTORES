import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="snap-section bg-[#111827] text-white/60 py-16 border-t border-white/5 relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 reveal">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-2xl font-black uppercase tracking-tighter text-white leading-none">R3</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#f6b034] mt-1">Consultores</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs pt-4">
              Soluciones integrales en asesoría contable, tributaria y financiera para impulsar el éxito de su negocio.
            </p>
          </div>

          {/* Links Col */}
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-widest text-sm uppercase mb-6">Enlaces Rápidos</h4>
            <nav className="flex flex-col space-y-3 text-sm">
              <a href="#inicio" className="hover:text-[#f6b034] transition-colors w-fit">Inicio</a>
              <a href="#servicios" className="hover:text-[#f6b034] transition-colors w-fit">Nuestros Servicios</a>
              <a href="#nosotros" className="hover:text-[#f6b034] transition-colors w-fit">Sobre Nosotros</a>
              <a href="#agendar" className="hover:text-[#f6b034] transition-colors w-fit">Agendar Cita</a>
            </nav>
          </div>

          {/* Contact Col */}
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-widest text-sm uppercase mb-6">Contacto</h4>
            <div className="flex flex-col space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#f6b034] shrink-0" />
                <span>+57 300 404 6628</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#f6b034] shrink-0" />
                <a href="mailto:info@r3consultores.com" className="hover:text-white transition-colors">info@r3consultores.com</a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#f6b034] shrink-0" />
                <span>Bogotá D.C., Colombia</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 reveal reveal-delay-2">
          <p className="text-xs text-center md:text-left">
            &copy; {currentYear} R3 Consultores. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-xs items-center">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <Link to="/dashboard" className="text-white/10 hover:text-white/30 transition-colors ml-2" title="Desarrollador">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
