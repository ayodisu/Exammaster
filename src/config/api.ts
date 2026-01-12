/**
 * API Configuration
 * 
 * This file centralizes all API-related configuration.
 * Set NEXT_PUBLIC_API_URL in your .env.local file to override the default.
 * 
 * Example .env.local:
 * NEXT_PUBLIC_API_URL=http://localhost:8000/api
 */

import { STORAGE_KEYS } from './constants';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ExamMaster CBT';

/**
 * Helper to build API endpoint URLs
 */
export function apiUrl(path: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_URL}/${cleanPath}`;
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): { Authorization: string } | Record<string, never> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
}
