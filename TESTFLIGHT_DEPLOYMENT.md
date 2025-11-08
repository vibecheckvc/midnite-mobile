# Complete TestFlight Deployment Guide - Start to Finish

This is a complete, step-by-step guide to deploy your Midnite mobile app to TestFlight. Follow each step in order.

---

## Prerequisites

Before starting, make sure you have:

- ✅ Apple Developer Account (active subscription)
- ✅ Apple ID email and password
- ✅ Node.js installed (check with `node --version`)
- ✅ npm installed (check with `npm --version`)
- ✅ Your Supabase URL and Anon Key ready

---

## STEP 1: Install EAS CLI

Open your terminal and run:

```bash
npm install -g eas-cli
```

**Verify installation:**

```bash
eas --version
```

You should see a version number. If you get an error, try:

```bash
sudo npm install -g eas-cli
```

---

## STEP 2: Create/Login to Expo Account

**If you don't have an Expo account:**

1. Go to https://expo.dev/signup
2. Sign up with your email (free account is fine)
3. Verify your email

**Login to Expo:**

```bash
eas login
```

You'll be prompted to:

- Enter your email
- Check your email for a magic link OR enter a code
- Follow the authentication steps

**Alternative login method:**

```bash
npx expo login
```

---

## STEP 3: Verify App Configuration

Your `app.json` is already configured with:

- Bundle Identifier: `com.midnite.app`
- Version: `1.0.0`
- App Name: `midnite`

**Important:** If you want a different bundle identifier (must be unique), edit `app.json` now before proceeding. The format should be: `com.yourcompany.appname`

---

## STEP 4: Set Up Environment Variables

Your app needs Supabase credentials. You have two options:

### Option A: Create .env file (Recommended for local development)

