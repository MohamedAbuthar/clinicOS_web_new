import React from 'react';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteOverrideDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    loading: boolean;
}

export default function DeleteOverrideDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    loading
}: DeleteOverrideDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col transform transition-all scale-100">
                {/* Dialog Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} className="text-gray-500 hover:text-red-600" />
                    </button>
                </div>

                {/* Dialog Body */}
                <div className="p-6">
                    <p className="text-gray-600 mb-2">{message}</p>
                    {itemName && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                            <span className="font-medium text-gray-900 block text-center">{itemName}</span>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-4">
                        This action cannot be undone. This schedule override will be permanently removed.
                    </p>
                </div>

                {/* Dialog Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete Override
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
