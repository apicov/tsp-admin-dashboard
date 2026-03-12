/**
 * API service for Access Rules management
 */

import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config';
import { AccessRule, AccessRuleCreate } from '../types/access_rules';

const BASE_PATH = '/api/access-rules/admin';

/**
 * Get all access rules
 */
export async function listRules(): Promise<AccessRule[]> {
    const response = await axios.get(
        buildApiUrl(`${BASE_PATH}/rules`),
        { headers: getAuthHeaders() }
    );
    return response.data;
}

/**
 * Get a specific rule by ID
 */
export async function getRule(ruleId: number): Promise<AccessRule> {
    const response = await axios.get(
        buildApiUrl(`${BASE_PATH}/rules/${ruleId}`),
        { headers: getAuthHeaders() }
    );
    return response.data;
}

/**
 * Create a new access rule
 */
export async function createRule(rule: AccessRuleCreate): Promise<AccessRule> {
    const response = await axios.post(
        buildApiUrl(`${BASE_PATH}/rules`),
        rule,
        { headers: getAuthHeaders() }
    );
    return response.data;
}

/**
 * Delete a rule
 */
export async function deleteRule(ruleId: number): Promise<void> {
    await axios.delete(
        buildApiUrl(`${BASE_PATH}/rules/${ruleId}`),
        { headers: getAuthHeaders() }
    );
}

/**
 * Activate a rule
 */
export async function activateRule(ruleId: number): Promise<AccessRule> {
    const response = await axios.post(
        buildApiUrl(`${BASE_PATH}/rules/${ruleId}/activate`),
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
}

/**
 * Deactivate a rule
 */
export async function deactivateRule(ruleId: number): Promise<AccessRule> {
    const response = await axios.post(
        buildApiUrl(`${BASE_PATH}/rules/${ruleId}/deactivate`),
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
}
