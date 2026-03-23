import { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicesGrid from './components/ServicesGrid';
import AppointmentForm from './components/AppointmentForm';
import Footer from './components/Footer';
import DashboardApp from './dashboard/DashboardApp';

// Landing page with snap-scroll slide layout
const LandingPage = () => {
  const containerRef = useRef(null);

  // IntersectionObserver for reveal animations — scoped to snap container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
          // Also trigger anim-hidden → visible
          e.target.classList.remove('anim-hidden');
        }
      });
    }, { threshold: 0.15, root: container });

    const revealEls = container.querySelectorAll('.reveal');
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
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard/*" element={<DashboardApp />} />
    </Routes>
  );
}

export default App;
