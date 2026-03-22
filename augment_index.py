import sys

with open("index.html", "r") as f:
    content = f.read()

# 1. Logo logic swap
content = content.replace(
    "navLogo.src = scrolled ? 'assets/logo-azul.png' : 'assets/logo-amarillo.png';",
    "navLogo.src = scrolled ? 'assets/logo.png' : 'assets/logo-amarillo.png';"
)

# 2. Add Supabase script to head
content = content.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
)

# 3. Add Scheduling Section before CTA BAND
scheduling_section = """
    <!-- ========== AGENDAR CITA SECTION ========== -->
    <section id="agendar" class="bg-r3-bg py-24 lg:py-36">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div class="max-w-3xl mx-auto">
                <div class="text-center mb-12 reveal">
                    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-r3-slate leading-tight mb-4">
                        Agenda tu cita de Valoración/Consultoría
                    </h2>
                    <p class="text-r3-muted text-lg">
                        Déjenos sus datos y le confirmaremos su espacio con un experto.
                    </p>
                </div>
                
                <div class="bg-white rounded-2xl p-8 lg:p-12 shadow-xl border border-r3-border/30 reveal reveal-delay-1 relative">
                    <div id="form-success" class="hidden absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl text-center px-6">
                        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 class="text-2xl font-bold text-r3-slate mb-2">¡Solicitud Enviada!</h3>
                        <p class="text-r3-muted">Nos pondremos en contacto pronto para confirmar su cita.</p>
                        <button onclick="document.getElementById('form-success').classList.add('hidden'); document.getElementById('agendar-form').reset();" class="mt-6 text-r3-gold font-bold uppercase text-sm tracking-wider">Enviar nueva solicitud</button>
                    </div>

                    <form id="agendar-form" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-r3-slate mb-2">Nombre completo *</label>
                                <input type="text" id="form-nombre" required class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-r3-slate mb-2">Teléfono / WhatsApp *</label>
                                <input type="tel" id="form-telefono" required class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-r3-slate mb-2">Correo electrónico *</label>
                                <input type="email" id="form-correo" required class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-r3-slate mb-2">Nombre de la Empresa</label>
                                <input type="text" id="form-empresa" class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50" placeholder="Opcional">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-r3-slate mb-2">Motivo de la consulta *</label>
                            <textarea id="form-motivo" required rows="4" class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50 resize-none" placeholder="Ej: Necesito asesoría sobre el IVA y mi declaración de renta..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-r3-slate mb-2">Fecha y hora propuesta *</label>
                            <input type="datetime-local" id="form-fecha" required class="w-full px-4 py-3 rounded-lg border border-r3-border focus:border-r3-gold focus:ring-2 focus:ring-r3-gold/20 outline-none transition-all bg-r3-bg/50">
                        </div>

                        <!-- Payment disabled placeholder -->
                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                </div>
                                <div>
                                    <p class="font-bold text-gray-600 text-sm">Pasarela de Pago (En configuración)</p>
                                    <p class="text-xs text-gray-500">Valor de la consultoría: $150.000 COP</p>
                                </div>
                            </div>
                            <button type="button" disabled class="px-5 py-2.5 bg-gray-200 text-gray-400 font-bold uppercase tracking-wider text-xs rounded-lg cursor-not-allowed">
                                Pago temporalmente inhabilitado
                            </button>
                        </div>
                        <p class="text-center text-r3-gold-dark font-medium text-sm mt-2">✨ Agende su cita de valoración GRATIS por hoy ✨</p>

                        <button id="form-submit-btn" type="submit" class="w-full ghost-btn ghost-btn-gold py-4 text-sm font-bold uppercase tracking-widest rounded-none mt-4 flex items-center justify-center gap-2 transition-all">
                            <span>Enviar Solicitud</span>
                            <svg class="w-4 h-4 hidden" id="form-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.75V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.1266 6.87347L16.0659 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.25 12L17.75 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.1266 17.1265L16.0659 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 17.75V19.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.9342 16.0659L6.87354 17.1265" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.25 12L4.75 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.9342 7.93413L6.87354 6.87347" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

"""
content = content.replace('    <!-- ========== CTA BAND', scheduling_section + '    <!-- ========== CTA BAND')

