import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicesGrid from './components/ServicesGrid';
import AppointmentForm from './components/AppointmentForm';
import Footer from './components/Footer';

function App() {
  // Configuración del IntersectionObserver para las animaciones Reveal en todo el sitio
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <HeroSection />
      <ServicesGrid />
      <AppointmentForm />
      <Footer />
    </div>
  );
}

export default App;
