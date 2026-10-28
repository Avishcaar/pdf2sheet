import { useState, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUser';
import ProfileSection from '../../components/settings/ProfileSection';
import GoogleSheetsSection from '../../components/settings/GoogleSheetsSection';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import Loader from '../../components/common/Loader';

export default function Settings() {
    const { data: user, isLoading, error, refetch } = useUserProfile();
    const { darkMode } = useTheme();

    useEffect(() => {
        if (error) {
            toast.error('Failed to load user profile');
        }
    }, [error]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const err = params.get('error');
        if (params.get('connected') === 'true') {
            toast.success('Successfully connected to Google Sheets! Auto-sync is active.', { duration: 6000 });
            refetch();
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (err === 'missing_sheets_scope') {
            toast.error('Permission not granted! Please click Connect again and check the box for "See, edit, create, and delete all your Google Sheets spreadsheets".', { duration: 10000 });
            refetch();
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (err) {
            toast.error('Google Sheets connection failed: ' + err, { duration: 6000 });
            refetch();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [refetch]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-24 flex items-center justify-center">
                <Loader size="32px" subtitle="Loading settings..." />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            <Toaster position="top-center" />

            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Settings
                </h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Manage your account and integration settings
                </p>
            </div>

            <div className="space-y-6">
                {user && (
                    <>
                        <ProfileSection user={user} />
                        <GoogleSheetsSection user={user} />
                    </>
                )}
            </div>
        </div>
    );
}
