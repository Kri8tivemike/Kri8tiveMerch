# Kri8tiveBlanks Admin Scripts

This directory contains administrative scripts for Kri8tiveBlanks.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
3. Edit the `.env` file with your Appwrite endpoint, project ID, and API key

## Available Scripts

### Create Super Admin

Creates a new Super Admin user with the specified credentials using Appwrite.

```bash
npm run create-superadmin -- admin@example.com SecurePassword123 FirstName LastName
```

Or directly with ts-node:

```bash
npx ts-node create-superadmin.ts admin@example.com SecurePassword123 FirstName LastName
```

#### Parameters:
- Email address
- Password
- First name
- Last name

#### Security Notes:
- Always use a strong password
- Create super admin accounts only from a secure environment
- Keep the Appwrite API key confidential
- Consider changing the password after initial creation through the SuperAdmin portal

## Environment Variables Required

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_API_KEY=your-api-key
VITE_APPWRITE_DATABASE_ID=kri8tive_db
VITE_APPWRITE_PROFILES_COLLECTION_ID=user_profiles
``` 