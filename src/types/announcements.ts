/**
 * Shared TypeScript types for the Announcement system
 * Used by both the mobile app and admin dashboard
 */

export interface Announcement {
    id: number;
    title: string;
    message: string;
    announcement_type: 'banner' | 'modal';
    priority: 'info' | 'warning' | 'promotion' | 'critical';
    dismissible: boolean;
    action_url?: string;
    action_label?: string;
    target_all_users: boolean;
    target_tags?: string;
    is_active: boolean;
    starts_at?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface AnnouncementCreate {
    title: string;
    message: string;
    announcement_type?: 'banner' | 'modal';
    priority?: 'info' | 'warning' | 'promotion' | 'critical';
    dismissible?: boolean;
    action_url?: string;
    action_label?: string;
    target_all_users?: boolean;
    target_tags?: string;
    is_active?: boolean;
    starts_at?: string;
    expires_at?: string;
}

export interface AnnouncementDismissRequest {
    announcement_id: number;
    session_id: string;
}

export type AnnouncementPriority = 'info' | 'warning' | 'promotion' | 'critical';
export type AnnouncementType = 'banner' | 'modal';
