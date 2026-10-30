import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileSection({ user }) {
    const { darkMode } = useTheme();

    return (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 transition-colors duration-300 profile-paper-card`}>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                Profile
            </h2>

            <div className="space-y-4">
                <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Name
                    </label>
                    <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.firstName} {user.lastName}
                    </p>
                </div>

                <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Email
                    </label>
                    <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.email}
                    </p>
                </div>
            </div>
        </div>
    );
}
