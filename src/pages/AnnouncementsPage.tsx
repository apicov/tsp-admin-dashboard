import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel,
    IconButton,
    CircularProgress,
    Alert,
    TablePagination,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Announcement, AnnouncementCreate } from '../types/announcements';
import { config, buildApiUrl, getAuthHeaders as getHeaders } from '../config';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
    info: 'info',
    warning: 'warning',
    promotion: 'success',
    critical: 'error',
};

/**
 * Derives a human-readable schedule status for an announcement.
 * - expired   → ends_at is in the past
 * - scheduled → starts_at is in the future
 * - active    → active and within date range (or no dates set)
 * - inactive  → is_active is false
 */
function getScheduleStatus(a: Announcement): 'active' | 'inactive' | 'scheduled' | 'expired' {
    const now = new Date();
    if (a.expires_at && new Date(a.expires_at) < now) return 'expired';
    if (a.starts_at && new Date(a.starts_at) > now) return 'scheduled';
    if (!a.is_active) return 'inactive';
    return 'active';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ─── Default form values ───────────────────────────────────────────────────────

const emptyAnnouncement: AnnouncementCreate = {
    title: '',
    message: '',
    announcement_type: 'banner',
    priority: 'info',
    dismissible: true,
    action_url: '',
    action_label: '',
    target_all_users: true,
    target_tags: '',
    is_active: true,
    starts_at: '',
    expires_at: '',
};

// ─── Preview component ─────────────────────────────────────────────────────────

interface PreviewProps {
    formData: AnnouncementCreate;
}

function AnnouncementPreview({ formData }: PreviewProps) {
    const bgColors: Record<string, string> = {
        info: '#e3f2fd',
        warning: '#fff8e1',
        promotion: '#e8f5e9',
        critical: '#ffebee',
    };
    const borderColors: Record<string, string> = {
        info: '#1976d2',
        warning: '#f57c00',
        promotion: '#388e3c',
        critical: '#d32f2f',
    };

    const priority = formData.priority || 'info';
    const isBanner = formData.announcement_type === 'banner';

    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                PREVIEW — {isBanner ? 'Banner' : 'Modal'}
            </Typography>

            {isBanner ? (
                // Banner preview
                <Box
                    sx={{
                        backgroundColor: bgColors[priority],
                        borderLeft: `4px solid ${borderColors[priority]}`,
                        borderRadius: 1,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: borderColors[priority] }}>
                            {formData.title || 'Announcement title'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333', mt: 0.25 }}>
                            {formData.message || 'Your message will appear here.'}
                        </Typography>
                        {formData.action_label && (
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1, borderColor: borderColors[priority], color: borderColors[priority], fontSize: '0.7rem' }}
                            >
                                {formData.action_label}
                            </Button>
                        )}
                    </Box>
                    {formData.dismissible && (
                        <Typography variant="caption" sx={{ color: '#999', cursor: 'default' }}>✕</Typography>
                    )}
                </Box>
            ) : (
                // Modal preview
                <Box
                    sx={{
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                        maxWidth: 340,
                        mx: 'auto',
                    }}
                >
                    <Box sx={{ backgroundColor: borderColors[priority], p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>
                            {formData.title || 'Announcement title'}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, backgroundColor: '#fff' }}>
                        <Typography variant="body2" sx={{ color: '#333' }}>
                            {formData.message || 'Your message will appear here.'}
                        </Typography>
                        {formData.action_label && (
                            <Button
                                size="small"
                                variant="contained"
                                fullWidth
                                sx={{ mt: 1.5, backgroundColor: borderColors[priority], fontSize: '0.75rem' }}
                            >
                                {formData.action_label}
                            </Button>
                        )}
                        {formData.dismissible && (
                            <Button size="small" fullWidth sx={{ mt: 0.5, color: '#999', fontSize: '0.7rem' }}>
                                Dismiss
                            </Button>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
    // Data state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(config.pagination.defaultPageSize);

    // Form state
    const [formData, setFormData] = useState<AnnouncementCreate>(emptyAnnouncement);

    const navigate = useNavigate();
    const getAuthHeaders = getHeaders;

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(buildApiUrl('/api/announcements/admin/all'), {
                headers: getAuthHeaders(),
            });
            setAnnouncements(response.data);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please log in again.');
                handleSessionExpired();
            } else {
                const message = err.response?.data?.message || 'Failed to load announcements';
                setError(message);
                toast.error(message);
            }
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionExpired = () => {
        localStorage.removeItem(config.storage.authTokenKey);
        navigate('/login');
    };

    const handleOpenDialog = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                ...announcement,
                starts_at: announcement.starts_at?.split('T')[0] || '',
                expires_at: announcement.expires_at?.split('T')[0] || '',
                action_url: announcement.action_url || '',
                action_label: announcement.action_label || '',
                target_tags: announcement.target_tags || '',
            });
        } else {
            setEditingAnnouncement(null);
            setFormData(emptyAnnouncement);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingAnnouncement(null);
        setFormData(emptyAnnouncement);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                action_url: formData.action_url || null,
                action_label: formData.action_label || null,
                target_tags: formData.target_all_users ? null : (formData.target_tags || null),
                starts_at: formData.starts_at ? `${formData.starts_at}T00:00:00Z` : null,
                expires_at: formData.expires_at ? `${formData.expires_at}T23:59:59Z` : null,
            };

            if (editingAnnouncement) {
                await axios.put(
                    buildApiUrl(`/api/announcements/admin/${editingAnnouncement.id}`),
                    payload,
                    { headers: getAuthHeaders() }
                );
            } else {
                await axios.post(buildApiUrl('/api/announcements/admin/create'), payload, {
                    headers: getAuthHeaders(),
                });
            }

            handleCloseDialog();
            fetchAnnouncements();
            toast.success(editingAnnouncement ? 'Announcement updated' : 'Announcement created');
        } catch (err: any) {
            console.error('Error saving announcement:', err);
            toast.error(err.response?.data?.message || 'Failed to save announcement');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await axios.delete(buildApiUrl(`/api/announcements/admin/${id}`), {
                headers: getAuthHeaders(),
            });
            fetchAnnouncements();
            toast.success('Announcement deleted');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete announcement');
        }
    };

    const toggleActive = async (announcement: Announcement) => {
        try {
            await axios.put(
                buildApiUrl(`/api/announcements/admin/${announcement.id}`),
                { is_active: !announcement.is_active },
                { headers: getAuthHeaders() }
            );
            fetchAnnouncements();
            toast.success(`Announcement ${!announcement.is_active ? 'activated' : 'deactivated'}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const paginatedAnnouncements = announcements.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Toaster position="top-right" />

            {/* Page header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Announcements
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    New Announcement
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Priority</strong></TableCell>
                            <TableCell><strong>Target</strong></TableCell>
                            <TableCell><strong>Schedule</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Active</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {announcements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography color="text.secondary" sx={{ py: 4 }}>
                                        No announcements yet. Create your first one!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedAnnouncements.map((announcement) => {
                                const scheduleStatus = getScheduleStatus(announcement);
                                return (
                                    <TableRow key={announcement.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {announcement.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                                {announcement.message}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={announcement.announcement_type}
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={announcement.priority}
                                                size="small"
                                                color={PRIORITY_COLORS[announcement.priority] || 'default'}
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {announcement.target_all_users ? (
                                                <Chip label="All Users" size="small" />
                                            ) : (
                                                <Tooltip title={announcement.target_tags || ''}>
                                                    <Chip
                                                        label={announcement.target_tags || 'None'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ maxWidth: 120 }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">
                                                From: {formatDate(announcement.starts_at)}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                To: {formatDate(announcement.expires_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={scheduleStatus}
                                                size="small"
                                                color={
                                                    scheduleStatus === 'active' ? 'success' :
                                                    scheduleStatus === 'scheduled' ? 'info' :
                                                    scheduleStatus === 'expired' ? 'default' :
                                                    'default'
                                                }
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={announcement.is_active}
                                                onChange={() => toggleActive(announcement)}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleOpenDialog(announcement)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(announcement.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                {announcements.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        component="div"
                        count={announcements.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                )}
            </TableContainer>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                </DialogTitle>
                <DialogContent>
                    {/* Two-column layout: form on left, preview on right */}
                    <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>

                        {/* ── Form column ── */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                            {/* Type + Priority side by side */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    select
                                    label="Type"
                                    value={formData.announcement_type}
                                    onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value as 'banner' | 'modal' })}
                                    fullWidth
                                >
                                    <MenuItem value="banner">Banner (top of screen)</MenuItem>
                                    <MenuItem value="modal">Modal (pop-up)</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'info' | 'warning' | 'promotion' | 'critical' })}
                                    fullWidth
                                >
                                    <MenuItem value="info">Info</MenuItem>
                                    <MenuItem value="warning">Warning</MenuItem>
                                    <MenuItem value="promotion">Promotion</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                </TextField>
                            </Box>

                            <TextField
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                                required
                            />

                            <Divider />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Action Button Label"
                                    value={formData.action_label}
                                    onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                                    fullWidth
                                    placeholder="Subscribe Now"
                                />
                                <TextField
                                    label="Action URL"
                                    value={formData.action_url}
                                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                                    fullWidth
                                    placeholder="https://..."
                                />
                            </Box>

                            <Divider />

                            {/* Start + Expiry dates side by side */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Leave blank to show immediately"
                                />
                                <TextField
                                    label="Expiry Date"
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Leave blank to never expire"
                                />
                            </Box>

                            <Divider />

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.dismissible}
                                            onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                                        />
                                    }
                                    label="Dismissible"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.target_all_users}
                                            onChange={(e) => setFormData({ ...formData, target_all_users: e.target.checked })}
                                        />
                                    }
                                    label="All users"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                    }
                                    label="Active"
                                />
                            </Box>

                            {!formData.target_all_users && (
                                <TextField
                                    label="Target Tags (comma-separated)"
                                    value={formData.target_tags}
                                    onChange={(e) => setFormData({ ...formData, target_tags: e.target.value })}
                                    fullWidth
                                    placeholder="guest,freemium"
                                    helperText="Show only to users with these Shopify customer tags"
                                />
                            )}
                        </Box>

                        {/* ── Preview column ── */}
                        <Box
                            sx={{
                                width: 280,
                                flexShrink: 0,
                                borderLeft: '1px solid #e0e0e0',
                                pl: 3,
                                pt: 1,
                            }}
                        >
                            <AnnouncementPreview formData={formData} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!formData.title || !formData.message}
                    >
                        {editingAnnouncement ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
