import React from 'react';

interface LoadingModalProps {
    message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-4 max-w-sm text-center">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-200 border-t-slate-900"></div>
                <span className="text-lg font-medium text-slate-800">{message}</span>
            </div>
        </div>
    );
};

export default LoadingModal;