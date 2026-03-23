import React, { useEffect } from 'react';

interface ErrorToastProps {
    message: string;
    onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 6000); // Auto-close after 6 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div 
            className="fixed bottom-5 right-5 bg-red-500 text-white px-4 py-3 rounded-lg shadow-2xl max-w-md z-50 transform transition-all duration-300 ease-out flex items-start space-x-4"
            role="alert"
            style={{ animation: 'toast-in 0.5s ease-out forwards' }}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
                <strong className="font-bold">¡Error!</strong>
                <span className="block text-sm">{message}</span>
            </div>
            <button onClick={onClose} className="text-red-100 hover:text-white absolute top-1 right-1 p-1 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ErrorToast;