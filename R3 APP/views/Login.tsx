
import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, UserGroupIcon } from '../components/Icons';
import { verifyPin } from '../utils/security';

import { supabase } from '../../src/lib/supabase';

interface LoginProps {
    onLoginSuccess?: () => void;
}

interface LocalAuthData {
    email: string;
    displayName: string;
    pinHash: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    // Estado inicial de loginMode se determinará en useEffect
    const [loginMode, setLoginMode] = useState<'pin' | 'password' | 'register'>('password');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedUser, setSavedUser] = useState<LocalAuthData | null>(null);
    
    // PIN Logic
    const [pin, setPin] = useState(['', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    // 1. Efecto de carga inicial: Verificar si hay usuario recordado
    useEffect(() => {
        const storedAuth = localStorage.getItem('r3_fast_auth');
        if (storedAuth) {
            try {
                const parsedAuth: LocalAuthData = JSON.parse(storedAuth);
                if (parsedAuth.email && parsedAuth.pinHash) {
                    setSavedUser(parsedAuth);
                    setLoginMode('pin'); // Default a PIN si existe
                    setIdentifier(parsedAuth.email); // Pre-llenar email por si cambian a password
                }
            } catch (e) {
                console.error("Error parsing local auth data", e);
                localStorage.removeItem('r3_fast_auth');
            }
        }
    }, []);

    const handlePinChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only 1 char per input
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto-focus next input
        if (value && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    // Helper to convert simple username to valid email format
    const formatIdentifier = (input: string) => {
        const trimmed = input.trim();
        if (trimmed.includes('@')) return trimmed;
        return `${trimmed}@sistema.local`;
    };

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (loginMode === 'pin') {
                const pinCode = pin.join('');
                if (pinCode.length !== 4) throw new Error("El PIN debe tener 4 dígitos.");
                
                if (!savedUser || !savedUser.pinHash) {
                    throw new Error("No hay configuración de seguridad guardada en este dispositivo.");
                }

                // --- VALIDACIÓN DE HASH SEGURO ---
                const isValid = await verifyPin(pinCode, savedUser.pinHash);

                if (isValid) {
                    await new Promise(resolve => setTimeout(resolve, 600)); // Delay estético
                    if (onLoginSuccess) onLoginSuccess();
                } else {
                    setPin(['', '', '', '']);
                    pinRefs.current[0]?.focus();
                    throw new Error("PIN incorrecto. Intente de nuevo.");
                }

            } else {
                // Flujo estándar de Supabase
                const emailToUse = formatIdentifier(identifier);
                
                if (loginMode === 'register') {
                    const { error } = await supabase.auth.signUp({
                        email: emailToUse,
                        password: password
                    });
                    if (error) throw error;
                } else {
                    const { error } = await supabase.auth.signInWithPassword({
                        email: emailToUse,
                        password: password
                    });
                    if (error) throw error;
                }
                
                if (onLoginSuccess) onLoginSuccess();
            }

        } catch (err: any) {
            let msg = err.message;
            if (msg.includes("Invalid login credentials") || err.message === 'Invalid login credentials') msg = "Credenciales incorrectas.";
            else if (err.message === 'User not found') msg = "Usuario no encontrado.";
            else if (err.message === 'User already registered') msg = "Este usuario ya existe.";
            else if (msg.includes("weak_password") || msg.includes("weak")) msg = "La contraseña es muy débil.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchAccount = () => {
        localStorage.removeItem('r3_fast_auth');
        setSavedUser(null);
        setLoginMode('password');
        setIdentifier('');
        setPin(['', '', '', '']);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-enter">
                {/* Decoración superior */}
                <div className="h-2 bg-[#000040] w-full"></div>

                <div className="p-8 md:p-10">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <div className="bg-[#000040] p-4 rounded-2xl shadow-lg inline-block">
                                <img
                                    src="https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/logo%20sin%20fondo%20a%20color%20amarillo.png?alt=media&token=1b6f8d8d-4a2a-4f0a-9bff-882866521db8"
                                    alt="R3 Consultores"
                                    className="h-12 w-auto object-contain"
                                />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {loginMode === 'register' ? 'Crear Nueva Cuenta' : (savedUser && loginMode === 'pin' ? `Hola, ${savedUser.displayName}` : 'Bienvenido')}
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {loginMode === 'pin' ? 'Ingresa tu PIN de acceso rápido' : (loginMode === 'register' ? 'Registra tu usuario para comenzar' : 'Ingresa tus credenciales para acceder')}
                        </p>
                    </div>

                    {/* Mode Switching Tabs */}
                    {loginMode !== 'register' && savedUser && (
                        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                            <button
                                onClick={() => { setLoginMode('pin'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'pin' ? 'bg-white text-[#000040] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                PIN
                            </button>
                            <button
                                onClick={() => { setLoginMode('password'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'password' ? 'bg-white text-[#000040] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Contraseña
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleAuthAction} className="space-y-6">
                        
                        {/* PIN INPUT MODE */}
                        {loginMode === 'pin' && (
                            <div className="space-y-6">
                                <div className="flex justify-center gap-3">
                                    {pin.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { pinRefs.current[i] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePinChange(i, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(i, e)}
                                            className="w-14 h-14 text-center text-3xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl focus:border-[#000040] focus:ring-4 focus:ring-[#000040]/10 outline-none transition-all"
                                        />
                                    ))}
                                </div>
                                <div className="text-center">
                                    <button 
                                        type="button"
                                        onClick={handleSwitchAccount}
                                        className="text-sm text-slate-500 hover:text-[#000040] font-medium transition-colors"
                                    >
                                        ¿No eres {savedUser?.displayName}? Cambiar cuenta
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PASSWORD / REGISTER MODE */}
                        {(loginMode === 'password' || loginMode === 'register') && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Usuario o Correo</label>
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#000040] focus:ring-2 focus:ring-[#000040]/20 outline-none transition-all text-slate-800 placeholder-slate-400"
                                        placeholder="Ej: juan.perez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#000040] focus:ring-2 focus:ring-[#000040]/20 outline-none transition-all text-slate-800 placeholder-slate-400 pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-red-600 font-medium">{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#000040] hover:bg-[#000040]/90 text-white font-bold py-3.5 rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <span>{loginMode === 'register' ? 'Crear Cuenta' : 'Ingresar al Sistema'}</span>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    {(loginMode === 'password' || loginMode === 'register') && (
                        <div className="mt-8 text-center text-sm text-slate-500 pt-6 border-t border-slate-100">
                            {loginMode === 'register' ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMode(loginMode === 'register' ? 'password' : 'register');
                                    setError(null);
                                }}
                                className="text-[#000040] font-bold hover:underline"
                            >
                                {loginMode === 'register' ? 'Inicia Sesión' : 'Regístrate aquí'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
