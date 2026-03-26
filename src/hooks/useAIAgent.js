import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAIAgent() {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    // Generate unique session ID on mount
    setSessionId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  const addMessage = (text, isUser = false) => {
    setMessages(prev => [...prev, { text, isUser, id: Date.now() + Math.random() }]);
  };

  const processResponse = async (text) => {
    if (!text.trim()) return;
    
    // Si el usuario escribe algo normal o ocultamos [DATE_SELECTED], solo mostramos lo visible
    if (!text.includes('[DATE_SELECTED]')) {
      addMessage(text, true);
    } else {
      // Just visually show what they picked
      addMessage(`🗓️ Fecha seleccionada: ${text.replace('[DATE_SELECTED] ', '')}`, true);
    }
    
    setIsTyping(true);
    
    try {
      const response = await fetch('https://r3consultores.app.n8n.cloud/webhook/chat-agendamiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          action: 'sendMessage',
          message: text
        })
      });

      if (!response.ok) {
        addMessage("Lo siento, estoy teniendo problemas de conexión. Por favor intenta en unos segundos.");
        setIsTyping(false);
        return;
      }
      
      const data = await response.json();
      const reply = data.output || data.reply || data.response || "Completado.";

      if (reply.includes('[REQUEST_DATE]')) {
        const cleanReply = reply.replace('[REQUEST_DATE]', '').trim();
        if (cleanReply) addMessage(cleanReply);
        setShowCalendar(true);
      } else {
        addMessage(reply);
      }

    } catch (error) {
      console.error('Error enviando al webhook n8n:', error);
      addMessage("Error de conexión con nuestro servidor de IA. Asegúrate de que el Workflow de n8n esté activo o publicado.");
    }

    setIsTyping(false);
  };

  const handleDateSelection = (dateStr, timeStr) => {
    setShowCalendar(false);
    // Enviar en formato ISO con offset Colombia (-05:00) para que n8n
    // lo envíe correctamente a Google Calendar
    const isoDateTime = `${dateStr}T${timeStr}:00-05:00`;
    const confirmText = `[DATE_SELECTED] ${isoDateTime}`;
    processResponse(confirmText);
  };

  return { messages, isOpen, toggleChat, processResponse, isTyping, showCalendar, handleDateSelection };
}
