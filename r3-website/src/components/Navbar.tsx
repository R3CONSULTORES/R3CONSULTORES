"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [onDark, setOnDark] = useState(true); // true = over dark section, false = over light section

  useEffect(() => {
    const container = document.querySelector('.snap-container');
    if (!container) return;

    const detectSection = () => {
      // Check which snap-section is currently at the top of the viewport
      const sections = container.querySelectorAll('.snap-section');
      let currentlyDark = true;

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // If section's top is near the viewport top (within 100px), it's the active section
        if (rect.top <= 80 && rect.bottom > 80) {
          // Check if section background is dark by looking at its bg class
          const isDark = section.classList.contains('bg-[#1e293b]') || 
                         section.classList.contains('bg-[#111827]') ||
                         section.classList.contains('bg-r3-slate');
          currentlyDark = isDark;
        }
      });

      setOnDark(currentlyDark);
    };

    container.addEventListener('scroll', detectSection);
    detectSection(); // Initial check
    return () => container.removeEventListener('scroll', detectSection);
  }, []);

  // Derive styles based on whether navbar is over a dark or light section
  const navBg = onDark ? 'bg-transparent py-5' : 'bg-white/80 backdrop-blur-md shadow-lg py-3';
  const linkColor = onDark ? 'text-white/80 hover:text-white' : 'text-[#1e293b]/70 hover:text-[#f6b034]';
  const logoSrc = onDark ? '/assets/logo-amarillo.png' : '/assets/logo.png';

  return (
    <>
      <header
        id="navbar"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${navBg}`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group relative z-50">
            <img
              id="nav-logo"
              src={logoSrc}
              alt="R3 Consultores Logo"
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#servicios" className={`text-sm font-medium tracking-wide uppercase transition-colors ${linkColor}`}>Servicios</a>
              <a href="#nosotros" className={`text-sm font-medium tracking-wide uppercase transition-colors ${linkColor}`}>Nosotros</a>
              <a href="#contacto" className={`text-sm font-medium tracking-wide uppercase transition-colors ${linkColor}`}>Contacto</a>
            </nav>
            
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-12 h-12 flex flex-col justify-center items-center gap-2 relative z-50 focus:outline-none"
              aria-label="Menú"
            >
              <span className={`w-7 h-[2px] transition-all duration-300 origin-center block ${onDark ? 'bg-white' : 'bg-[#1e293b]'} ${isOpen ? 'translate-y-[10px] rotate-45' : ''}`}></span>
              <span className={`w-7 h-[2px] transition-all duration-300 block ${onDark ? 'bg-white' : 'bg-[#1e293b]'} ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`w-7 h-[2px] transition-all duration-300 origin-center block ${onDark ? 'bg-white' : 'bg-[#1e293b]'} ${isOpen ? '-translate-y-[10px] -rotate-45' : ''}`}></span>
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
          </nav>
        </div>
      </header>
    </>
  );
}
