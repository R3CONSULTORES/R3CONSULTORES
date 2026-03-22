import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [activeSegment, setActiveSegment] = useState('');

  // Pill nav scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['servicios', 'nosotros', 'contacto'];
      let current = '';
      sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec && window.scrollY >= sec.offsetTop - 300) {
          current = id;
        }
      });
      setActiveSegment(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="inicio" className="relative min-h-screen flex flex-col items-center justify-center bg-r3-slate overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(246,176,52,0.06) 0%, transparent 60%)' }}></div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20">
        <p className="text-r3-gold text-sm sm:text-base font-medium tracking-widest uppercase mb-8 reveal">
          Contadores Públicos
        </p>
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-extrabold text-white leading-[0.95] tracking-tight mb-10 reveal reveal-delay-1">
          Expertos en<br/>asesoría contable
        </h1>
        <div className="reveal reveal-delay-2 mb-16">
          <a href="#contacto" className="ghost-btn ghost-btn-gold inline-flex items-center px-10 py-4 text-sm font-bold uppercase tracking-widest rounded-none">
            Agendar Cita
          </a>
        </div>
      </div>

      {/* Pill Navigation Bar */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-20 w-[95%] md:w-auto text-center reveal reveal-delay-3 px-2">
        <div className="inline-flex flex-wrap shadow-xl items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md">
          <a href="#servicios" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'servicios' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Servicios</a>
          <a href="#nosotros" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'nosotros' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Nosotros</a>
          <a href="#contacto" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'contacto' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Contacto</a>
          <a href="#portal" className="px-3 py-2 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider whitespace-nowrap text-white/80 hover:text-white mt-1 md:mt-0">Portal Clientes</a>
        </div>
      </div>
    </section>
  );
}
