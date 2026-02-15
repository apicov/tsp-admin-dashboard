import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from './pages/LoginPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import Layout from './components/Layout';
import { useState, useEffect } from 'react';

const theme = createTheme({
    palette: {
        primary: {
            main: '#632d4d',
        },
    },
});

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_access_token');
        setIsAuthenticated(!!token);
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/login"
                        element={<LoginPage onLogin={() => setIsAuthenticated(true)} />}
                    />

                    {/* Protected layout — all dashboard pages live inside here */}
                    <Route
                        element={
                            isAuthenticated ? (
                                <Layout onLogout={() => setIsAuthenticated(false)} />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    >
                        <Route path="/announcements" element={<AnnouncementsPage />} />
                        {/* Future routes go here, e.g.: */}
                        {/* <Route path="/users" element={<UsersPage />} /> */}
                    </Route>

                    <Route path="/" element={<Navigate to="/announcements" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
