import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Tooltip,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Campaign as AnnouncementsIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { config } from '../config';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 64;

interface LayoutProps {
    onLogout: () => void;
}

const NAV_ITEMS = [
    {
        label: 'Announcements',
        path: '/announcements',
        icon: <AnnouncementsIcon />,
    },
    // Future sections can be added here, e.g.:
    // { label: 'Users', path: '/users', icon: <PeopleIcon /> },
    // { label: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
];

export default function Layout({ onLogout }: LayoutProps) {
    const [open, setOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem(config.storage.authTokenKey);
        onLogout();
        navigate('/login');
    };

    const drawerWidth = open ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />

            {/* Top AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    transition: 'width 0.2s, margin-left 0.2s',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        The Stitch Tracker — Admin
                    </Typography>
                    <Tooltip title="Logout">
                        <IconButton color="inherit" onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    transition: 'width 0.2s',
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        overflowX: 'hidden',
                        transition: 'width 0.2s',
                        boxSizing: 'border-box',
                        backgroundColor: '#632d4d',
                        color: '#fff',
                    },
                }}
            >
                {/* Drawer header with collapse toggle */}
                <Toolbar
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: open ? 'flex-end' : 'center',
                        px: 1,
                    }}
                >
                    {open && (
                        <Typography
                            variant="subtitle2"
                            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1, opacity: 0.8, pl: 1 }}
                        >
                            TSP Admin
                        </Typography>
                    )}
                    <IconButton onClick={() => setOpen(!open)} sx={{ color: '#fff' }}>
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                </Toolbar>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

                {/* Nav items */}
                <List sx={{ pt: 1 }}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                                <Tooltip title={open ? '' : item.label} placement="right">
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            minHeight: 48,
                                            px: 2.5,
                                            justifyContent: open ? 'initial' : 'center',
                                            backgroundColor: isActive
                                                ? 'rgba(255,255,255,0.15)'
                                                : 'transparent',
                                            borderLeft: isActive
                                                ? '3px solid #fff'
                                                : '3px solid transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: open ? 2 : 'auto',
                                                justifyContent: 'center',
                                                color: '#fff',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            sx={{
                                                opacity: open ? 1 : 0,
                                                transition: 'opacity 0.2s',
                                                '& .MuiListItemText-primary': { color: '#fff', fontWeight: isActive ? 700 : 400 },
                                            }}
                                        />
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>

            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    transition: 'margin-left 0.2s',
                }}
            >
                {/* Spacer for AppBar */}
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
