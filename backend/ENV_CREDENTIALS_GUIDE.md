# 🔐 Environment Credentials Setup Guide

## Backend .env Credentials

**File Location**: `backend/.env`

**Create with this structure:**

```env
# ============================================
# WHATSAPP BUSINESS API CREDENTIALS
# ============================================
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# ============================================
# FIREBASE CONFIGURATION
# ============================================
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development
```

---

## Frontend .env.local Credentials

**File Location**: `frontend/.env.local`

**Create with this structure:**

```env
# ============================================
# BACKEND API CONFIGURATION
# ============================================
REACT_APP_API_URL=http://localhost:5000

# ============================================
# WHATSAPP CONFIGURATION
# ============================================
REACT_APP_WHATSAPP_PHONE_FORMAT=+91

# ============================================
# ENVIRONMENT
# ============================================
REACT_APP_NODE_ENV=development
```

---

## Where to Get Each Credential

### 1. WHATSAPP_PHONE_ID
- **Value**: `1108455795690267`
- **Source**: Meta Business Manager → WhatsApp → Phone Numbers
- **How to find**: 
  - Go to https://business.facebook.com
  - Select your GutMantra app
  - Go to WhatsApp → Configuration
  - Find "Phone Numbers" section
  - Copy the Phone ID
- **Status**: This is your verified WhatsApp phone number ID

### 2. WHATSAPP_ACCESS_TOKEN
- **Value**: Generate from Meta Developer Console
- **Source**: Meta Developer Console → Your App → System Users
- **How to get**:
  1. Go to https://developers.facebook.com
  2. Select your GutMantra app
  3. Go to Tools → System Users
  4. Create or select system user
  5. Assign role: Admin
  6. Generate access token with permissions:
     - whatsapp_business_messaging
     - whatsapp_business_management
  7. Copy the token immediately (won't show again)
- **⚠️ IMPORTANT**: Never share this token. Never commit to git.
- **Expiry**: By default doesn't expire, but check periodically
- **If expired**: Generate new token in System Users section

### 3. WHATSAPP_BUSINESS_ACCOUNT_ID
- **Value**: `1495438322369061`
- **Source**: Meta Business Manager → WhatsApp
- **How to find**:
  - Go to https://business.facebook.com
  - Select your GutMantra app
  - Go to WhatsApp → Configuration
  - Find "Business Account ID" or "WABA ID"
  - Copy the 16-digit number
- **Status**: This is your WhatsApp Business Account ID

### 4. WHATSAPP_TEMPLATE_NAME
- **Value**: `gutmantra_otp`
- **Source**: Meta Developer Console → WhatsApp → Templates
- **How to find**:
  - Go to https://developers.facebook.com
  - Select your GutMantra app
  - Go to WhatsApp → Configuration
  - Find "Message Templates" section
  - Look for "gutmantra_otp" template
- **Status**: Template must be APPROVED before testing
- **Wait time**: 24-48 hours for Meta to review

### 5. JWT_SECRET
- **Value**: Generate a random string
- **How to create**:
  ```bash
  # Option 1: Use openssl
  openssl rand -hex 32
  
  # Option 2: Use Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # Option 3: Use online generator
  https://tools.appdevdesigns.com/generate-random-string
  ```
- **Requirements**:
  - Minimum 32 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Unique for each environment
  - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **⚠️ CRITICAL**: 
  - Change this monthly
  - Never use same secret across environments
  - Keep this very secret (production)

### 6. JWT_EXPIRY
- **Value**: `7d` (7 days)
- **Options**:
  - `7d` (7 days) - recommended for mobile apps
  - `24h` (24 hours) - more secure
  - `30d` (30 days) - less secure
  - `1y` (1 year) - for long-lived tokens
- **Note**: Users will need to login again after expiry

### 7. FIREBASE_PROJECT_ID
- **Value**: Your Firebase project ID
- **Source**: Firebase Console → Project Settings
- **How to find**:
  - Go to https://console.firebase.google.com
  - Select your GutMantra project
  - Click Settings ⚙️ icon
  - Go to Project Settings tab
  - Copy "Project ID"
  - Example: `gutmantra-app-dev`

### 8. FIREBASE_PRIVATE_KEY
- **Value**: Your Firebase service account private key
- **Source**: Firebase Console → Service Accounts
- **How to get**:
  1. Go to https://console.firebase.google.com
  2. Select your project
  3. Click Settings ⚙️ icon
  4. Go to Service Accounts tab
  5. Click "Generate New Private Key"
  6. A JSON file downloads
  7. Open the JSON file
  8. Copy the value of `private_key` field
  9. It looks like: `"-----BEGIN PRIVATE KEY-----\nMIIE...ABC...\n-----END PRIVATE KEY-----\n"`
- **⚠️ IMPORTANT**: 
  - Keep this secret (never share)
  - Never commit to git
  - Regenerate if compromised
  - Stored in .env (not in code)

### 9. FIREBASE_CLIENT_EMAIL
- **Value**: Your Firebase service account email
- **Source**: Firebase Console → Service Accounts
- **How to get**:
  1. Go to https://console.firebase.google.com
  2. Select your project
  3. Click Settings ⚙️ icon
  4. Go to Service Accounts tab
  5. Copy "Service Account Email"
  6. Example: `firebase-adminsdk-abc123@gutmantra-app-dev.iam.gserviceaccount.com`

### 10. REACT_APP_API_URL
- **Development**: `http://localhost:5000`
- **Production**: `https://your-api-domain.com`
- **How to set**:
  - For local testing: `http://localhost:5000`
  - For production: `https://api.gutmantra.in`
- **Note**: Must match your backend URL

### 11. REACT_APP_WHATSAPP_PHONE_FORMAT
- **Value**: `+91` (India country code)
- **For other countries**:
  - USA: `+1`
  - UK: `+44`
  - Australia: `+61`
  - Germany: `+49`
  - France: `+33`

---

## Quick Setup Checklist

- [ ] Get WHATSAPP_PHONE_ID from Meta Manager
- [ ] Generate WHATSAPP_ACCESS_TOKEN in Meta Console
- [ ] Get WHATSAPP_BUSINESS_ACCOUNT_ID
- [ ] Get WHATSAPP_TEMPLATE_NAME (gutmantra_otp)
- [ ] Generate JWT_SECRET (openssl rand -hex 32)
- [ ] Get Firebase credentials from Console
- [ ] Create backend/.env file
- [ ] Create frontend/.env.local file
- [ ] Add .env to .gitignore
- [ ] Test backend with curl
- [ ] Test frontend API connection
- [ ] Verify WhatsApp template is APPROVED
- [ ] Never commit .env files

---

**All credentials guide complete! Use as reference when setting up .env files.** 🔐
