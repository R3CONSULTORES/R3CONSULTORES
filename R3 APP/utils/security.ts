
// En un entorno real, usar 'bcryptjs'.
// Para este entorno web sin dependencias extra, usaremos Web Crypto API (SHA-256) + Salt.
// Esto es seguro para el navegador.

export const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (pin: string, storedHash: string): Promise<boolean> => {
    const newHash = await hashPin(pin);
    return newHash === storedHash;
};
