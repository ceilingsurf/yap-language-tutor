# YAP Language Tutor - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Anthropic API key
- Netlify account (for deployment)

## Database Setup

1. **Create a Supabase project** at https://supabase.com

2. **Run the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Paste and execute the SQL

3. **Get your Supabase credentials**:
   - Navigate to Project Settings > API
   - Copy the Project URL and anon/public key

## Environment Variables

### For Local Development

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Netlify Deployment

Set environment variables in Netlify:

1. Go to Site settings > Environment variables
2. Add the following variables:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features Implemented

### ✅ Authentication
- Email/password signup and login via Supabase Auth
- Protected routes
- Automatic session management

### ✅ Language Learning
- **8 supported languages**: Spanish, French, German, Japanese, Italian, Portuguese, Chinese, Korean
- **Chat Mode**: Conversational practice
- **Lesson Mode**: Structured teaching
- **Voice Support**: Speech recognition and text-to-speech
- **Real-time Feedback**: Grammar corrections and suggestions

### ✅ Data Persistence
- User profiles saved to Supabase
- Conversation history stored
- Learning goals tracked
- Progress statistics

### ✅ Vocabulary Management
- Add custom vocabulary words
- Organize by categories (verbs, nouns, adjectives, phrases)
- Add example sentences
- Track mastery levels
- Search and filter

### ✅ Flashcard System
- Spaced repetition algorithm (SM-2 inspired)
- Flip card animations
- Easy/Medium/Hard rating system
- Session statistics
- Automatic review scheduling

## Usage

1. **Sign up** with email and password
2. **Select a language** from the dropdown
3. **Chat**: Practice conversational skills
4. **Vocabulary**: Add and manage vocabulary words
5. **Flashcards**: Review vocabulary with spaced repetition

## Spaced Repetition Logic

- **Easy**: Next review in 7+ days, increases mastery level
- **Medium**: Next review in 3 days, maintains mastery level
- **Hard**: Next review tomorrow, decreases mastery level

Mastery levels range from 0-5, affecting review intervals exponentially.

## API Integration

The app uses Anthropic's Claude API for AI-powered language tutoring. The API calls are routed through Netlify Functions to keep your API key secure.

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in environment variables
- Check that RLS policies are properly configured
- Ensure the schema was executed successfully

### Authentication Issues
- Confirm email verification is not required in Supabase settings
- Check that auth callbacks are properly configured

### API Errors

#### "Failed to get response from AI"

This error indicates an issue with the Anthropic API integration. Common causes:

**1. Missing or Invalid API Key**
- **Netlify**: Go to Site settings > Environment variables
- Add `ANTHROPIC_API_KEY` with your key from https://console.anthropic.com
- Redeploy the site after adding the environment variable

**2. API Key Not Found (Status 401)**
- Error: "invalid x-api-key"
- Solution: Check that your API key is correct and active

**3. Model Not Available (Status 404)**
- Error: "model not found"
- Solution: The app now uses `claude-3-5-sonnet-20241022` (latest stable model)
- If this fails, check Anthropic's status page

**4. Rate Limiting (Status 429)**
- Error: "rate limit exceeded"
- Solution: Wait a few minutes or upgrade your Anthropic plan

**5. Insufficient Credits (Status 402)**
- Error: "insufficient credits"
- Solution: Add credits to your Anthropic account

**How to Get an Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it won't be shown again!)
6. Add to Netlify environment variables as `ANTHROPIC_API_KEY`

**Testing Your API Key:**
```bash
# Test with curl (replace YOUR_API_KEY)
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

**Checking Netlify Logs:**
1. Go to Netlify dashboard
2. Click on your site
3. Go to Functions tab
4. Click on "chat" function
5. View logs to see detailed error messages

## Future Enhancements

- Progress charts and analytics
- Pronunciation assessment
- Conversation topics library
- Social features (study groups, leaderboards)
- Mobile app version
- Offline mode
- Export/import vocabulary
