import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
    FlaskConical, 
    UploadCloud, 
    Sparkles, 
    ArrowRight, 
    CheckCircle, 
    Clock, 
    FileText, 
    Mail, 
    Play, 
    ShieldCheck, 
    Zap, 
    Layers, 
    ExternalLink,
    AlertCircle,
    Copy,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_SCENARIOS = [
    {
        id: 'apollo',
        vendorName: 'Apollo Hospitals Enterprises Ltd',
        senderEmail: 'billing@apollohospitals.com',
        pdfUrl: '/samples/apollo-inr-invoice.pdf',
        filename: 'apollo-inr-invoice.pdf',
        tag: 'Multi-Currency (INR ₹)',
        tagColor: 'amber',
        description: 'Indian Rupee hospital bill with GSTIN, CGST/SGST 9%, and UPI markers.',
        expectedAmount: '₹12,450.00',
        badge: 'Rupee Auto-Detect (₹)'
    },
    {
        id: 'sap',
        vendorName: 'SAP Deutschland SE & Co. KG',
        senderEmail: 'invoicing@sap.de',
        pdfUrl: '/samples/sap-eur-invoice.pdf',
        filename: 'sap-eur-invoice.pdf',
        tag: 'European Union (EUR €)',
        tagColor: 'blue',
        description: 'Eurozone enterprise cloud invoice with 19% MwSt and SEPA IBAN details.',
        expectedAmount: '€3,400.00',
        badge: 'Euro & MwSt (€)'
    },
    {
        id: 'stripe',
        vendorName: 'Stripe Payments',
        senderEmail: 'billing@stripe.com',
        pdfUrl: '/samples/stripe-invoice.pdf',
        filename: 'stripe-invoice.pdf',
        tag: 'Auto-Pilot Showcase',
        tagColor: 'emerald',
        description: 'SaaS merchant processing fees with predictable coordinate layout.',
        expectedAmount: '$1,420.00',
        badge: 'High Confidence (95%)'
    },
    {
        id: 'aws',
        vendorName: 'AWS Cloud Services',
        senderEmail: 'no-reply-aws@amazon.com',
        pdfUrl: '/samples/aws-invoice.pdf',
        filename: 'aws-invoice.pdf',
        tag: 'Cloud Infrastructure',
        tagColor: 'cyan',
        description: 'Multi-service monthly computing and storage invoice breakdown.',
        expectedAmount: '$2,845.50',
        badge: 'Heuristic Match'
    },
    {
        id: 'github',
        vendorName: 'GitHub Enterprise',
        senderEmail: 'billing@github.com',
        pdfUrl: '/samples/github-invoice.pdf',
        filename: 'github-invoice.pdf',
        tag: 'Developer Tooling',
        tagColor: 'violet',
        description: 'Team seats and Copilot license with clean tabular layout.',
        expectedAmount: '$420.00',
        badge: 'Instant Ingest'
    }
];