Create a file named `.env` in your project root (`/Users/ali/Documents/GitHub/midnite-mobile/.env`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Make sure `.env` is in your `.gitignore` (it already is).

### Option B: Use EAS Secrets (Recommended for production builds)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

**For this guide, we'll use Option B (EAS Secrets) as it's more secure for builds.**

---

## STEP 5: Link Project to EAS

Navigate to your project directory and initialize EAS:

```bash
cd /Users/ali/Documents/GitHub/midnite-mobile
eas build:configure
```

**What to expect:**

- EAS will ask: "Would you like to create a new project on Expo?"
  - Answer: **Yes** (or press Enter)
- It will ask: "What would you like to name your project?"
  - Answer: **midnite** (or press Enter for default)
- It will create/update `eas.json` (already exists, so it will update it)

---

## STEP 6: Generate Apple App-Specific Password

EAS needs an App-Specific Password to manage your certificates. Here's how to create one:

1. **Go to:** https://appleid.apple.com
2. **Sign in** with your Apple ID (the one associated with your Developer account)
3. **Scroll down** to "Security" section
4. **Click** "App-Specific Passwords" (under "Sign in with your Apple ID")
5. **Click** the "+" button or "Generate an app-specific password"
6. **Enter a label:** `Expo EAS Build` (or any name you'll remember)
7. **Click** "Create"
8. **Copy the password** immediately (it looks like: `xxxx-xxxx-xxxx-xxxx`)
   - ⚠️ **IMPORTANT:** You can only see this password once! Save it somewhere safe.

**Keep this password handy - you'll need it in Step 8.**

---

## STEP 7: Create App in App Store Connect

This is a critical step. Follow these instructions carefully:

### 7.1: Access App Store Connect

1. **Go to:** https://appstoreconnect.apple.com
2. **Sign in** with your Apple ID (same one used for Developer account)
3. If prompted, accept terms and conditions

### 7.2: Create New App

1. **Click** "My Apps" in the top navigation
2. **Click** the blue "+" button (top left)
3. **Select** "New App"

### 7.3: Fill in App Information

You'll see a form. Fill it out as follows:

**Platform:**

- ✅ Check **iOS** (uncheck macOS, tvOS, watchOS if checked)

**Name:**

- Enter: `Midnite` (or your preferred app name)
- This is the name that appears in the App Store
- You can change this later

**Primary Language:**

- Select: `English (U.S.)` (or your preferred language)

**Bundle ID:**

- **Click the dropdown** - you should see a list
- **If `com.midnite.app` exists:** Select it
- **If it doesn't exist:** Click "Register a new Bundle ID" (see Step 7.4 below)

**SKU:**

- Enter: `midnite-ios-001` (or any unique identifier)
- This is for your internal tracking only
- Must be unique across all your apps
- Format: lowercase letters, numbers, hyphens

**User Access:**

- Select: **Full Access** (unless you're part of a team and want limited access)

### 7.4: Register Bundle ID (If Needed)

If you clicked "Register a new Bundle ID":

1. **Description:** Enter `Midnite iOS App`
2. **Bundle ID:** Enter `com.midnite.app`
3. **Click** "Continue"
4. **Review** and click "Register"
5. **Go back** to the app creation form
6. **Select** `com.midnite.app` from the Bundle ID dropdown

### 7.5: Create the App

1. **Review** all information
2. **Click** the blue "Create" button (bottom right)

**Success!** You should now see your app's dashboard in App Store Connect.

**Note:** You don't need to fill out any other information right now. We'll come back to configure TestFlight after the build.

---

## STEP 8: Build Your iOS App

Now let's build your app. This will take 15-30 minutes.

### 8.1: Start the Build

Run this command in your terminal:

```bash
eas build --platform ios --profile production
```

### 8.2: First-Time Setup Prompts

**Prompt 1: "Would you like to use EAS to manage your credentials?"**

- Answer: **Yes** (or press Enter)
- This lets EAS handle certificates automatically

**Prompt 2: "What's your Apple ID?"**

- Enter: Your Apple ID email (the one with Developer account)

**Prompt 3: "What's your App-Specific Password?"**

- Enter: The password you created in Step 6
- Paste it exactly (format: `xxxx-xxxx-xxxx-xxxx`)

**Prompt 4: "Select a team"**

- You'll see a list of teams associated with your Apple ID
- Select the one that matches your Developer account
- Usually there's only one option

**Prompt 5: "Select a distribution certificate"**

- Answer: **Create a new one** (or press Enter)
- EAS will generate this automatically

**Prompt 6: "Select a provisioning profile"**

- Answer: **Create a new one** (or press Enter)
- EAS will generate this automatically

### 8.3: Build Process

After answering the prompts:

- EAS uploads your code to their servers
- You'll see a URL like: `https://expo.dev/accounts/your-account/projects/midnite/builds/[build-id]`
- **Copy this URL** - you can track progress here
- The build typically takes 15-30 minutes

**What's happening:**

- ✅ Code is being uploaded
- ✅ Dependencies are being installed
- ✅ iOS app is being compiled
- ✅ Certificates are being generated
- ✅ App is being signed

**You can:**

- Wait in the terminal (it will show progress)
- Open the URL in your browser to see detailed logs
- Close the terminal - the build continues on EAS servers

### 8.4: Build Completion

When the build finishes, you'll see:

- ✅ "Build finished"
- A download link for the `.ipa` file
- Build ID (save this for reference)

**If build fails:**

- Check the build logs at the URL provided
- Common issues:
  - Wrong Apple ID credentials
  - Bundle ID mismatch
  - Missing environment variables
- See Troubleshooting section below

---

## STEP 9: Submit Build to TestFlight

Once your build completes successfully:

### 9.1: Submit via EAS CLI

Run this command:

```bash
eas submit --platform ios --latest
```

**Prompts you'll see:**

**Prompt 1: "What's your Apple ID?"**

- Enter: Your Apple ID email

**Prompt 2: "What's your App-Specific Password?"**

- Enter: The same App-Specific Password from Step 6

**Prompt 3: "Select a team"**

- Select: The same team you selected during build

**Prompt 4: "Select an app"**

- Select: **Midnite** (the app you created in Step 7)

**Prompt 5: "Select a build"**

- Select: **latest** (or the specific build number)

### 9.2: Submission Process

EAS will:

- Upload the `.ipa` file to App Store Connect
- Process the submission
- This takes 2-5 minutes

**Success message:** "Successfully submitted the app to App Store Connect"

### 9.3: Verify in App Store Connect

1. **Go to:** https://appstoreconnect.apple.com
2. **Click** "My Apps"
3. **Click** on "Midnite"
4. **Click** "TestFlight" tab (top navigation)
5. **Wait 10-30 minutes** for Apple to process the build
6. You should see your build appear under "iOS Builds"

**Build Status:**

- **Processing:** Apple is still processing (wait)
- **Ready to Submit:** Build is ready but needs test info
- **Ready to Test:** Build is ready for testing!

---

## STEP 10: Configure TestFlight

Once your build shows "Ready to Test" or "Ready to Submit":

### 10.1: Add Test Information

1. **In TestFlight tab**, find your build
2. **Click** on the build version number (e.g., "1.0.0 (1)")
3. **Scroll down** to "Test Information"
4. **Fill in:**
   - **What to Test:**
     ```
     Please test the core features:
     - User authentication
     - Car management
     - Community features
     - Chat functionality
     ```
   - **Feedback Email:** Your email address
   - **Description:** (Optional) More details about what's new
5. **Click** "Save" (top right)

### 10.2: Set Up Internal Testing (Recommended First)

Internal testers don't require App Review and can test immediately:

1. **In TestFlight tab**, click **"Internal Testing"** (left sidebar)
2. **Click** "+" or "Add Internal Testers"
3. **Add testers:**
   - Enter email addresses (one per line or comma-separated)
   - These must be Apple IDs
   - Maximum 100 internal testers
4. **Click** "Add"
5. **Select your build** (check the box next to version 1.0.0)
6. **Click** "Start Testing" or "Enable"

**Internal testers will receive:**

- Email invitation
- Instructions to install TestFlight app
- Access to your app immediately

### 10.3: Set Up External Testing (Optional - Requires Review)

External testing allows up to 10,000 testers but requires App Review:

1. **In TestFlight tab**, click **"External Testing"** (left sidebar)
2. **Click** "+" or "Create a new group"
3. **Enter group name:** `Beta Testers` (or any name)
4. **Click** "Create"
5. **Add testers** (same as internal testing)
6. **Select your build**
7. **Click** "Submit for Review"
8. **Fill out review information:**
   - App description
   - What to test
   - Contact information
9. **Submit**

**External testing:**

- Requires Apple review (24-48 hours typically)
- Once approved, testers can install via public link or invitation

---

## STEP 11: Invite Testers

### For Internal Testers:

1. **Testers receive email** from Apple with TestFlight invitation
2. **Testers need to:**
   - Install "TestFlight" app from App Store (if not already installed)
   - Open the email invitation
   - Tap "Start Testing" or "View in TestFlight"
   - Accept the invitation
   - Install your app

### For External Testers:

1. **After App Review approval:**
2. **Option A - Public Link:**
   - Go to External Testing group
   - Enable "Public Link"
   - Share the link with anyone
3. **Option B - Email Invitations:**
   - Same process as internal testers

---

## STEP 12: Monitor Your Build

### Check Build Status:

1. **App Store Connect** → Your App → TestFlight
2. **View:**
   - Number of testers
   - Crash reports
   - Feedback
   - Installation statistics

### View Crash Reports:

1. **TestFlight tab** → "Crashes" section
2. See crash logs and stack traces
3. Fix issues and rebuild

### Collect Feedback:

1. **TestFlight tab** → "Feedback" section
2. Read tester comments
3. Respond to feedback
4. Make improvements

---

## Troubleshooting Common Issues

### Build Fails with "Bundle ID Not Found"

**Problem:** Bundle ID doesn't exist in App Store Connect

**Solution:**

1. Go to App Store Connect → Users and Access → Keys → Certificates, Identifiers & Profiles
2. Click "Identifiers" → "+"
3. Register `com.midnite.app`
4. Try building again

### Build Fails with "Invalid Credentials"

**Problem:** Apple ID or App-Specific Password is wrong

**Solution:**

1. Regenerate App-Specific Password (Step 6)
2. Run: `eas credentials` to reconfigure
3. Try building again

### Build Succeeds but Submit Fails

**Problem:** App doesn't exist in App Store Connect

**Solution:**

1. Complete Step 7 (Create App in App Store Connect)
2. Make sure bundle ID matches exactly
3. Try submitting again

### Environment Variables Not Working

**Problem:** Supabase connection fails in app

**Solution:**

1. Verify secrets are set: `eas secret:list`
2. Recreate secrets: `eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"`
3. Rebuild the app

### Build Takes Too Long

**Problem:** Build stuck or very slow

**Solution:**

- First build always takes longer (30-45 min)
- Check build status at the URL provided
- If stuck > 1 hour, cancel and retry: `eas build:cancel [BUILD_ID]`

### TestFlight Build Not Appearing

**Problem:** Build submitted but not showing in TestFlight

**Solution:**

1. Wait 30-60 minutes (Apple processing time)
2. Refresh App Store Connect page
3. Check "Activity" tab for processing status
4. Verify you're looking at the correct app

---

## Quick Command Reference

```bash
# Login to Expo
eas login

# Configure project
eas build:configure

# Build iOS app
eas build --platform ios --profile production

# View all builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Submit to TestFlight
eas submit --platform ios --latest

# Manage credentials
eas credentials

# List environment secrets
eas secret:list

# Create environment secret
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-value"

# View app information
eas app:info
```

---

## Next Steps After TestFlight

1. **Gather Feedback:** Monitor TestFlight for 1-2 weeks
2. **Fix Issues:** Address bugs and crashes
3. **Iterate:** Make improvements based on feedback
4. **Rebuild:** Update version in `app.json` (e.g., 1.0.0 → 1.0.1)
5. **Resubmit:** Build and submit new version
6. **App Store:** When ready, submit for App Store review

---

## Important Reminders

- ⚠️ **Bundle ID:** Cannot be changed after first submission (without creating new app)
- ⚠️ **Version Numbers:** Must increment for each new build (1.0.0 → 1.0.1 → 1.0.2)
- ⚠️ **Build Expiration:** TestFlight builds expire after 90 days
- ⚠️ **App-Specific Password:** Save it securely - you'll need it for each build/submit
- ⚠️ **First Build:** Always takes longest (30-45 minutes)
- ⚠️ **Processing Time:** Apple needs 10-30 minutes to process builds after submission

---

## Need Help?

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Expo Discord:** https://chat.expo.dev/
- **Apple Developer Support:** https://developer.apple.com/support/
- **TestFlight Guide:** https://developer.apple.com/testflight/

**You're all set! Follow these steps in order and you'll have your app on TestFlight. Good luck! 🚀**