# 4. Add Chatbot widget and scripts before closing body
chatbot_html = """
    <!-- ========== CHATBOT AGENTE DE IA ========== -->
    <div id="ai-chat-widget" class="fixed bottom-24 right-6 z-50 flex flex-col items-end pointer-events-none">
        <!-- Chat Panel -->
        <div id="ai-chat-panel" class="bg-white w-[350px] shadow-2xl rounded-2xl overflow-hidden mb-4 border border-r3-border/30 transition-all duration-300 transform scale-95 opacity-0 pointer-events-auto h-[500px] flex flex-col" style="display: none;">
            <div class="bg-r3-slate p-4 flex items-center justify-between text-white border-b border-white/10">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-r3-gold flex items-center justify-center text-r3-slate font-bold shadow-inner">R3</div>
                    <div>
                        <h4 class="font-bold text-sm">Asistente Virtual R3</h4>
                        <p class="text-[11px] text-white/70">IA de Agendamiento</p>
                    </div>
                </div>
                <button id="close-chat-btn" class="text-white/70 hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-r3-bg/50 custom-scrollbar">
                <!-- Initial Message -->
                <div class="flex flex-col items-start max-w-[85%]">
                    <div class="bg-white border border-gray-100 p-3.5 rounded-2xl rounded-tl-sm shadow-sm text-sm text-r3-text leading-relaxed">
                        ¡Hola! Soy el asistente de agendamiento de R3 Consultores. ¿En qué puedo ayudarte hoy? ¿Te gustaría agendar una cita de valoración?
                    </div>
                </div>
            </div>
            <div class="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shadow-inner">
                <input type="text" id="chat-input" class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-r3-gold focus:ring-1 focus:ring-r3-gold transition-all bg-gray-50" placeholder="Escribe tu mensaje...">
                <button id="send-chat-btn" class="w-10 h-10 rounded-full bg-r3-gold text-r3-slate flex items-center justify-center hover:bg-r3-gold-dark transition-colors shadow-md">
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        </div>

        <!-- Floating Chat Button -->
        <button id="toggle-chat-btn" class="w-16 h-16 bg-r3-slate text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-r3-slate-light transition-all transform hover:scale-105 pointer-events-auto border-2 border-r3-gold relative group">
            <span class="absolute -top-1 -right-1 flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-r3-gold opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-r3-gold border-2 border-r3-slate"></span>
            </span>
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </button>
    </div>

    <!-- ========== SUPABASE & CHATBOT LOGIC ========== -->
    <script>
        // Supabase Integration & Form Handling
        const SUPABASE_URL = 'https://reabgfqqamcefhsgylyd.supabase.co';
        const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI'; // Placeholder - Reemplazar con clave real
        
        // Solo inicializar si la clave fue provista
        const supabaseUrlValid = SUPABASE_URL.startsWith('http');
        const supabase = (typeof supabase !== 'undefined' && supabaseUrlValid) 
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
            : null;

        document.getElementById('agendar-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('form-submit-btn');
            const spinner = document.getElementById('form-spinner');
            const successMsg = document.getElementById('form-success');
            
            // UI Loading state
            btn.querySelector('span').textContent = 'Enviando...';
            spinner.classList.remove('hidden');
            spinner.classList.add('animate-spin');
            btn.disabled = true;

            const datosCliente = {
                nombre_completo: document.getElementById('form-nombre').value,
                telefono: document.getElementById('form-telefono').value,
                email: document.getElementById('form-correo').value,
                nombre_empresa: document.getElementById('form-empresa').value || null
            };

            const datosCita = {
                motivo_consulta: document.getElementById('form-motivo').value,
                fecha_hora_propuesta: new Date(document.getElementById('form-fecha').value).toISOString(),
            };

            try {
                if (!supabase || SUPABASE_ANON_KEY === 'TU_ANON_KEY_AQUI') {
                    // Simular retraso de red si no hay API Key real
                    await new Promise(r => setTimeout(r, 1500));
                    console.log('Modo de Simulación: No Supabase Key provided. Form submitted sucessfully visually.');
                } else {
                    // Inserción Real en Supabase
                    const { data: cliente, error: errCliente } = await supabase
                        .from('clientes')
                        .insert([datosCliente])
                        .select()
                        .single();
                        
                    if (errCliente) throw errCliente;

                    const { error: errCita } = await supabase
                        .from('citas')
                        .insert([
                            { ...datosCita, cliente_id: cliente.id }
                        ]);

                    if (errCita) throw errCita;
                }
                
                // Show Success
                successMsg.classList.remove('hidden');
                
            } catch (err) {
                console.error('Error insertando en Supabase:', err);
                alert('Hubo un error al enviar su solicitud. Por favor intente nuevamente o contáctenos por WhatsApp.');
            } finally {
                // Reset Loading State
                btn.querySelector('span').textContent = 'Enviar Solicitud';
                spinner.classList.add('hidden');
                spinner.classList.remove('animate-spin');
                btn.disabled = false;
            }
        });

        // Chatbot UI Logic (Simulación de Agente AI)
        const toggleChatBtn = document.getElementById('toggle-chat-btn');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const chatPanel = document.getElementById('ai-chat-panel');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');
        const chatMessages = document.getElementById('chat-messages');

        let isChatOpen = false;
        
        function toggleChat() {
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                chatPanel.style.display = 'flex';
                // Trigger reflow for animation
                void chatPanel.offsetWidth;
                chatPanel.classList.remove('scale-95', 'opacity-0');
                chatPanel.classList.add('scale-100', 'opacity-100');
                chatInput.focus();
            } else {
                chatPanel.classList.remove('scale-100', 'opacity-100');
                chatPanel.classList.add('scale-95', 'opacity-0');
                setTimeout(() => chatPanel.style.display = 'none', 300);
            }
        }

        toggleChatBtn.addEventListener('click', toggleChat);
        closeChatBtn.addEventListener('click', toggleChat);

        function addMessage(text, isUser = false) {
            const wrapper = document.createElement('div');
            wrapper.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'ml-auto' : ''}`;
            
            const bubble = document.createElement('div');
            bubble.className = `p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                isUser 
                ? 'bg-r3-gold text-r3-slate rounded-tr-sm font-medium' 
                : 'bg-white border border-gray-100 text-r3-text rounded-tl-sm'
            }`;
            bubble.innerHTML = text.replace(/\\n/g, '<br>');
            
            wrapper.appendChild(bubble);
            chatMessages.appendChild(wrapper);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Extremely simplified simulation of the AI Agent Flow for demo purposes.
        let chatStep = 0;
        let mockData = {};

        async function handleChatSubmit() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage(text, true);
            chatInput.value = '';
            chatInput.disabled = true;
            
            // Simulate typing delay
            await new Promise(r => setTimeout(r, 800));

            // Simulating AI Responses avoiding technical advice
            const lowerText = text.toLowerCase();
            if (lowerText.includes('iva') || lowerText.includes('dian') || lowerText.includes('impuesto') || lowerText.includes('retefuente') || lowerText.includes('pago') || lowerText.includes('declarar') || lowerText.includes('factura')) {
                addMessage("Esa es una excelente pregunta. Precisamente en nuestra cita de valoración un experto contador de R3 Consultores resolverá esa duda en detalle.\\n\\nPara agendarte, ¿podrías indicarme tu nombre completo y teléfono de contacto o correo?");
                chatStep = 1;
            } else if (chatStep === 0) {
                addMessage("Entiendo. Para poder ayudarte mejor e iniciar el agendamiento, ¿podrías indicarme tu nombre completo y teléfono de WhatsApp o correo?");
                chatStep = 1;
            } else if (chatStep === 1) {
                mockData.contacto = text;
                addMessage("¡Gracias! Por último, ¿para qué fecha y hora te gustaría agendar la cita de valoración?");
                chatStep = 2;
            } else if (chatStep === 2) {
                mockData.fecha = text;
                addMessage("¡Perfecto! Hemos agendado tentativamente tu cita. Un experto de R3 Consultores se contactará contigo pronto para confirmarla.\\n\\n✅ *Simulando envío de correo interno...*");
                
                await new Promise(r => setTimeout(r, 1500));
                
                // Simulate Final Output specified in the prompt
                const jsonOutput = {
                  "ACCION": "ENVIAR_CORREO",
                  "destinatario": "info@r3consultores.com",
                  "asunto": "Nueva Cita de Consultoría Agendada - " + (mockData.contacto.split(' ')[0] || "Cliente"),
                  "datos_cliente": {
                      "contacto": mockData.contacto
                  },
                  "fecha_hora": mockData.fecha,
                  "resumen_necesidad_ia": "El cliente solicita una consulta. Posiblemente relacionada con gestión tributaria o contable. Ha sido redirigido a la cita de valoración de acuerdo a las políticas del agente."
                };
                
                addMessage(`<pre class="text-[10px] bg-gray-50 p-3 rounded-lg border border-gray-100 break-words whitespace-pre-wrap text-gray-600 font-mono shadow-inner mt-2">${JSON.stringify(jsonOutput, null, 2)}</pre>`);
                chatStep = 3;
            } else {
                addMessage("Tu cita ya está registrada. Si necesitas realizar un cambio, puedes escribirnos directamente por WhatsApp.");
            }
            
            chatInput.disabled = false;
            chatInput.focus();
        }

        sendChatBtn.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });

    </script>
"""
content = content.replace('</body>', chatbot_html + "\n</body>")

with open("index.html", "w") as f:
    f.write(content)

print("index.html augmented successfully!")
