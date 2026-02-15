/**
 * Admin Dashboard Configuration
 *
 * PURPOSE:
 * ========
 * Centralized configuration for admin dashboard.
 * Separates configuration from code for easier deployment.
 */

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Get the API base URL from environment variables
 * Falls back to empty string for development (same-origin)
 */
function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_URL?.trim() || '';
}

/**
 * Get current environment
 */
function getEnvironment(): 'development' | 'production' {
    return import.meta.env.PROD ? 'production' : 'development';
}

// ============================================================================
// Configuration Object
// ============================================================================

export const config = {
    /**
     * API configuration
     */
    api: {
        baseUrl: getApiBaseUrl(),
        timeout: 30000,
    },

    /**
     * Storage keys
     */
    storage: {
        authTokenKey: 'admin_access_token',
    },

    /**
     * Pagination settings
     */
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 100,
    },

    /**
     * UI settings
     */
    ui: {
        toastDuration: 5000,
        confirmDialogs: true,
    },

    /**
     * Environment info
     */
    env: {
        environment: getEnvironment(),
        isDevelopment: import.meta.env.DEV,
        isProduction: import.meta.env.PROD,
    },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a full API URL from a path
 */
export function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return config.api.baseUrl
        ? `${config.api.baseUrl}${normalizedPath}`
        : normalizedPath;
}

/**
 * Get authentication headers
 */
export function getAuthHeaders(): { Authorization: string } {
    const token = localStorage.getItem(config.storage.authTokenKey);
    return {
        Authorization: `Bearer ${token}`,
    };
}

// ============================================================================
// Development Logging
// ============================================================================

if (config.env.isDevelopment) {
    console.log('[Admin Config] Configuration loaded:', {
        environment: config.env.environment,
        apiBaseUrl: config.api.baseUrl || '(same-origin)',
    });
}

export default config;
