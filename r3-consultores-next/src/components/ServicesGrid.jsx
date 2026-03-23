
import { Briefcase, FileText, Calculator, FileBarChart, Globe, Building2 } from 'lucide-react';

const services = [
  {
    title: "Trámites Cámara de Comercio / DIAN",
    description: "Creación formal de empresas y actualización de RUT ante la DIAN con asesoría integral para nuevos emprendedores.",
    icon: <Briefcase className="w-8 h-8 text-r3-gold mb-6" />
  },
  {
    title: "Declaración de Renta Persona Natural y Jurídica",
    description: "Análisis financiero y elaboración exacta de declaraciones anuales maximizando sus beneficios tributarios según la ley vigente.",
    icon: <FileText className="w-8 h-8 text-r3-gold mb-6" />
  },
  {
    title: "Impuestos (IVA, ICA, Retefuente, INC)",
    description: "Presentación bimensual y cuatrimestral de obligaciones tributarias para mantener su negocio al día, sin sanciones legales.",
    icon: <Calculator className="w-8 h-8 text-r3-gold mb-6" />
  },
  {
    title: "Información Exógena",
    description: "Preparación y reporte detallado de todas las operaciones económicas con terceros para la DIAN y entes municipales.",
    icon: <FileBarChart className="w-8 h-8 text-r3-gold mb-6" />
  },
  {
    title: "Implementación World Office, Siigo y Alegra",
    description: "Capacitación y parametrización de sus sistemas contables en la nube. Hacemos que la tecnología trabaje a su favor.",
    icon: <Globe className="w-8 h-8 text-r3-gold mb-6" />
  },
  {
    title: "Asesoría Contable General",
    description: "Procesamiento, revisión y certificación mensual de la situación financiera de su compañía para toma de decisiones acertada.",
    icon: <Building2 className="w-8 h-8 text-r3-gold mb-6" />
  }
];

export default function ServicesGrid() {
  return (
    <>
      {/* ========== SERVICIOS SECTION ========== */}
      <section id="servicios" className="py-24 lg:py-36 bg-r3-bg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 lg:mb-20 reveal">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-r3-text leading-tight">
                Soluciones contables<br />que impulsan su negocio
              </h2>
            </div>
            <div className="mt-6 lg:mt-0">
              <a href="#contacto" className="ghost-btn ghost-btn-dark inline-flex items-center gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest rounded-none">
                Consultar ahora
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, index) => (
              <div
                key={index}
                className="bg-white p-10 border border-gray-100 hover:border-r3-gold/30 hover:shadow-2xl hover:shadow-r3-gold/5 transition-all duration-300 reveal group"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {srv.icon}
                <h3 className="text-2xl font-bold text-r3-slate mb-4 pb-4 border-b border-gray-100 group-hover:border-r3-gold/30 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {srv.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NOSOTROS SECTION ========== */}
      <section id="nosotros" className="bg-r3-slate">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
            <div className="flex flex-col justify-center px-6 lg:px-16 xl:px-24 py-24 lg:py-36 reveal">
              <div className="w-16 h-1 bg-r3-gold mb-8"></div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8">
                Confíe su gestión contable a profesionales
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                Somos una firma de contadores públicos en Colombia con experiencia en soluciones contables, tributarias y financieras. Respaldamos a empresas y personas naturales con un servicio integral y personalizado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contacto" className="ghost-btn ghost-btn-gold inline-flex items-center justify-center gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest rounded-none">
                  Agendar Cita
                </a>
              </div>
            </div>
            <div className="relative min-h-[500px] w-full h-full lg:h-auto overflow-hidden">
                <img src="/assets/nosotros_r3_1774156632518.png" alt="Equipo R3 Consultores" className="absolute inset-0 w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-r3-slate/20"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
