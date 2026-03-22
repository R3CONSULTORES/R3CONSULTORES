import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix Hamburger Icon
hamburger_old = '''<button id="mobile-menu-btn" class="lg:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5" aria-label="Menú">
                    <span id="ham-1" class="w-6 h-[2px] bg-white transition-all duration-300 origin-center"></span>
                    <span id="ham-2" class="w-6 h-[2px] bg-white transition-all duration-300"></span>
                    <span id="ham-3" class="w-4 h-[2px] bg-white transition-all duration-300 self-end"></span>
                </button>'''
hamburger_new = '''<button id="mobile-menu-btn" class="lg:hidden w-12 h-12 flex flex-col justify-center items-center gap-2 relative z-50 mix-blend-difference focus:outline-none" aria-label="Menú">
                    <span id="ham-1" class="w-7 h-[2px] bg-white transition-transform duration-300 origin-center block"></span>
                    <span id="ham-2" class="w-7 h-[2px] bg-white transition-opacity duration-300 block"></span>
                    <span id="ham-3" class="w-7 h-[2px] bg-white transition-transform duration-300 origin-center block"></span>
                </button>'''
html = html.replace(hamburger_old, hamburger_new)

# Fix Pill Nav
pill_old = '''<div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 reveal reveal-delay-3">
            <div class="pill-nav inline-flex items-center gap-1 px-2 py-2 rounded-full bg-white/10 border border-white/10">
                <a href="#servicios" class="pill-link px-5 py-2.5 rounded-full text-white/70 text-xs font-semibold uppercase tracking-wider hover:text-white transition-all">Servicios</a>
                <a href="#nosotros" class="pill-link px-5 py-2.5 rounded-full text-white/70 text-xs font-semibold uppercase tracking-wider hover:text-white transition-all">Nosotros</a>
                <a href="#contacto" class="pill-link px-5 py-2.5 rounded-full text-white/70 text-xs font-semibold uppercase tracking-wider hover:text-white transition-all">Contacto</a>
                <a href="#portal" class="pill-link active-pill px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider">Portal Clientes</a>
            </div>
        </div>'''
pill_new = '''<div class="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-20 w-[95%] md:w-auto text-center reveal reveal-delay-3 px-2">
            <div class="pill-nav inline-flex flex-wrap shadow-xl items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md">
                <a href="#servicios" class="pill-link px-3 py-2 rounded-full text-white/80 text-[10px] md:text-sm font-semibold uppercase tracking-wider hover:text-white transition-all whitespace-nowrap">Servicios</a>
                <a href="#nosotros" class="pill-link px-3 py-2 rounded-full text-white/80 text-[10px] md:text-sm font-semibold uppercase tracking-wider hover:text-white transition-all whitespace-nowrap">Nosotros</a>
                <a href="#contacto" class="pill-link px-3 py-2 rounded-full text-white/80 text-[10px] md:text-sm font-semibold uppercase tracking-wider hover:text-white transition-all whitespace-nowrap">Contacto</a>
                <a href="#portal" class="pill-link active-pill px-3 py-2 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider whitespace-nowrap mt-1 md:mt-0">Portal Clientes</a>
            </div>
        </div>'''
html = html.replace(pill_old, pill_new)

# Replace Agendar Section
import re
agendar_pattern = re.compile(r'<!-- ========== AGENDAR CITA SECTION ========== -->.*?</section>', re.DOTALL)
agendar_new = '''<!-- ========== AGENDAR CITA SECTION (NUEVO UI IA) ========== -->
    <section id="agendar" class="bg-r3-bg py-24 lg:py-36 relative overflow-hidden">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-r3-gold/10 rounded-full blur-3xl"></div>
        <div class="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
            <div class="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-2xl border border-r3-border/30 reveal flex flex-col md:flex-row items-center gap-12">
                
                <div class="md:w-1/2 space-y-6 text-center md:text-left">
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-r3-slate font-bold text-xs tracking-wider rounded-full uppercase border border-blue-100">
                        <svg class="w-4 h-4 text-r3-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Gestión Inteligente
                    </div>
                    <h2 class="text-3xl sm:text-4xl font-extrabold text-r3-slate leading-tight">
                        Soy tu Asesor de IA.<br>¿Agendamos una cita?
                    </h2>
                    <p class="text-r3-muted text-base leading-relaxed">
                        Me encargaré de gestionar tu solicitud de forma inmediata, recolectar tus datos y agendar tu espacio con nuestros contadores expertos.
                    </p>
                    <div class="pt-4 flex flex-col items-center md:items-start space-y-3">
                        <button onclick="document.getElementById('toggle-chat-btn').click()" class="ghost-btn ghost-btn-dark inline-flex items-center justify-center gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest rounded-none shadow-lg hover:shadow-xl transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                            Iniciar Chat R3Bot
                        </button>
                    </div>
                </div>

                <div class="md:w-1/2 flex justify-center w-full">
                    <div class="relative w-full max-w-[280px] aspect-square bg-gradient-to-tr from-r3-slate to-[#2a3a52] rounded-full flex flex-col items-center justify-center shadow-inner border-[12px] border-gray-50 overflow-hidden transform hover:scale-105 transition-transform duration-500 hover:shadow-2xl">
                        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-30"></div>
                        <div class="w-20 h-20 bg-r3-gold rounded-full flex items-center justify-center text-r3-slate font-extrabold text-3xl shadow-2xl mb-6 relative z-10 border-4 border-white">
                            R3
                        </div>
                        <div class="flex gap-2 relative z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                            <span class="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span>
                            <span class="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                            <span class="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                        </div>
                        <p class="text-white/60 text-[10px] mt-4 uppercase tracking-widest font-semibold relative z-10">Agente en Línea</p>
                    </div>
                </div>

            </div>
        </div>
    </section>'''
