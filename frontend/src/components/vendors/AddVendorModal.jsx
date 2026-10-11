import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAddVendor } from '../../hooks/useVendors';
import FieldMappingRow from './FieldMappingRow';
import toast from 'react-hot-toast';

export default function AddVendorModal({ isOpen, onClose }) {
    const { darkMode } = useTheme();
    const [vendorName, setVendorName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [fieldMappings, setFieldMappings] = useState([]);
    const addVendor = useAddVendor();

    const addField = () => {
        setFieldMappings([...fieldMappings, { name: '', extractionRule: '', keywords: '' }]);
    };

    const updateField = (index, updatedField) => {
        const newMappings = [...fieldMappings];
        newMappings[index] = updatedField;
        setFieldMappings(newMappings);
    };

    const removeField = (index) => {
        setFieldMappings(fieldMappings.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!vendorName.trim()) {
            toast.error('Please enter a vendor name');
            return;
        }

        const mappings = {};
        fieldMappings.forEach(field => {
            if (field.name) {
                const mapping = {};
                if (field.extractionRule) mapping.extractionRule = field.extractionRule;
                if (field.keywords) mapping.keywords = field.keywords.split(',').map(k => k.trim());

                if (Object.keys(mapping).length > 0) {
                    mappings[field.name] = mapping;
                }
            }
        });

        try {
            await addVendor.mutateAsync({
                vendorName,
                senderEmail: senderEmail.trim() || undefined,
                fieldMappings: mappings
            });
            toast.success('Vendor added successfully');
            setVendorName('');
            setSenderEmail('');
            setFieldMappings([]);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add vendor');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300`}>
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} z-10`}>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Add New Vendor
                    </h2>
                    <button
                        onClick={onClose}
                        className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Vendor Name
                        </label>
                        <input
                            type="text"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            placeholder="e.g., ACME Corporation"
                            className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Sender Email (Optional)
                        </label>
                        <input
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder="e.g., billing@acmecorp.com"
                            className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition`}
                        />
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                            Email address from which this vendor sends invoices
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Field Mappings
                            </label>
                            <button
                                type="button"
                                onClick={addField}
                                className={`text-sm ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-violet-500 hover:text-violet-600'} font-medium transition flex items-center gap-1`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Field
                            </button>
                        </div>

                        {fieldMappings.length === 0 ? (
                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl text-center transition-colors duration-300`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    No fields added yet. Click "Add Field" to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fieldMappings.map((field, index) => (
                                    <FieldMappingRow
                                        key={index}
                                        field={field}
                                        onUpdate={(updated) => updateField(index, updated)}
                                        onRemove={() => removeField(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={addVendor.isPending}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {addVendor.isPending ? 'Adding...' : 'Add Vendor'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-3 px-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} font-semibold rounded-xl transition`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
