import React from 'react';

interface LoadingModalProps {
    message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center z-50">
            <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex items-center space-x-4 max-w-sm text-center">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#f6b034]/30 border-t-[#f6b034]"></div>
                <span className="text-lg font-medium text-white">{message}</span>
            </div>
        </div>
    );
};

export default LoadingModal;