html = agendar_pattern.sub(agendar_new, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Now fix app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

ham_old = '''            if (isOpen) {
                ham1.style.transform = 'rotate(45deg) translateY(5px)';
                ham2.style.opacity = '0';
                ham3.style.transform = 'rotate(-45deg) translateY(-5px)';
                ham3.style.width = '1.5rem';
            } else {
                ham1.style.transform = '';
                ham2.style.opacity = '1';
                ham3.style.transform = '';
                ham3.style.width = '1rem';
            }'''
ham_new = '''            if (isOpen) {
                ham1.style.transform = 'translateY(10px) rotate(45deg)';
                ham2.style.opacity = '0';
                ham3.style.transform = 'translateY(-10px) rotate(-45deg)';
            } else {
                ham1.style.transform = '';
                ham2.style.opacity = '1';
                ham3.style.transform = '';
            }'''
app_js = app_js.replace(ham_old, ham_new)

# Remove the old form listener to avoid errors since form is gone
form_listener_pattern = re.compile(r"document\.getElementById\('agendar-form'\)\.addEventListener\('submit', async \(e\) => \{.*?\n        \}\);", re.DOTALL)
app_js = form_listener_pattern.sub("", app_js)

bot_old_pattern = re.compile(r"let chatStep = 0;.*?\n        sendChatBtn\.addEventListener", re.DOTALL)
bot_new = '''let chatStep = 0;
        let mockData = { nombre: '', telefono: '', motivo: '', servicioClass: '' };

        async function handleChatSubmit() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage(text, true);
            chatInput.value = '';
            chatInput.disabled = true;
            
            await new Promise(r => setTimeout(r, 800));

            const lowerText = text.toLowerCase();
            const technicalWords = ['iva', 'dian', 'impuesto', 'retefuente', 'pago', 'declarar', 'factura', 'renta', 'declaración', 'sanción'];
            const isTechnical = technicalWords.some(word => lowerText.includes(word));

            if (isTechnical && chatStep !== 1 && chatStep !== 2) {
                addMessage("Esa es una consulta muy importante. Precisamente para resolver esas dudas técnicas, te invito a agendar una cita de valoración con uno de nuestros expertos contadores.\\n\\nPara agendarte, ¿podrías indicarme tu nombre completo?");
                chatStep = 1;
            } else if (chatStep === 0) {
                mockData.motivo = text;
                
                if (lowerText.includes('dian') || lowerText.includes('rut')) mockData.servicioClass = 'Trámites DIAN';
                else if (lowerText.includes('renta')) mockData.servicioClass = 'Declaración de Renta';
                else if (lowerText.includes('world office') || lowerText.includes('software')) mockData.servicioClass = 'Implementación World Office';
                else mockData.servicioClass = 'Asesoría Contable General';

                addMessage("Entiendo. Para poder ayudarte mejor y agendar un espacio con el equipo, ¿podrías indicarme tu nombre completo?");
                chatStep = 1;
            } else if (chatStep === 1) {
                mockData.nombre = text;
                addMessage(`Gracias ${text.split(' ')[0]}. Ahora, ¿me proporcionas un teléfono de contacto o WhatsApp para confirmar tu cita?`);
                chatStep = 2;
            } else if (chatStep === 2) {
                mockData.telefono = text;
                if (!mockData.motivo) mockData.motivo = "Consulta general agendada directamente después de restricción técnica.";
                if (!mockData.servicioClass) mockData.servicioClass = "Asesoría o Valoración Inicial";

                addMessage("¡Perfecto! Hemos registrado tu solicitud. Un experto de R3 Consultores analizará tu caso y te contactará a la brevedad.\\n\\n✅ *Simulando envío de correo estructurado a info@r3consultores.com...*");
                
                await new Promise(r => setTimeout(r, 1500));
                
                const correoSimulado = `Asunto: [NUEVA CITA PENDIENTE] - Solicitud de ${mockData.nombre}
-----------------------------------------------------------
Datos: [${mockData.nombre}, ${mockData.telefono}]
Servicio clasificado por la IA: [${mockData.servicioClass}]
Resumen de la necesidad (Interpretación AI): [El cliente requiere asistencia para: ${mockData.motivo}]`;
                
                addMessage(`<pre class="text-[10px] bg-gray-50 p-3 rounded-lg border border-gray-100 break-words whitespace-pre-wrap text-gray-700 font-mono shadow-inner mt-2">${correoSimulado}</pre>`);
                chatStep = 3;
            } else {
                addMessage("Tu solicitud ya está en proceso. Nuestro equipo se comunicará contigo pronto al " + mockData.telefono + ".");
            }
            
            chatInput.disabled = false;
            chatInput.focus();
        }

        sendChatBtn.addEventListener'''
app_js = bot_old_pattern.sub(bot_new, app_js)

# Also fix the `ham3.style.width` calls in `mobile-link` clicks that might throw errors since we removed `w-4` styling
app_js = app_js.replace("ham3.style.width = '1rem';", "")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

