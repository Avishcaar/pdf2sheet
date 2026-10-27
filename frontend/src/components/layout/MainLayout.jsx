import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
    const { darkMode } = useTheme();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0B0F19] transition-colors duration-200 relative overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden pl-16 sm:pl-20 md:pl-24">
                <Header />
                <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
