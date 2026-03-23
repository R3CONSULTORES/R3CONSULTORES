
import React, { useState, useRef, useEffect } from 'react';
import { hashPin } from '../utils/security';
import { ArrowRightIcon, CheckCircleIcon, ExclamationCircleIcon, BoltIcon } from '../components/Icons';

import { supabase } from '../../src/lib/supabase';

interface SetupPinProps {
    onComplete: () => void;
    onCancel?: () => void;
}

const SetupPin: React.FC<SetupPinProps> = ({ onComplete, onCancel }) => {
    // Estado para los 4 dígitos del PIN principal
    const [pin, setPin] = useState(['', '', '', '']);
    // Estado para los 4 dígitos de confirmación
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'success'>('input');

    // Referencias para manejar el foco de los inputs
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Función genérica para manejar cambios en los inputs
    const handleDigitChange = (
        value: string, 
        index: number, 
        type: 'pin' | 'confirm',
        setter: React.Dispatch<React.SetStateAction<string[]>>, 
        refs: React.MutableRefObject<(HTMLInputElement | null)[]>
    ) => {
        // Solo permitir números
        if (!/^\d*$/.test(value)) return;

        // Tomar solo el último caracter si escriben rápido
        const digit = value.slice(-1);

        setter(prev => {
            const newPin = [...prev];
            newPin[index] = digit;
            return newPin;
        });

        // Auto-focus al siguiente input si hay un dígito
        if (digit && index < 3) {
            refs.current[index + 1]?.focus();
        }
    };

    // Función para manejar Backspace y mover el foco atrás
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>, 
        index: number, 
        currentValue: string,
        refs: React.MutableRefObject<(HTMLInputElement | null)[]>
    ) => {
        if (e.key === 'Backspace' && !currentValue && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handleSavePin = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const pinString = pin.join('');
            const confirmString = confirmPin.join('');

            // Validaciones básicas
            if (pinString.length !== 4 || confirmString.length !== 4) {
                throw new Error("Por favor completa los 4 dígitos en ambos campos.");
            }

            if (pinString !== confirmString) {
                throw new Error("Los PINs no coinciden. Por favor verifica.");
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error("No hay sesión de usuario activa.");
            }

            // --- HASHING SEGURO ---
            // Nunca guardamos el PIN plano. Usamos la utilidad de seguridad.
            const hashedPin = await hashPin(pinString);

            // Guardar en Supabase user_metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    pinHash: hashedPin,
                    hasPinConfigured: true,
                    updatedAt: new Date().toISOString(),
                    lastPinUpdate: new Date().toISOString()
                }
            });

            if (updateError) throw updateError;

            // --- ALMACENAMIENTO LOCAL PARA LOGIN RÁPIDO ---
            // Guardamos el hash localmente para poder verificarlo en el Login sin necesidad
            // de consultar Firestore (ya que al estar deslogueado, no tendríamos permisos de lectura).
            const localAuthData = {
                email: user.email,
                displayName: user.user_metadata?.displayName || user.email?.split('@')[0],
                pinHash: hashedPin // Guardamos el HASH, no el PIN
            };
            localStorage.setItem('r3_fast_auth', JSON.stringify(localAuthData));

            setStep('success');
            
            // Redirigir después de una breve animación
            setTimeout(() => {
                onComplete();
            }, 1500);

        } catch (err: any) {
            setError(err.message);
            // Si hay error de coincidencia, limpiar confirmación para reintentar
            if (err.message.includes('coinciden')) {
                setConfirmPin(['', '', '', '']);
                confirmRefs.current[0]?.focus();
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#000040] animate-enter">
                <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡PIN Configurado!</h2>
                    <p className="text-gray-500">Ahora puedes acceder más rápido a tu cuenta.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans py-10 px-4 animate-enter">
            {/* Header Branding */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-[#000040] rounded-xl shadow-lg mb-4">
                    <BoltIcon className="w-8 h-8 text-[#f6b034]" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#000040] mb-2 tracking-tight">Crea tu PIN de Acceso</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    Configura un código de 4 dígitos para ingresar de forma segura y veloz en este dispositivo.
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
                
                {/* 1. Ingresar PIN */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-wider">Ingresa tu PIN</label>
                    <div className="flex justify-center gap-3 md:gap-4">
                        {pin.map((digit, i) => (
                            <input
                                key={`pin-${i}`}
                                ref={el => { pinRefs.current[i] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(e.target.value, i, 'pin', setPin, pinRefs)}
                                onKeyDown={(e) => handleKeyDown(e, i, digit, pinRefs)}
                                className="w-14 h-14 md:w-16 md:h-16 text-center text-3xl font-bold text-[#000040] bg-slate-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#f6b034] focus:ring-4 focus:ring-[#f6b034]/20 transition-all placeholder-gray-300"
                                placeholder="•"
                            />
                        ))}
                    </div>
                </div>

                {/* 2. Confirmar PIN */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-wider">Confirma tu PIN</label>
                    <div className="flex justify-center gap-3 md:gap-4">
                        {confirmPin.map((digit, i) => (
                            <input
                                key={`conf-${i}`}
                                ref={el => { confirmRefs.current[i] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(e.target.value, i, 'confirm', setConfirmPin, confirmRefs)}
                                onKeyDown={(e) => handleKeyDown(e, i, digit, confirmRefs)}
                                className={`w-14 h-14 md:w-16 md:h-16 text-center text-3xl font-bold text-[#000040] bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all placeholder-gray-300 
                                    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#f6b034] focus:ring-[#f6b034]/20'}
                                `}
                                placeholder="•"
                            />
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">{error}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleSavePin}
                        disabled={isLoading || pin.some(d => !d) || confirmPin.some(d => !d)}
                        className="w-full py-4 bg-[#f6b034] text-white font-bold text-lg rounded-xl shadow-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                Guardar PIN Seguro
                                <ArrowRightIcon className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    
                    {onCancel && (
                        <button 
                            onClick={onCancel}
                            className="w-full py-3 text-slate-500 font-medium hover:text-[#000040] transition-colors"
                        >
                            Cancelar y volver
                        </button>
                    )}
                </div>
            </div>
            
            <p className="mt-8 text-xs text-gray-400">
                <span className="font-semibold text-gray-500">Nota de Seguridad:</span> Tu PIN se cifra antes de enviarse y nunca se almacena visiblemente.
            </p>
        </div>
    );
};

export default SetupPin;
