import { useTheme } from '../../contexts/ThemeContext';

export default function FieldMappingRow({ field, onUpdate, onRemove }) {
    const { darkMode } = useTheme();

    const fieldOptions = [
        { value: 'invoiceNumber', label: 'Invoice Number' },
        { value: 'invoiceDate', label: 'Invoice Date' },
        { value: 'totalAmount', label: 'Total Amount' },
        { value: 'vendorName', label: 'Vendor Name' }
    ];

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-xl space-y-3 transition-colors duration-300`}>
            <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Field Name
                </label>
                <button
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-600 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <select
                value={field.name || ''}
                onChange={(e) => onUpdate({ ...field, name: e.target.value })}
                className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition`}
            >
                <option value="">Select field...</option>
                {fieldOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-2`}>
                    Extraction Rule (Regex) - Optional
                </label>
                <input
                    type="text"
                    value={field.extractionRule || ''}
                    onChange={(e) => onUpdate({ ...field, extractionRule: e.target.value })}
                    placeholder="e.g., Invoice\s*#?\s*([A-Z0-9-]+)"
                    className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition font-mono text-sm`}
                />
            </div>

            <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-2`}>
                    Keywords (comma-separated) - Optional
                </label>
                <input
                    type="text"
                    value={field.keywords || ''}
                    onChange={(e) => onUpdate({ ...field, keywords: e.target.value })}
                    placeholder="e.g., invoice, inv#, invoice no"
                    className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition`}
                />
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    Keywords are used as fallback if regex fails
                </p>
            </div>
        </div>
    );
}
