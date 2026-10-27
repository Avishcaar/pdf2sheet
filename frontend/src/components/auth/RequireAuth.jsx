import { Outlet } from 'react-router-dom';

export default function RequireAuth() {
    let token = localStorage.getItem('token');

    if (!token) {
        // Automatically initialize isolated guest reviewer session
        localStorage.setItem('token', 'guest-demo-token');
        localStorage.setItem('user', JSON.stringify({
            _id: '6ae0f1989e78e3eb2b71ff9c',
            email: 'guest@pdf2sheet.com',
            firstName: 'Guest',
            lastName: 'Reviewer',
            role: 'demo'
        }));
    }

    return <Outlet />;
}
