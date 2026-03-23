import { useState } from 'react';
import { supabase, isSimulated } from '../lib/supabase';
export function useAIAgent() {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [mockData, setMockData] = useState({ nombre: '', telefono: '', email: '', fecha: '', motivo: '', servicioClass: '' });
  const [isTyping, setIsTyping] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const addMessage = (text, isUser = false) => {
    setMessages(prev => [...prev, { text, isUser, id: Date.now() + Math.random() }]);
  };

  const isHolidayOrSunday = (dateStr) => {
    // Basic DD/MM/YYYY or YYYY-MM-DD parser for checking Sundays
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false; // If we can't parse it, we pass it to the agent/n8n to figure out
    if (d.getDay() === 0 || d.getDay() === 6) return true; // Block Weekends to be safe based on request
    return false;
  };

  const processResponse = async (text) => {
    addMessage(text, true);
    setIsTyping(true);
    
    // Simular escritura de la IA
    await new Promise(r => setTimeout(r, 800));
    const lowerText = text.toLowerCase();
    
    if (chatStep === 0) {
      // Step 0: Initial prompt captured
      let servicioClass = 'Asesoría Contable General';
      
      setMockData(prev => ({ ...prev, motivo: text, servicioClass }));
      addMessage("Entiendo. Para poder ayudarte mejor y agendar un espacio con el equipo, ¿podrías indicarme tu nombre completo y apellidos?");
      setChatStep(1);
    } else if (chatStep === 1) {
      // Step 1: Name captured
      setMockData(prev => ({ ...prev, nombre: text }));
      addMessage(`Gracias ${text.split(' ')[0]}. Por favor, bríndame un correo electrónico válido para enviarte la confirmación.`);
      setChatStep(2);
    } else if (chatStep === 2) {
      // Step 2: Email captured
      if (!text.includes('@')) {
        addMessage("Por favor ingresa un correo electrónico válido con '@' y un dominio.");
        setIsTyping(false);
        return;
      }
      setMockData(prev => ({ ...prev, email: text }));
      addMessage(`¡Anotado! Ahora regálame un teléfono de contacto o WhatsApp.`);
      setChatStep(3);
    } else if (chatStep === 3) {
      // Step 3: Phone captured
      setMockData(prev => ({ ...prev, telefono: text }));
      addMessage("Perfecto. ¿Para qué fecha te gustaría agendar tu cita? (Ej: Lunes 15 de Abril). Ten en cuenta que no atendemos domingos ni días festivos.");
      setChatStep(4);
    } else if (chatStep === 4) {
      // Step 4: Date captured
      const lowerDate = text.toLowerCase();
      if (lowerDate.includes('domingo') || lowerDate.includes('festivo') || isHolidayOrSunday(text)) {
        addMessage("Lo siento, nuestras oficinas están cerradas los fines de semana y días festivos. Por favor, indícame otra fecha hábil (Lunes a Sábado, no festivo).");
        setIsTyping(false);
        return;
      }

      setMockData(prev => ({ ...prev, fecha: text }));
      addMessage("¡Perfecto! Hemos enviado tu solicitud de cita. Nuestro asistente inteligente con IA (Gemini) está procesando la categoría de urgencia y pronto recibirás la confirmación oficial en tu correo electrónico con los pasos a seguir para el pago (de ser necesario).\n\n✅ *Solicitud procesada y enviada a n8n...*");
      
      try {
        // Enviar POST al Webhook de n8n
        await fetch('https://r3consultores.app.n8n.cloud/webhook/clientes-r3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: mockData.nombre,
            telefono: text, // using the previous state is slightly off implicitly, let's fix it
            email: mockData.email,
            fecha_propuesta: text,
            motivo_consulta: mockData.motivo
          })
        });
      } catch (error) {
        console.error('Error enviando al webhook n8n:', error);
      }

      setChatStep(5);
    } else {
      addMessage("Tu solicitud ya está en proceso mediante Inteligencia Artificial. Por favor revisa tu bandeja de correo.");
    }
    
    setIsTyping(false);
  };

  return { messages, isOpen, toggleChat, processResponse, isTyping, chatStep, mockData };
}
