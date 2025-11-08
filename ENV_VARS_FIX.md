# Fixing "Network Request Failed" Error in TestFlight

## Problem

The app shows "network request failed" when trying to sign in or sign up. This is because the Supabase environment variables are not being injected into the production build.

## Solution: Verify and Set EAS Environment Variables

### Step 1: Check Current Environment Variables

Run this command to see what environment variables are set for the `production` profile:

```bash
eas env:list --scope project --environment production
```

### Step 2: Set Environment Variables for Production

You need to set the environment variables for the `production` profile. Run these commands:

```bash
# Set Supabase URL
eas env:create production \
  --scope project \
  --type string \
  --visibility plain \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://your-project.supabase.co

# Set Supabase Anon Key
eas env:create production \
  --scope project \
  --type string \
  --visibility plain \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value your-anon-key-here
```

**Important:** Replace `https://your-project.supabase.co` and `your-anon-key-here` with your actual Supabase values.

### Step 3: Verify Variables Are Set

After setting them, verify they exist:

```bash
eas env:list --scope project --environment production
```

You should see both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` listed.

### Step 4: Rebuild with Environment Variables

**IMPORTANT:** Environment variables are only included in NEW builds. You must rebuild:

```bash
eas build --platform ios --profile production --clear-cache
```

### Step 5: Submit New Build

After the build completes:

```bash
eas submit --platform ios --latest
```

## Why This Happens

1. **Environment variables must be set BEFORE building** - They're baked into the app at build time
2. **EXPO*PUBLIC* prefix is required** - Expo only exposes variables that start with `EXPO_PUBLIC_`
3. **Profile-specific** - Variables must be set for the specific build profile (`production`, `preview`, etc.)
4. **Visibility must be "plain"** - Secret variables won't work for `EXPO_PUBLIC_` variables

## Debugging: Check Console Logs

After installing the new build from TestFlight, check the console logs (Xcode → Window → Devices → View Device Logs) and look for:

- `🔍 Supabase URL present: true` (should be `true`)
- `🔍 Supabase Key present: true` (should be `true`)
- `🔍 Supabase URL preview: https://...` (should show your actual Supabase URL, not "placeholder")

If you see:

- `❌ CRITICAL: Supabase URL is missing!` - The environment variable is not set correctly
- `⚠️ Supabase initialized with placeholder values` - The environment variables are missing

## Alternative: Use .env File (Local Development Only)

For local development, create a `.env` file in your project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** `.env` files don't work for production TestFlight builds - you MUST use EAS environment variables.

## Quick Checklist

- [ ] Environment variables are set in EAS for `production` profile
- [ ] Variables have `EXPO_PUBLIC_` prefix
- [ ] Variables have `visibility: plain` (not secret)
- [ ] Rebuilt the app after setting variables
- [ ] Console logs show the correct Supabase URL (not placeholder)