export default function SimulatePage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Form state
    const [file, setFile] = useState(null);
    const [senderEmail, setSenderEmail] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Execution & Stepper State
    const [isSimulating, setIsSimulating] = useState(false);
    const [activePreset, setActivePreset] = useState(null);
    const [pipelineStage, setPipelineStage] = useState(0); // 0: Idle, 1: Ingesting, 2: Identity, 3: OCR, 4: Done
    const [executionResult, setExecutionResult] = useState(null);

    // Handle File Drop
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            } else {
                toast.error('Please upload a PDF file');
            }
        }
    };

    // Run Simulation with File and Email
    const executeSimulation = async (pdfBlob, email, vendorName = '') => {
        setIsSimulating(true);
        setExecutionResult(null);
        setPipelineStage(1); // Stage 1: Ingesting

        const formData = new FormData();
        formData.append('invoice', pdfBlob, 'simulated-invoice.pdf');
        formData.append('vendorEmail', email);
        if (vendorName) formData.append('vendorName', vendorName);

        try {
            await new Promise(r => setTimeout(r, 600));
            setPipelineStage(2); // Stage 2: Identity Match

            await new Promise(r => setTimeout(r, 500));
            setPipelineStage(3); // Stage 3: Dual-Core OCR

            const res = await api.post('/email/test-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await new Promise(r => setTimeout(r, 500));
            setPipelineStage(4); // Stage 4: Sheets Sync / Done

            setExecutionResult(res.data);
            queryClient.invalidateQueries(['invoices']);
            toast.success(res.data.message || 'Invoice processed successfully!', { icon: '🚀' });
        } catch (err) {
            console.error('Simulation error:', err);
            setPipelineStage(0);
            toast.error(err.response?.data?.error || 'Simulation failed');
        } finally {
            setIsSimulating(false);
        }
    };

    // 1-Click Preset Runner
    const handleRunPreset = async (preset) => {
        setActivePreset(preset.id);
        try {
            // Fetch preset PDF from public samples
            const res = await fetch(preset.pdfUrl);
            const blob = await res.blob();
            await executeSimulation(blob, preset.senderEmail, preset.vendorName);
        } catch (err) {
            console.error(err);
            toast.error('Could not load preset PDF');
            setIsSimulating(false);
        }
    };

    // Custom Form Submit
    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please provide an invoice PDF file to upload');
            return;
        }
        setActivePreset('custom');
        await executeSimulation(file, senderEmail || '');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            <Toaster position="top-center" />

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                    Inbox & Ingestion Simulator
                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        DevTools Sandbox
                    </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Simulate real-time vendor email arrivals and test the end-to-end OCR extraction and Google Sheet sync pipeline.
                </p>
            </div>

            {/* Section 1: 1-Click Preset Showcases */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            1-Click Preset Invoice Scenarios
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Zero-setup testing: click any preset to simulate an incoming bill immediately.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESET_SCENARIOS.map(preset => {
                        const isThisPresetRunning = isSimulating && activePreset === preset.id;

                        return (
                            <div
                                key={preset.id}
                                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                            preset.tagColor === 'emerald'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : preset.tagColor === 'cyan'
                                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                                : preset.tagColor === 'amber'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                : preset.tagColor === 'blue'
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                                        }`}>
                                            {preset.tag}
                                        </span>
                                        <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
                                            {preset.expectedAmount}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                        {preset.vendorName}
                                    </h3>
                                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {preset.senderEmail}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        {preset.description}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleRunPreset(preset)}
                                    disabled={isSimulating}
                                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-violet-600 dark:bg-white/[0.04] dark:hover:bg-violet-600 text-gray-800 hover:text-white dark:text-gray-200 dark:hover:text-white border border-gray-200 dark:border-white/[0.08] hover:border-transparent font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                                >
                                    {isThisPresetRunning ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Simulating Delivery...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 text-violet-500 group-hover:text-white transition" />
                                            <span>Simulate {preset.vendorName.split(' ')[0]} Bill</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section 2: Real-Time Pipeline Visualizer & Stepper */}
            {(isSimulating || executionResult) && (
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-violet-500/30 dark:border-violet-500/20 shadow-lg shadow-violet-500/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Zap className="w-5 h-5 text-violet-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                Real-Time Pipeline Execution Stepper
                            </h2>
                        </div>
                        {isSimulating && (
                            <span className="text-xs font-mono text-violet-600 dark:text-violet-400 animate-pulse flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                                Processing Payload...
                            </span>
                        )}
                    </div>

                    {/* Stage Timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {[
                            { step: 1, title: 'IMAP Webhook Ingestion', desc: 'Received multipart PDF buffer' },
                            { step: 2, title: 'Email-First Identity', desc: 'Resolved sender identity in DB' },
                            { step: 3, title: 'Dual-Core Extraction', desc: 'Coordinate crop & heuristic OCR' },
                            { step: 4, title: 'Confidence & Sync', desc: 'Auto-pilot Google Sheet commit' }
                        ].map(stage => {
                            const isDone = pipelineStage > stage.step || (pipelineStage === 4 && stage.step === 4);
                            const isCurrent = pipelineStage === stage.step && isSimulating;

                            return (
                                <div
                                    key={stage.step}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                        isDone
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                            : isCurrent
                                            ? 'bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400 ring-2 ring-violet-500/20'
                                            : 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/[0.06] text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {isDone ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        ) : isCurrent ? (
                                            <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                        ) : (
                                            <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px]">
                                                {stage.step}
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold">{stage.title}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-6">
                                        {stage.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Execution Result Banner */}
                    {executionResult && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                        Result: {executionResult.message || 'Invoice ingested!'}
                                    </span>
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                        executionResult.data?.status === 'processed'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        Status: {executionResult.data?.status || 'review_needed'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Confidence Score: <strong className="text-gray-700 dark:text-gray-300">{executionResult.data?.confidence || 0}%</strong>
                                    {' · '}Invoice ID: <code className="font-mono text-[11px]">{executionResult.data?.invoiceId}</code>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {executionResult.data?.invoiceId && (
                                    <button
                                        onClick={() => navigate(`/review/${executionResult.data.invoiceId}`)}
                                        className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition flex items-center gap-1.5"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Inspect in Visual Mapper
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-medium text-gray-700 dark:text-gray-300 transition"
                                >
                                    View on Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Custom PDF Upload Form & Drag-and-Drop Dropzone */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-cyan-500" />
                        Custom Invoice Upload (Manual Simulator)
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload any real invoice PDF from your computer and assign a vendor email address.
                    </p>
                </div>

                <form onSubmit={handleCustomSubmit} className="space-y-5">
                    {/* Drag-and-Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                            isDragging
                                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                                : file
                                ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                                : 'border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.2] bg-gray-50/50 dark:bg-white/[0.01]'
                        }`}
                    >
                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {(file.size / 1024).toFixed(1)} KB · Ready to simulate
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="mt-3 text-xs text-red-500 hover:text-red-600 underline font-medium"
                                >
                                    Choose different file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.04] text-gray-400 flex items-center justify-center mb-3">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Drag and drop your invoice PDF here, or{' '}
                                    <label className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-semibold">
                                        browse files
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Accepts standard PDF documents up to 10MB</p>
                            </div>
                        )}
                    </div>

                    {/* Sender Email Input & Suggestion Chips */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Sender Email Address <span className="text-gray-400 font-normal">(Optional — AI automatically recognizes vendor from invoice)</span>
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                                placeholder="e.g. billing@company.com (optional)"
                                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-violet-500 transition"
                            />
                        </div>

                        {/* Quick Autofill Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] text-gray-400">Autofill:</span>
                            {['billing@stripe.com', 'no-reply-aws@amazon.com', 'billing@github.com', 'invoices@acme.com'].map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setSenderEmail(chip)}
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-gray-600 dark:text-gray-400 transition"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSimulating || !file || !senderEmail}
                        className="py-2.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSimulating ? 'Simulating Pipeline...' : 'Run Simulation'}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
