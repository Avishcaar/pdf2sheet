import { useState, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUser';
import ProfileSection from '../../components/settings/ProfileSection';
import GoogleSheetsSection from '../../components/settings/GoogleSheetsSection';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

export default function Settings() {
    const { data: user, isLoading, error } = useUserProfile();
    const { darkMode } = useTheme();

    useEffect(() => {
        if (error) {
            toast.error('Failed to load user profile');
        }
    }, [error]);

    if (isLoading) {
        return (
            <div className="max-w-4xl">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
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
