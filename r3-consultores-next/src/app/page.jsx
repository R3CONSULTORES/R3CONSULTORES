import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesGrid from "@/components/ServicesGrid";
import AppointmentForm from "@/components/AppointmentForm";
import Footer from "@/components/Footer";
import RevealProvider from "@/components/RevealProvider";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <HeroSection />
      <ServicesGrid />
      <AppointmentForm />
      <Footer />
      <RevealProvider />
    </main>
  );
}
