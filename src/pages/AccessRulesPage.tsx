import { useState, useEffect } from 'react';
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
    IconButton,
    CircularProgress,
    Alert,
    Tooltip,
    Card,
    Divider,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import { AccessRule, AccessRuleCreate, UserConditionCreate, PatternGrantCreate } from '../types/access_rules';
import * as api from '../services/accessRules';

// ─── Default form values ───────────────────────────────────────────────────────

const emptyRule: AccessRuleCreate = {
    rule_name: '',
    description: '',
    priority: 0,
    is_active: true,
    user_conditions: [
        {
            condition_group: 1,
            user_tag_name: '',
            is_guest: false,
        }
    ],
    pattern_grants: [
        {
            pattern_label_name: '',
            grant_all_labels: false,
            is_exclusion: false,
        }
    ],
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AccessRulesPage() {
    const [rules, setRules] = useState<AccessRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState<AccessRuleCreate>(emptyRule);

    // Load rules on mount
    useEffect(() => {
        loadRules();
    }, []);

    async function loadRules() {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listRules();
            setRules(data);
        } catch (err: any) {
            console.error('Failed to load rules:', err);
            setError(err.response?.data?.detail || 'Failed to load rules');
            toast.error('Failed to load access rules');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        try {
            // Validate
            if (!formData.rule_name.trim()) {
                toast.error('Rule name is required');
                return;
            }

            // Filter out empty conditions and grants
            const cleanedData = {
                ...formData,
                user_conditions: formData.user_conditions.filter(
                    c => c.is_guest || c.user_tag_name?.trim()
                ),
                pattern_grants: formData.pattern_grants.filter(
                    g => g.grant_all_labels || g.pattern_label_name?.trim()
                ),
            };

            if (cleanedData.user_conditions.length === 0) {
                toast.error('At least one user condition is required');
                return;
            }

            if (cleanedData.pattern_grants.length === 0) {
                toast.error('At least one pattern grant is required');
                return;
            }

            await api.createRule(cleanedData);
            toast.success('Rule created successfully');
            setDialogOpen(false);
            setFormData(emptyRule);
            loadRules();
        } catch (err: any) {
            console.error('Failed to create rule:', err);
            toast.error(err.response?.data?.detail || 'Failed to create rule');
        }
    }

    async function handleDelete(id: number, name: string) {
        if (!confirm(`Are you sure you want to delete rule "${name}"?\n\nThis will immediately affect user access.`)) {
            return;
        }

        try {
            await api.deleteRule(id);
            toast.success('Rule deleted');
            loadRules();
        } catch (err: any) {
            console.error('Failed to delete rule:', err);
            toast.error(err.response?.data?.detail || 'Failed to delete rule');
        }
    }

    async function handleToggleActive(rule: AccessRule) {
        try {
            if (rule.is_active) {
                await api.deactivateRule(rule.id);
                toast.success(`Rule "${rule.rule_name}" deactivated`);
            } else {
                await api.activateRule(rule.id);
                toast.success(`Rule "${rule.rule_name}" activated`);
            }
            loadRules();
        } catch (err: any) {
            console.error('Failed to toggle rule:', err);
            toast.error(err.response?.data?.detail || 'Failed to update rule');
        }
    }

    function addCondition() {
        setFormData({
            ...formData,
            user_conditions: [
                ...formData.user_conditions,
                {
                    condition_group: formData.user_conditions.length + 1,
                    user_tag_name: '',
                    is_guest: false,
                }
            ]
        });
    }

    function removeCondition(index: number) {
        setFormData({
            ...formData,
            user_conditions: formData.user_conditions.filter((_, i) => i !== index)
        });
    }

    function updateCondition(index: number, field: keyof UserConditionCreate, value: any) {
        const updated = [...formData.user_conditions];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, user_conditions: updated });
    }

    function addGrant() {
        setFormData({
            ...formData,
            pattern_grants: [
                ...formData.pattern_grants,
                {
                    pattern_label_name: '',
                    grant_all_labels: false,
                    is_exclusion: false,
                }
            ]
        });
    }

    function removeGrant(index: number) {
        setFormData({
            ...formData,
            pattern_grants: formData.pattern_grants.filter((_, i) => i !== index)
        });
    }

    function updateGrant(index: number, field: keyof PatternGrantCreate, value: any) {
        const updated = [...formData.pattern_grants];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, pattern_grants: updated });
    }

    // Format conditions for display
    function formatConditions(rule: AccessRule): string {
        const groups: { [key: number]: string[] } = {};

        rule.user_conditions.forEach(cond => {
            if (!groups[cond.condition_group]) {
                groups[cond.condition_group] = [];
            }
            if (cond.is_guest) {
                groups[cond.condition_group].push('Guest');
            } else if (cond.user_tag_name) {
                groups[cond.condition_group].push(cond.user_tag_name);
            }
        });

        const groupStrings = Object.values(groups).map(tags => tags.join(' AND '));
        return groupStrings.join(' OR ');
    }

    // Format grants for display
    function formatGrants(rule: AccessRule): string {
        const grants = rule.pattern_grants.filter(g => !g.is_exclusion);
        const exclusions = rule.pattern_grants.filter(g => g.is_exclusion);

        let result = '';

        if (grants.some(g => g.grant_all_labels)) {
            result = 'ALL Patterns';
        } else if (grants.some(g => g.pattern_label_name === '*')) {
            result = '* (ALL)';
        } else {
            result = grants
                .map(g => g.pattern_label_name)
                .filter(Boolean)
                .join(', ') || 'None';
        }

        if (exclusions.length > 0) {
            const excludedLabels = exclusions
                .map(g => g.pattern_label_name)
                .filter(Boolean)
                .join(', ');
            result += ` EXCEPT ${excludedLabels}`;
        }

        return result;
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <Box>
            <Toaster position="top-right" />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Access Permission Rules
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setFormData(emptyRule);
                        setDialogOpen(true);
                    }}
                >
                    Create Rule
                </Button>
            </Box>

            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
                Access rules determine which pattern labels users can see based on their tags.
                Rules are evaluated by priority (highest first). Changes take effect immediately.
            </Alert>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Rule Name</strong></TableCell>
                                <TableCell><strong>Priority</strong></TableCell>
                                <TableCell><strong>Conditions (Who)</strong></TableCell>
                                <TableCell><strong>Grants (What)</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No rules found. Create your first rule to get started.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rules.map(rule => (
                                    <TableRow key={rule.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {rule.rule_name}
                                            </Typography>
                                            {rule.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {rule.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={rule.priority} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {formatConditions(rule)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatGrants(rule)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.is_active ? 'Active' : 'Inactive'}
                                                color={rule.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={rule.is_active ? 'Deactivate' : 'Activate'}>
                                                <IconButton
                                                    onClick={() => handleToggleActive(rule)}
                                                    color={rule.is_active ? 'success' : 'default'}
                                                    size="small"
                                                >
                                                    <PowerIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    onClick={() => handleDelete(rule.id, rule.rule_name)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Create Access Rule</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {/* Basic Info */}
                        <TextField
                            label="Rule Name"
                            value={formData.rule_name}
                            onChange={e => setFormData({ ...formData, rule_name: e.target.value })}
                            fullWidth
                            required
                            margin="normal"
                            helperText="Unique identifier for this rule (e.g., 'premium_access')"
                        />
                        <TextField
                            label="Description"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                            margin="normal"
                            helperText="Human-readable description of what this rule does"
                        />
                        <TextField
                            label="Priority"
                            type="number"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            fullWidth
                            margin="normal"
                            helperText="Higher priority rules are evaluated first (e.g., 10 before 5)"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            }
                            label="Active"
                        />

                        <Divider sx={{ my: 3 }} />

                        {/* User Conditions */}
                        <Typography variant="h6" gutterBottom>
                            User Conditions (Who does this rule apply to?)
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Within same group: AND logic. Between groups: OR logic.
                        </Alert>
                        {formData.user_conditions.map((cond, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Group"
                                        type="number"
                                        value={cond.condition_group}
                                        onChange={e => updateCondition(index, 'condition_group', parseInt(e.target.value) || 1)}
                                        sx={{ width: 100 }}
                                        size="small"
                                    />
                                    <TextField
                                        label="User Tag Name"
                                        value={cond.user_tag_name || ''}
                                        onChange={e => updateCondition(index, 'user_tag_name', e.target.value)}
                                        disabled={cond.is_guest}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g., premium, bundle-pack-subscription"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={cond.is_guest}
                                                onChange={e => {
                                                    updateCondition(index, 'is_guest', e.target.checked);
                                                    if (e.target.checked) {
                                                        updateCondition(index, 'user_tag_name', '');
                                                    }
                                                }}
                                            />
                                        }
                                        label="Guest"
                                    />
                                    <IconButton
                                        onClick={() => removeCondition(index)}
                                        color="error"
                                        disabled={formData.user_conditions.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Card>
                        ))}
                        <Button onClick={addCondition} startIcon={<AddIcon />} size="small">
                            Add Condition
                        </Button>

                        <Divider sx={{ my: 3 }} />

                        {/* Pattern Grants */}
                        <Typography variant="h6" gutterBottom>
                            Pattern Grants (What can users access?)
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Use 'Exclusion' to DENY access to specific labels. Use wildcard label '*' to grant all patterns.
                        </Alert>
                        {formData.pattern_grants.map((grant, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Pattern Label"
                                        value={grant.pattern_label_name || ''}
                                        onChange={e => updateGrant(index, 'pattern_label_name', e.target.value)}
                                        disabled={grant.grant_all_labels}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g., Free, Premium, * (for all)"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={grant.grant_all_labels}
                                                onChange={e => {
                                                    updateGrant(index, 'grant_all_labels', e.target.checked);
                                                    if (e.target.checked) {
                                                        updateGrant(index, 'pattern_label_name', '');
                                                    }
                                                }}
                                            />
                                        }
                                        label="All Labels"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={grant.is_exclusion || false}
                                                onChange={e => updateGrant(index, 'is_exclusion', e.target.checked)}
                                                color="error"
                                            />
                                        }
                                        label="Exclusion"
                                    />
                                    <IconButton
                                        onClick={() => removeGrant(index)}
                                        color="error"
                                        disabled={formData.pattern_grants.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Card>
                        ))}
                        <Button onClick={addGrant} startIcon={<AddIcon />} size="small">
                            Add Grant
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">
                        Create Rule
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
