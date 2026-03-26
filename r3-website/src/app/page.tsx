"use client";
import { useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServicesGrid from '../components/ServicesGrid';
import AppointmentForm from '../components/AppointmentForm';
import Footer from '../components/Footer';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for reveal animations and dynamic THEME-COLOR
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Secciones y sus colores asociados
    const themeMap: Record<string, string> = {
      'inicio': '#1e293b',
      'servicios': '#f8fafc',
      'nosotros': '#1e293b',
      'contacto': '#ffffff',
      'footer-snap': '#111827' // Necesitaremos asignar este ID al footer
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
          e.target.classList.remove('anim-hidden');

          // Actualizar theme-color del navegador
          const sectionId = e.target.id;
          if (themeMap[sectionId]) {
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
              metaThemeColor.setAttribute('content', themeMap[sectionId]);
            }
          }
        }
      });
    }, { threshold: 0.4, root: container }); // Threshold más alto para evitar cambios prematuros

    const revealEls = container.querySelectorAll('.snap-section');
    revealEls.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <div ref={containerRef} className="snap-container">
        <HeroSection />
        <ServicesGrid />
        <AppointmentForm />
      </div>
    </div>
  );
}
