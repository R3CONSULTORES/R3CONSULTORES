/**
 * R3 Consultores - Lógica Frontend
 * Menú, Scroll, Supabase y Agente de IA
 */

        // Mobile menu
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const ham1 = document.getElementById('ham-1');
        const ham2 = document.getElementById('ham-2');
        const ham3 = document.getElementById('ham-3');
        let isOpen = false;
        menuBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            mobileMenu.classList.toggle('open', isOpen);
            if (isOpen) {
                ham1.style.transform = 'rotate(45deg) translateY(5px)';
                ham2.style.opacity = '0';
                ham3.style.transform = 'rotate(-45deg) translateY(-5px)';
                ham3.style.width = '1.5rem';
            } else {
                ham1.style.transform = '';
                ham2.style.opacity = '1';
                ham3.style.transform = '';
                ham3.style.width = '1rem';
            }
        });
        document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
            isOpen = false;
            mobileMenu.classList.remove('open');
            ham1.style.transform = '';
            ham2.style.opacity = '1';
            ham3.style.transform = '';
            ham3.style.width = '1rem';
        }));

        // Navbar: transparent → solid on scroll, switch link colors
        const navbar = document.getElementById('navbar');
        const navLinks = navbar.querySelectorAll('nav a, #nav-portal');
        function updateNav() {
            const scrolled = window.scrollY > 80;
            navbar.classList.toggle('nav-scrolled', scrolled);
            // Switch link colors
            navbar.querySelectorAll('nav a:not(#nav-portal)').forEach(a => {
                if (scrolled) {
                    a.classList.remove('text-white/80');
                    a.classList.add('text-r3-text/70', 'hover:!text-r3-gold');
                } else {
                    a.classList.remove('text-r3-text/70');
                    a.classList.add('text-white/80');
                }
            });
            const portal = document.getElementById('nav-portal');
            const navLogo = document.getElementById('nav-logo');
            if (portal) {
                if (scrolled) {
                    portal.classList.remove('ghost-btn-light');
                    portal.classList.add('ghost-btn-dark');
                } else {
                    portal.classList.remove('ghost-btn-dark');
                    portal.classList.add('ghost-btn-light');
                }
            }
            // Swap logo based on background
            if (navLogo) {
                navLogo.src = scrolled ? 'assets/logo.png' : 'assets/logo-amarillo.png';
            }
        }
        window.addEventListener('scroll', updateNav);
        updateNav();

        // Scroll reveal
        const revealEls = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
        }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
        revealEls.forEach(el => observer.observe(el));

        // Pill nav active state on scroll
        const sections = ['servicios', 'nosotros', 'contacto'];
        const pillLinks = document.querySelectorAll('.pill-link');
        function updatePills() {
            let current = '';
            sections.forEach(id => {
                const sec = document.getElementById(id);
                if (sec && window.scrollY >= sec.offsetTop - 300) current = id;
            });
            pillLinks.forEach(link => {
                const href = link.getAttribute('href').replace('#', '');
                if (href === current) {
                    link.classList.add('active-pill');
                } else {
                    link.classList.remove('active-pill');
                }
            });
        }
        window.addEventListener('scroll', updatePills);


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
            bubble.innerHTML = text.replace(/\n/g, '<br>');
            
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
                addMessage("Esa es una excelente pregunta. Precisamente en nuestra cita de valoración un experto contador de R3 Consultores resolverá esa duda en detalle.\n\nPara agendarte, ¿podrías indicarme tu nombre completo y teléfono de contacto o correo?");
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
                addMessage("¡Perfecto! Hemos agendado tentativamente tu cita. Un experto de R3 Consultores se contactará contigo pronto para confirmarla.\n\n✅ *Simulando envío de correo interno...*");
                
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

