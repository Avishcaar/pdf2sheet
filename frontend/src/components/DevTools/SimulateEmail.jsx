import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const SimulateEmail = ({ onUploadSuccess }) => {
    const { darkMode } = useTheme();
    const [file, setFile] = useState(null);
    const [senderEmail, setSenderEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !senderEmail) return;

        setStatus('uploading');
        setMessage('');

        const formData = new FormData();
        formData.append('invoice', file);
        formData.append('vendorEmail', senderEmail);

        try {
            const res = await api.post('/email/test-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStatus('success');
            setMessage(res.data.message || 'Invoice processed!');

            queryClient.invalidateQueries(['invoices']);

            if (onUploadSuccess) onUploadSuccess();

            setTimeout(() => {
                setStatus('idle');
                setMessage('');
                setFile(null);
                setSenderEmail('');
            }, 3000);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage(err.response?.data?.error || 'Upload failed');
        }
    };

    return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-indigo-100'} p-4 rounded-lg shadow-sm mb-6 border transition-colors duration-300 max-w-3xl`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} flex items-center`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Simulate Incoming Email
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sender Email</label>
                    <input
                        type="email"
                        required
                        className={`block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50'}`}
                        placeholder="vendor@example.com"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                    />
                </div>

                <div className="flex-1">
                    <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload PDF</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        required
                        className={`block w-full text-xs 
                                  file:mr-2 file:py-1 file:px-3
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-semibold
                                  file:cursor-pointer
                                  ${darkMode
                                ? 'text-gray-400 file:bg-gray-700 file:text-indigo-400 hover:file:bg-gray-600'
                                : 'text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                            }`}
                        onChange={handleFileChange}
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={status === 'uploading'}
                        className={`flex justify-center items-center py-2 px-4 border border-transparent rounded shadow-sm text-xs font-bold text-white transition-all whitespace-nowrap
                            ${status === 'uploading'
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow transform hover:scale-[1.02]'}`}
                    >
                        {status === 'uploading' ? 'Processing...' : 'Simulate'}
                    </button>
                </div>
            </form>
            {message && (
                <div className={`mt-2 p-1 px-2 text-xs rounded inline-block ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default SimulateEmail;
