// config/api.ts
/**
 * API Configuration for FridgeFriend
 * 
 * This file contains configuration for external API services used by the app.
 */

// The API key for Google's Generative AI (Gemini)
// For development, you can set this here, or preferably through an environment variable
// Note: In production, you should use environment variables or a proper secrets management system
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// The base URL for the Gemini API
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Export all API configuration as a single object
export const apiConfig = {
  gemini: {
    apiKey: GEMINI_API_KEY,
    apiUrl: GEMINI_API_URL,
  },
};