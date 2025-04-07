# Gemini API Integration

## Installation

To use the Gemini API for recipe generation, you need to install the Google Generative AI SDK:

```bash
# Using npm
npm install @google/generative-ai

# OR using yarn
yarn add @google/generative-ai
```

## Configuration

1. Obtain a Gemini API key from Google AI Studio (https://makersuite.google.com)

2. Add your API key to your environment variables:

   For local development with Expo, create or edit a `.env` file at the root of your project:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

   For production deployment, add the environment variable according to your hosting platform's instructions.

## Usage

The recipe generation system will automatically use the Gemini API when an API key is provided. If no API key is found, it will gracefully fall back to using mock recipes for development purposes.

## Troubleshooting

- If you encounter errors related to the JSON format, check the recipe prompt in `recipeGenerationService.tsx` to ensure it's properly guiding the AI to generate correctly formatted recipes.
- If you're getting "API key not configured" messages, ensure your environment variable is properly set and accessible.
- For development, you can temporarily hardcode your API key in the `config/api.ts` file, but remember to remove it before committing to source control.