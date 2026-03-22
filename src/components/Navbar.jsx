import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        id="navbar"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex justify-between items-center">
          {/* Logo Section */}
          <a href="#" className="flex items-center gap-3 group relative z-50">
            <img
              id="nav-logo"
              src={scrolled ? '/assets/logo.png' : '/assets/logo-amarillo.png'}
              alt="R3 Consultores Logo"
              className="h-10 transition-transform group-hover:scale-105"
            />
          </a>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#servicios" className={`text-sm font-medium tracking-wide uppercase transition-colors ${scrolled ? 'text-r3-text/70 hover:text-r3-gold' : 'text-white/80 hover:text-white'}`}>Servicios</a>
              <a href="#nosotros" className={`text-sm font-medium tracking-wide uppercase transition-colors ${scrolled ? 'text-r3-text/70 hover:text-r3-gold' : 'text-white/80 hover:text-white'}`}>Nosotros</a>
              <a href="#contacto" className={`text-sm font-medium tracking-wide uppercase transition-colors ${scrolled ? 'text-r3-text/70 hover:text-r3-gold' : 'text-white/80 hover:text-white'}`}>Contacto</a>
            </nav>
            <a href="#portal" id="nav-portal" className={`hidden lg:inline-flex ghost-btn px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-none ${scrolled ? 'ghost-btn-dark' : 'ghost-btn-light'}`}>
              Portal Clientes
            </a>
            
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-12 h-12 flex flex-col justify-center items-center gap-2 relative z-50 mix-blend-difference focus:outline-none"
              aria-label="Menú"
            >
              <span className={`w-7 h-[2px] bg-white transition-transform duration-300 origin-center block ${isOpen ? 'translate-y-[10px] rotate-45' : ''}`}></span>
              <span className={`w-7 h-[2px] bg-white transition-opacity duration-300 block ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`w-7 h-[2px] bg-white transition-transform duration-300 origin-center block ${isOpen ? '-translate-y-[10px] -rotate-45' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`lg:hidden bg-r3-slate overflow-hidden transition-[max-height] duration-400 ease-in-out ${
            isOpen ? 'max-h-[500px]' : 'max-h-0'
          }`}
        >
          <nav className="px-6 py-6 space-y-1">
            <a href="#inicio" onClick={() => setIsOpen(false)} className="block py-3 text-white/80 font-medium tracking-wide uppercase text-sm hover:text-r3-gold transition-colors">Inicio</a>
            <a href="#servicios" onClick={() => setIsOpen(false)} className="block py-3 text-white/80 font-medium tracking-wide uppercase text-sm hover:text-r3-gold transition-colors">Servicios</a>
            <a href="#nosotros" onClick={() => setIsOpen(false)} className="block py-3 text-white/80 font-medium tracking-wide uppercase text-sm hover:text-r3-gold transition-colors">Nosotros</a>
            <a href="#contacto" onClick={() => setIsOpen(false)} className="block py-3 text-white/80 font-medium tracking-wide uppercase text-sm hover:text-r3-gold transition-colors">Contacto</a>
            <a href="#portal" onClick={() => setIsOpen(false)} className="block py-3 mt-2 text-r3-gold font-bold tracking-wide uppercase text-sm">Portal Clientes →</a>
          </nav>
        </div>
      </header>
    </>
  );
}
