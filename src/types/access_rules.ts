/**
 * TypeScript types for the Access Rules system
 * Used by admin dashboard to manage flexible permission rules
 */

export interface UserCondition {
    id: number;
    condition_group: number;
    user_tag_name: string | null;
    is_guest: boolean;
}

export interface PatternGrant {
    id: number;
    pattern_label_name: string | null;
    grant_all_labels: boolean;
    is_exclusion: boolean;
}

export interface AccessRule {
    id: number;
    rule_name: string;
    description: string | null;
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    user_conditions: UserCondition[];
    pattern_grants: PatternGrant[];
}

export interface UserConditionCreate {
    condition_group: number;
    user_tag_name?: string | null;
    is_guest: boolean;
}

export interface PatternGrantCreate {
    pattern_label_name?: string | null;
    grant_all_labels: boolean;
    is_exclusion?: boolean;
}

export interface AccessRuleCreate {
    rule_name: string;
    description?: string | null;
    priority: number;
    is_active: boolean;
    user_conditions: UserConditionCreate[];
    pattern_grants: PatternGrantCreate[];
}

export interface AccessRuleUpdate {
    description?: string | null;
    priority?: number;
    is_active?: boolean;
    user_conditions?: UserConditionCreate[];
    pattern_grants?: PatternGrantCreate[];
}
