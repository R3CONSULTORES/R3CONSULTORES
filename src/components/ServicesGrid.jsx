import React from 'react';
import { Briefcase, FileText, Calculator, FileBarChart, Globe, Building2 } from 'lucide-react';

const services = [
  {
    title: "RENTA",
    description: "Declaración de renta para personas naturales y jurídicas, maximizando beneficios tributarios.",
    icon: <FileText className="w-6 h-6 text-r3-gold" />
  },
  {
    title: "IVA",
    description: "Presentación bimensual y cuatrimestral de obligaciones de IVA sin sanciones.",
    icon: <Calculator className="w-6 h-6 text-r3-gold" />
  },
  {
    title: "EXÓGENA",
    description: "Reporte detallado de operaciones económicas con terceros ante la DIAN.",
    icon: <FileBarChart className="w-6 h-6 text-r3-gold" />
  },
  {
    title: "CÁMARA Y DIAN",
    description: "Creación de empresas, actualización de RUT y trámites legales.",
    icon: <Briefcase className="w-6 h-6 text-r3-gold" />
  },
  {
    title: "WORLD OFFICE",
    description: "Implementación y capacitación en sistemas contables en la nube.",
    icon: <Globe className="w-6 h-6 text-r3-gold" />
  },
  {
    title: "ASESORÍA CONTABLE",
    description: "Revisión y certificación mensual de la situación financiera de su empresa.",
    icon: <Building2 className="w-6 h-6 text-r3-gold" />
  }
];

export default function ServicesGrid() {
  return (
    <>
      {/* ========== SERVICIOS SECTION — Full white slide ========== */}
      <section id="servicios" className="snap-section bg-[#f8fafc] pt-20 pb-8 lg:pt-24 lg:pb-0">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-10 lg:mb-12 reveal">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1e293b] leading-tight reveal anim-hidden anim-slide-up">
                Soluciones contables<br />que impulsan su negocio
              </h2>
            </div>
            <div className="mt-4 lg:mt-0 reveal anim-hidden anim-fade-scale anim-delay-2">
              <a href="#contacto" className="ghost-btn ghost-btn-dark inline-flex items-center gap-3 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-none">
                Consultar ahora
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {services.map((srv, index) => (
              <div
                key={index}
                className="bg-white p-6 lg:p-8 rounded-lg border border-gray-100 hover:border-r3-gold/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-r3-gold/5 transition-all duration-300 reveal group cursor-default anim-hidden anim-slide-up"
                style={{ animationDelay: `${300 + index * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {srv.icon}
                  <h3 className="text-lg lg:text-xl font-extrabold text-[#1e293b] tracking-wide">
                    {srv.title}
                  </h3>
                </div>
                <p className="text-gray-500 leading-relaxed text-xs lg:text-sm">
                  {srv.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NOSOTROS SECTION — Full dark slide, typography only ========== */}
      <section id="nosotros" className="snap-section bg-[#1e293b]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          
          {/* Gold accent line */}
          <div className="border-t-2 border-[#f6b034] w-24 mx-auto mb-8 reveal anim-line"></div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8 reveal anim-hidden anim-slide-up anim-delay-1">
            Confíe su gestión contable a profesionales
          </h2>

          <p className="max-w-2xl mx-auto text-slate-300 text-lg md:text-xl leading-relaxed mb-10 reveal anim-hidden anim-slide-up anim-delay-2">
            Somos una firma de contadores públicos en Colombia con experiencia en soluciones contables, tributarias y financieras. Respaldamos a empresas y personas naturales con un servicio integral y personalizado.
          </p>

          <div className="reveal anim-hidden anim-fade-scale anim-delay-3">
            <a href="#contacto" className="inline-flex items-center bg-[#f6b034] text-white font-bold px-8 py-4 rounded-md text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-300">
              Agendar Cita
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
