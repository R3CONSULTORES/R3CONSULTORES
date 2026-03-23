import { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';
import { MessageSquare, X, Send, User, Bot, CheckCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Componente Interno del Calendario inteligente
const CalendarWidget = ({ onSelectDateTime }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // El usuario solicitó bloques fijos de 2h entre 8am y 5pm, omitiendo 12pm a 2pm.
  // Esto nos deja: 08:00, 10:00, 14:00, 15:00
  const FIXED_BLOCKS = ['08:00', '10:00', '14:00', '15:00'];

  // Fecha min hoy
  const todayRaw = new Date();
  // Ensure correct formatting avoiding local tz offset issues
  const todayStr = new Date(todayRaw.getTime() - (todayRaw.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const fetchAvailability = async (dateStr) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      // Bloquear localmente Sábados y Domingos (0 = Domingo, 6 = Sábado)
      // Agregamos 'T00:00:00' para que no haya offset de zona horaria local
      const d = new Date(dateStr + 'T00:00:00');
      if (d.getDay() === 0 || d.getDay() === 6) {
        setAvailableSlots([]); // No hay turnos fines de semana
        setIsLoading(false);
        return;
      }

      // Buscar si ya hay citas en Supabase en esta fecha
      // Supabase guarda en 'text', así que buscaremos las que comiencen por esa fecha
      const { data, error } = await supabase
        .from('citas')
        .select('fecha_hora_propuesta')
        .ilike('fecha_hora_propuesta', `${dateStr}%`);

      if (error) throw error;

      // Filter available times
      let occupied = [];
      if (data && data.length > 0) {
        occupied = data.map(row => {
          if (!row.fecha_hora_propuesta) return null;
          // Split on space or T
          const parts = row.fecha_hora_propuesta.split(/[\sT]+/);
          if (parts.length > 1) {
            return parts[1].substring(0, 5); // gets '10:00'
          }
          return null;
        }).filter(Boolean);
      }

      const free = FIXED_BLOCKS.filter(block => !occupied.includes(block));
      setAvailableSlots(free);

    } catch (err) {
      console.error('Error fetching slots:', err);
      // Fallback a mostrar todos si falla la DB, o preferiblemente mostrar error.
      setIsError(true);
    }
    setIsLoading(false);
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    if (val) {
       fetchAvailability(val);
    } else {
       setAvailableSlots([]);
    }
  };

  return (
    <div className="bg-white border text-center p-4 py-3 rounded-2xl shadow-sm max-w-[95%] mx-auto mt-2">
      <div className="flex items-center gap-2 mb-3 text-r3-slate font-bold text-sm justify-center">
        <CalendarIcon className="w-4 h-4 text-r3-gold" />
        Sincronizando Agenda
      </div>
      
      <p className="text-xs text-r3-muted mb-3">Selecciona un día para ver los bloques de 2 horas disponibles.</p>
      
      <input 
        type="date" 
        min={todayStr}
        value={selectedDate}
        onChange={handleDateChange}
        className="w-full bg-gray-50 border border-gray-200 text-r3-text text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-r3-gold/50 outline-none mb-4 appearance-none"
      />

      {selectedDate && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-xs text-gray-400 py-2">Consultando disponibilidad...</div>
          ) : isError ? (
            <div className="text-xs text-red-400 py-2">Error cargando agenda, inténtalo de nuevo.</div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map(time => (
                <button
                  key={time}
                  onClick={() => onSelectDateTime(selectedDate, time)}
                  className="flex items-center justify-center gap-2 py-2 px-1 text-xs font-semibold rounded bg-r3-gold/10 text-r3-slate border border-r3-gold/30 hover:bg-r3-gold hover:text-white transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-medium text-red-500 py-2 bg-red-50 rounded border border-red-100">
              No hay citas disponibles o es fin de semana.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AppointmentForm() {
  const { messages, isOpen, toggleChat, processResponse, isTyping, showCalendar, handleDateSelection } = useAIAgent();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus input when bot finishes typing
  useEffect(() => {
    if (!isTyping && isOpen && !showCalendar) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isTyping, isOpen, showCalendar]);

  // Auto-scroll chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showCalendar]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping || showCalendar) return;
    const text = inputText;
    setInputText('');
    processResponse(text);
  };

  return (
    <>
      <section id="contacto" className="snap-section bg-[#f8fafc] py-16 lg:py-0 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-r3-gold/10 rounded-full blur-3xl"></div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 relative z-10">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-2xl border border-r3-border/30 reveal anim-hidden anim-fade-scale flex flex-col md:flex-row items-center gap-12">
            
            <div className="md:w-1/2 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1e293b] font-bold text-xs tracking-wider rounded-full uppercase border border-blue-100">
                <CheckCircle className="w-4 h-4 text-[#f6b034]" />
                Gestión Inteligente
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] leading-tight">
                Soy tu Asesor de IA.<br/>¿Agendamos una cita?
              </h2>

              {/* AI Speech Bubble */}
              <div className="relative bg-[#f8fafc] border border-gray-200 rounded-2xl rounded-bl-sm p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#f6b034] rounded-full flex items-center justify-center text-[#1e293b] font-bold text-xs shrink-0 shadow-md">R3</div>
                  <p className="text-[#64748b] text-sm leading-relaxed">
                    Hola. Cuéntanos brevemente qué requerimiento tienes (ej. revisión de renta, outsourcing contable) y te guiaré a través de nuestro proceso inteligente para agendar tu cita oficial.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center md:items-start space-y-3">
                <button 
                  onClick={toggleChat} 
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold uppercase tracking-widest rounded-lg bg-[#f6b034] text-white shadow-lg hover:shadow-xl hover:bg-[#e5a020] transition-all duration-300"
                >
                  <MessageSquare className="w-5 h-5" />
                  Iniciar Chat R3Bot
                </button>
              </div>
            </div>

            <div className="md:w-1/2 flex justify-center w-full">
              <div className="relative w-full max-w-[280px] aspect-square bg-gradient-to-tr from-r3-slate to-[#2a3a52] rounded-full flex flex-col items-center justify-center shadow-inner border-[12px] border-gray-50 overflow-hidden transform hover:scale-105 transition-transform duration-500 hover:shadow-2xl">
                <div className="w-20 h-20 bg-r3-gold rounded-full flex items-center justify-center text-r3-slate font-extrabold text-3xl shadow-2xl mb-6 relative z-10 border-4 border-white">
                  R3
                </div>
                <div className="flex gap-2 relative z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
                <p className="text-white/60 text-[10px] mt-4 uppercase tracking-widest font-semibold relative z-10">Agente en Línea</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flotantes de Contacto Inferiores */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
        {/* Chatbot Toggle Button */}
        {!isOpen && (
           <button 
            id="toggle-chat-btn"
            onClick={toggleChat}
            className="w-14 h-14 bg-r3-slate text-r3-gold rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform relative group border border-r3-gold/20"
            aria-label="Abrir Chat de IA"
          >
            <div className="absolute -top-2 -right-1 w-4 h-4 bg-r3-gold rounded-full border-2 border-r3-slate animate-pulse"></div>
            <MessageSquare className="w-6 h-6" />
          </button>
        )}

        {/* WhatsApp Button */}
        <a 
          href="https://wa.me/573004046628?text=Hola%2C%20me%20gustar%C3%ADa%20agendar%20una%20cita."
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform relative"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </a>
      </div>

      {/* AI Chat Panel Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-[360px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-r3-slate p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-r3-gold rounded-full flex items-center justify-center text-r3-slate font-bold text-xs">R3</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-r3-slate"></div>
              </div>
              <div>
                <h4 className="font-bold text-sm">R3Bot · Asesor de IA</h4>
                <p className="text-[10px] text-white/50">En línea</p>
              </div>
            </div>
            <button onClick={toggleChat} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 bg-r3-bg p-4 overflow-y-auto flex flex-col space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed bg-white border border-gray-100 text-r3-text rounded-tl-sm">
                  ¡Hola! Soy R3Bot, el asistente inteligente. Para agendar una cita necesito 4 datos: tu nombre, tu correo, un teléfono y el motivo de tu consulta. ¿Empezamos con tu nombre?
                </div>
              </div>
            )}
            
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col max-w-[85%] ${m.isUser ? 'items-end ml-auto' : 'items-start'}`}>
                <div 
                  className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.isUser 
                    ? 'bg-r3-gold text-r3-slate rounded-tr-sm font-medium' 
                    : 'bg-white border border-gray-100 text-r3-text rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }}
                />
              </div>
            ))}

            {showCalendar && (
              <CalendarWidget onSelectDateTime={handleDateSelection} />
            )}

            {isTyping && (
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm self-start w-fit shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="shrink-0 h-1" />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            {showCalendar ? (
              <div className="flex-1 text-xs text-center text-gray-400">Por favor escoge una fecha y hora en el calendario ☝️</div>
            ) : (
              <>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-gray-50 border-none outline-none px-4 py-2.5 rounded-full text-sm text-r3-text focus:ring-1 focus:ring-r3-gold/50"
                  disabled={isTyping}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 bg-r3-slate text-r3-gold rounded-full flex items-center justify-center hover:bg-r3-gold hover:text-r3-slate transition-colors disabled:opacity-50 disabled:hover:bg-r3-slate disabled:hover:text-r3-gold"
                >
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
