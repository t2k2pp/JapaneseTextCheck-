import React from 'react';
import { AlertTriangleIcon } from './icons';

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
    isDestructive = false
}: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    isDestructive?: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isDestructive ? 'text-red-600' : 'text-slate-800'}`}>
                        {isDestructive && <AlertTriangleIcon className="w-5 h-5" />}
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                            isDestructive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        実行する
                    </button>
                </div>
            </div>
        </div>
    );
};
