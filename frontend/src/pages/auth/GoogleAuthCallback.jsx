import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Loader from '../../components/common/Loader';

export default function GoogleAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            localStorage.setItem('token', token);
            toast.success('Successfully signed in with Google!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } else if (error) {
            toast.error('Google authentication failed');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 flex items-center justify-center">
            <Toaster position="top-center" />
            <div className="text-center">
                <Loader size="32px" subtitle="Completing secure sign in..." />
            </div>
        </div>
    );
}
