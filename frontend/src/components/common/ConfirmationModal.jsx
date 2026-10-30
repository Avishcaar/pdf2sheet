import React from 'react';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm studio-modal-backdrop">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all border border-gray-200 dark:border-white/[0.08] studio-modal-card">
                <h3 className={`text-lg font-semibold mb-2 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-end gap-2.5">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/[0.1] font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm text-white font-medium shadow-sm transition-all transform active:scale-95 ${
                            isDanger
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
