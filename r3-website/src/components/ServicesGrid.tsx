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
      <section id="servicios" className="snap-section bg-[#f8fafc] py-6 sm:py-12 md:py-20 lg:py-0">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-full flex flex-col justify-center">

          <div className="flex flex-col items-center mb-8 lg:mb-16">
            {/* TEXT CONTENT — Now Centered */}
            <div className="max-w-4xl text-center">
              <span className="text-r3-gold font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.3em] mb-3 block reveal anim-hidden anim-fade-in">
                Inteligencia Financiera
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold text-[#111827] leading-[1.1] mb-4 reveal anim-hidden anim-slide-up">
                Impulse su empresa con<br className="hidden lg:block" /> <span className="text-r3-gold">Asesoría de Alto Nivel.</span>
              </h2>
              <p className="text-[#64748b] text-xs sm:text-sm lg:text-lg max-w-2xl mx-auto mb-6 lg:mb-10 leading-relaxed reveal anim-hidden anim-slide-up anim-delay-1">
                Automatización de cumplimiento y optimización tributaria para que usted se enfoque en la <span className="font-bold text-[#1e293b]">estrategia de crecimiento.</span>
              </p>

              <div className="reveal anim-hidden anim-fade-scale anim-delay-2 hidden sm:flex justify-center">
                <a href="#contacto" className="inline-flex items-center gap-3 bg-[#f6b034] text-white font-bold px-10 py-5 rounded-full text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:brightness-110 transition-all duration-500">
                  Hablar con un experto
                </a>
              </div>
            </div>
          </div>

          {/* SERVICES GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 relative z-20">
            {services.map((srv, index) => (
              <div
                key={index}
                className="bg-white p-3 sm:p-5 lg:p-10 rounded-2xl border border-gray-100 hover:border-r3-gold/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-r3-gold/10 transition-all duration-500 reveal group cursor-default anim-hidden anim-slide-up relative overflow-hidden"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                {/* Watermark Icon */}
                <div className="absolute -right-4 -bottom-4 text-r3-gold opacity-[0.03] scale-[3] transform rotate-12 group-hover:scale-[3.5] group-hover:opacity-[0.07] transition-all duration-700 pointer-events-none">
                  {srv.icon}
                </div>

                <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-4 relative z-10">
                  <div className="scale-75 sm:scale-125 origin-left">{srv.icon}</div>
                  <h3 className="text-[10px] sm:text-base lg:text-xl font-extrabold text-[#111827] tracking-tight sm:tracking-wide">
                    {srv.title}
                  </h3>
                </div>
                <p className="text-[#64748b] leading-tight sm:leading-relaxed text-[9px] sm:text-xs lg:text-base line-clamp-2 sm:line-clamp-none relative z-10">
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
