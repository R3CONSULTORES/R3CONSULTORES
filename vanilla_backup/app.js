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
                ham1.style.transform = 'translateY(10px) rotate(45deg)';
                ham2.style.opacity = '0';
                ham3.style.transform = 'translateY(-10px) rotate(-45deg)';
            } else {
                ham1.style.transform = '';
                ham2.style.opacity = '1';
                ham3.style.transform = '';
            }
        });
        document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
            isOpen = false;
            mobileMenu.classList.remove('open');
            ham1.style.transform = '';
            ham2.style.opacity = '1';
            ham3.style.transform = '';
            
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
        let supabaseClient = null;
        if (typeof window.supabase !== 'undefined' && supabaseUrlValid) 
            {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        

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

        sendChatBtn.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });

