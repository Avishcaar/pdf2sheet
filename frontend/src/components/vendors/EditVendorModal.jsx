
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUpdateVendor, useDeleteVendor } from '../../hooks/useVendors';
import toast from 'react-hot-toast';

export default function EditVendorModal({ isOpen, onClose, vendor }) {
    const { darkMode } = useTheme();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const updateVendor = useUpdateVendor();
    const deleteVendor = useDeleteVendor();

    if (!isOpen || !vendor) return null;

    const handleDelete = async () => {
        try {
            await deleteVendor.mutateAsync(vendor._id);
            toast.success('Vendor deleted successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to delete vendor');
        }
    };

    const handleResetRules = async () => {
        try {
            await updateVendor.mutateAsync({
                id: vendor._id,
                data: { extractionRules: [] }
            });
            toast.success('Rules reset. System will re-learn on next invoice.');
            setShowResetConfirm(false);
            onClose();
        } catch (error) {
            toast.error('Failed to reset rules');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm studio-modal-backdrop">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden transition-colors duration-300 max-h-[90vh] studio-modal-card`}>

                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                    <div>
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {vendor.vendorName}
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {vendor.senderEmail || 'No email associated'}
                        </p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                Extraction Confidence
                            </div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                {vendor.confidenceThreshold || 95}%
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                Mapped Fields
                            </div>
                            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {vendor.extractionRules ? vendor.extractionRules.length : 0}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                            Fields Mapped
                        </h3>

                        {!vendor.extractionRules || vendor.extractionRules.length === 0 ? (
                            <div className={`text-center py-8 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                                    No rules learned yet. <br />
                                    Process an invoice and click "Save" to learn.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vendor.extractionRules.map((rule, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${rule.method === 'coordinate' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></span>
                                            <div>
                                                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {rule.targetField}
                                                </div>
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Strategy: {rule.method === 'coordinate' ? 'Learned Location' : 'Keyword Search'}
                                                </div>
                                            </div>
                                        </div>
                                        {rule.method === 'coordinate' && (
                                            <div className={`text-xs font-mono px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                Page {rule.coordinates.pageIndex + 1}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-500'} mb-4 uppercase tracking-wider`}>
                            Troubleshooting
                        </h3>

                        <div className="flex gap-4">
                            {!showResetConfirm ? (
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    className={`flex-1 py-2 px-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-700'} font-medium rounded-xl transition text-sm`}
                                >
                                    Reset extraction rules
                                </button>
                            ) : (
                                <div className="flex-1 flex gap-2">
                                    <button
                                        onClick={handleResetRules}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition"
                                    >
                                        Confirm Reset
                                    </button>
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className={`px-4 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} rounded-xl text-sm`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex-1 py-2 px-4 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium rounded-xl transition text-sm"
                                >
                                    Delete Vendor
                                </button>
                            ) : (
                                <div className="flex-1 flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition"
                                    >
                                        Confirm Delete
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className={`px-4 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} rounded-xl text-sm`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            *Resetting rules forces the system to re-learn the layout from the next invoice.
                        </p>
                    </div>

                </div>

                <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-inherit`}>
                    <button
                        onClick={onClose}
                        className={`w-full py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-semibold rounded-xl transition`}
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}
