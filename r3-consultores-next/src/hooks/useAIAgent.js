"use client";

import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
const isSimulated = false;
export function useAIAgent() {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [mockData, setMockData] = useState({ nombre: '', telefono: '', motivo: '', servicioClass: '' });
  const [isTyping, setIsTyping] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const addMessage = (text, isUser = false) => {
    setMessages(prev => [...prev, { text, isUser, id: Date.now() + Math.random() }]);
  };

  const processResponse = async (text) => {
    addMessage(text, true);
    setIsTyping(true);
    
    // Simular escritura de la IA
    await new Promise(r => setTimeout(r, 800));
    const lowerText = text.toLowerCase();
    
    // Restricciones Técnicas
    const technicalWords = ['iva', 'dian', 'impuesto', 'retefuente', 'pago', 'declarar', 'factura', 'renta', 'declaración', 'sanción'];
    const isTechnical = technicalWords.some(word => lowerText.includes(word));

    if (isTechnical && chatStep !== 1 && chatStep !== 2) {
      setMockData(prev => ({ ...prev, motivo: text, servicioClass: 'Consultoría Técnica/Especializada' }));
      addMessage("Esa es una consulta muy importante. Precisamente para resolver esas dudas técnicas, te invito a agendar una cita de valoración con uno de nuestros expertos contadores.\n\nPara agendarte, ¿podrías indicarme tu nombre completo?");
      setChatStep(1);
    } else if (chatStep === 0) {
      // Step 0: Initial prompt captured
      let servicioClass = 'Asesoría Contable General';
      if (lowerText.includes('dian') || lowerText.includes('rut')) servicioClass = 'Trámites DIAN';
      else if (lowerText.includes('renta')) servicioClass = 'Declaración de Renta';
      else if (lowerText.includes('world office') || lowerText.includes('software')) servicioClass = 'Implementación World Office';
      
      setMockData(prev => ({ ...prev, motivo: text, servicioClass }));
      addMessage("Entiendo. Para poder ayudarte mejor y agendar un espacio con el equipo, ¿podrías indicarme tu nombre completo y apellidos?");
      setChatStep(1);
    } else if (chatStep === 1) {
      // Step 1: Name captured
      setMockData(prev => ({ ...prev, nombre: text }));
      addMessage(`Gracias ${text.split(' ')[0]}. Ahora, ¿me proporcionas un teléfono de contacto o WhatsApp para confirmar tu cita?`);
      setChatStep(2);
    } else if (chatStep === 2) {
      // Step 2: Phone captured
      setMockData(prev => ({ ...prev, telefono: text }));
      addMessage("¡Perfecto! Hemos registrado tu solicitud. Un experto de R3 Consultores analizará tu caso y te contactará a la brevedad.\n\n✅ *Solicitud enviada a la base de datos de asesores...*");
      
      if (!isSimulated && supabase) {
        try {
          // Generate an ID for the client to bypass needing SELECT RLS permissions to get the generated ID
          const newClienteId = crypto.randomUUID();

          // 1. Insert Client (without .select())
          const { error: errCliente } = await supabase
            .from('clientes')
            .insert({ 
              id: newClienteId,
              nombre_completo: mockData.nombre, 
              email: 'pendiente_' + Date.now() + '@r3consultores.local', 
              telefono: text,
              nombre_empresa: 'No especificada'
            });

          // 2. Insert Appointment if no error
          if (!errCliente) {
            const { error: errCita } = await supabase
              .from('citas')
              .insert({ 
                cliente_id: newClienteId, 
                fecha_hora_propuesta: new Date().toISOString(),
                motivo_consulta: mockData.servicioClass,
                resumen_ia_necesidad: mockData.motivo,
                estado: 'pendiente'
              });
              
              if (errCita) console.error('Error insertando cita en Supabase:', errCita);
          } else {
             console.error('Error insertando cliente en Supabase:', errCliente);
          }
        } catch (error) {
          console.error('Supabase error:', error);
        }
      }
      
      await new Promise(r => setTimeout(r, 1500));
      setChatStep(3);
    } else {
      addMessage("Tu solicitud ya está en proceso. Nuestro equipo se comunicará contigo pronto.");
    }
    
    setIsTyping(false);
  };

  return { messages, isOpen, toggleChat, processResponse, isTyping, chatStep, mockData };
}
