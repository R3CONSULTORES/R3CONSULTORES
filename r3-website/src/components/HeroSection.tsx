"use client";
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [activeSegment, setActiveSegment] = useState('');

  // Pill nav scroll spy — listens on snap container
  useEffect(() => {
    const container = document.querySelector('.snap-container');
    if (!container) return;

    const handleScroll = () => {
      const sections = ['servicios', 'nosotros', 'contacto'];
      let current = '';
      sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec && container.scrollTop >= sec.offsetTop - 300) {
          current = id;
        }
      });
      setActiveSegment(current);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="inicio" className="snap-section bg-[#1e293b] px-6">

      <div className="max-w-4xl mx-auto text-center">

        {/* Gold Accent Line */}
        <div className="border-t-2 border-[#f6b034] w-0 mx-auto mb-8 reveal anim-line"></div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight tracking-tight reveal anim-hidden anim-slide-up anim-delay-1">
          Tranquilidad tributaria y financiera para su empresa.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-slate-300 leading-relaxed reveal anim-hidden anim-slide-up anim-delay-2">
          Somos una firma de contadores públicos con experiencia en soluciones contables y declaraciones de impuestos. Respaldamos su crecimiento con un servicio integral, preciso y personalizado.
        </p>

        {/* CTA Button */}
        <div className="mt-6 md:mt-10 reveal anim-hidden anim-fade-scale anim-delay-3">
          <a
            href="#contacto"
            className="inline-flex items-center bg-[#f6b034] text-white font-bold px-8 py-4 rounded-md text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-300"
          >
            Agendar Cita de Valoración
          </a>
        </div>
      </div>

      {/* Pill Navigation Bar */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-20 w-[95%] md:w-auto text-center px-2">
        <div className="inline-flex flex-wrap shadow-xl items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md">
          <a href="#servicios" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'servicios' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Servicios</a>
          <a href="#nosotros" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'nosotros' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Nosotros</a>
          <a href="#contacto" className={`px-3 py-2 rounded-full text-[10px] md:text-sm font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeSegment === 'contacto' ? 'bg-[#f6b034] text-[#1e293b]' : 'text-white/80 hover:text-white'}`}>Contacto</a>
        </div>
      </div>
    </section>
  );
}
