import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ReviewInvoiceModal({ invoice, isOpen, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        date: '',
        total: '',
        vendorName: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (invoice) {
            setFormData({
                invoiceNumber: invoice.extractedData?.invoiceNumber || '',
                date: invoice.extractedData?.invoiceDate || '',
                total: invoice.extractedData?.totalAmount || '',
                vendorName: invoice.vendorName || ''
            });
        }
    }, [invoice]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post(`/invoices/${invoice._id}/process`, {
                extractedData: {
                    invoiceNumber: formData.invoiceNumber,
                    invoiceDate: formData.date,
                    totalAmount: formData.total
                },
                vendorName: formData.vendorName
            });

            toast.success('Invoice approved and syncing to Sheets!');

            if (onUpdate) onUpdate(invoice._id, { status: 'processed' });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update invoice');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Invoice</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/50 mb-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Why review?</strong> {invoice.status === 'review_needed' && invoice.confidenceScore === 0 ? 'Unknown Vendor' : 'Low Confidence Score'}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Original File: {invoice.originalFileName}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Vendor Name
                        </label>
                        <input
                            type="text"
                            value={formData.vendorName}
                            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-gray-900 dark:text-white"
                            placeholder="Enter proper vendor name"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Invoice #
                            </label>
                            <input
                                type="text"
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date
                            </label>
                            <input
                                type="text"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-gray-900 dark:text-white"
                                placeholder="MM/DD/YYYY"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total Amount ($)
                        </label>
                        <input
                            type="text"
                            value={formData.total}
                            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition text-gray-900 dark:text-white font-mono"
                        />
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processing...' : 'Approve & Sync'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
