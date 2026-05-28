# SMS OTP Integration Guide - Zavu.dev

This guide covers the complete SMS OTP verification system for your e-commerce platform using Zavu.dev.

---

## 📋 What Was Implemented

### Backend Components

1. **`src/services/smsService.ts`** - SMS utility service
   - Zavu SDK initialization
   - Cryptographically secure 6-digit OTP generation
   - Phone number normalization (handles various formats)
   - SMS sending wrapper function
   - OTP verification helper

2. **`src/middleware/rateLimitSMS.ts`** - Rate limiting middleware
   - Prevents abuse: max 1 OTP request per 60 seconds per phone/IP
   - In-memory store with automatic cleanup
   - Returns 429 status with retry-after time

3. **`src/routes/otpRoutes.ts`** - OTP API endpoints
   - `POST /api/auth/send-otp` - Request OTP
   - `POST /api/auth/verify-otp` - Verify OTP and create/find user

---

## 🔧 Setup Instructions

### Step 1: Install Zavu SDK

```bash
npm install @zavudev/sdk
```

### Step 2: Add Environment Variables

Add to your `.env` file:

```env
# Zavu SMS Gateway Configuration
ZAVUDEV_API_KEY=YOUR_LIVE_ZAVU_API_KEY
```

**Where to find your API key:**
1. Log in to [Zavu Dashboard](https://app.zavu.dev)
2. Go to Settings → API Keys
3. Copy your API key
4. Add it to your `.env` file

### Step 3: Verify Sender Configuration

Your sender ID in Zavu:
- **Sender ID:** `kd71wx4apzpmr0fmdaq857t6h187hecp`
- **Channel:** SMS One-Way
- **Phone:** +91 90281 07111

This is already configured in your Zavu account.

### Step 4: Rebuild and Deploy

```bash
npm run build
pm2 restart gut-backend
```

Check logs:
```bash
pm2 logs gut-backend --lines 20
```

You should see:
```
✅ SMS service initialized successfully
📱 SMS service initialized successfully
```

---

## 📱 API Endpoints

### 1. Request OTP

**Endpoint:** `POST /api/auth/send-otp`

**Request:**
```json
{
  "phone": "9601279172"
}
```

**Phone Formats Accepted:**
- `9601279172` (10 digits)
- `09601279172` (with leading 0)
- `919601279172` (with country code)
- `+919601279172` (with + prefix)

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "expiresIn": 300,
  "phone": "+919601279172"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid phone number. Please enter a valid 10-digit mobile number."
}
```

**Rate Limited Response (429):**
```json
{
  "success": false,
  "error": "Too many requests. Please wait 45 seconds before trying again.",
  "retryAfter": 45
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**
```json
{
  "phone": "+919601279172",
  "otp": "123456",
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "user_document_id",
  "isNewUser": false,
  "phone": "+919601279172"
}
```

**Invalid OTP Response (401):**
```json
{
  "success": false,
  "error": "Invalid OTP. 2 attempts remaining."
}
```

**Expired OTP Response (410):**
```json
{
  "success": false,
  "error": "OTP has expired. Please request a new OTP."
}
```

---

## 🎯 Implementation Flow

### User Login Flow

```
1. User enters phone number on login screen
   ↓
2. Frontend POST /api/auth/send-otp with phone
   ↓
3. Backend validates phone format
   ↓
4. Backend checks rate limit (max 1 per 60 seconds)
   ↓
5. Backend generates secure 6-digit OTP
   ↓
6. Backend stores OTP in Firestore with 5-min expiry
   ↓
7. Backend sends SMS via Zavu API
   ↓
8. User receives SMS: "Your Gutmantra verification code is 123456. Valid for 5 minutes."
   ↓
9. User enters OTP on verification screen
   ↓
10. Frontend POST /api/auth/verify-otp with phone + OTP
    ↓
11. Backend validates OTP (max 3 attempts)
    ↓
12. Backend creates user account if new (or finds existing)
    ↓
13. Backend returns userId for session management
    ↓
14. Frontend stores userId and redirects to dashboard
```

---

## 📊 Data Storage (Firestore)

### OTP Requests Collection

```
Collection: otp_requests
Document ID: otp_9601279172

{
  "phone": "+919601279172",
  "code": "123456",
  "createdAt": Timestamp,
  "expiresAt": Timestamp,
  "verified": false,
  "attempts": 0
}
```

### Users Collection

```
Collection: users
Document ID: auto-generated

{
  "phone": "+919601279172",
  "email": "user@example.com",
  "createdAt": Timestamp,
  "lastLoginAt": Timestamp,
  "otpVerified": true
}
```

---

## 🔒 Security Features

### 1. Rate Limiting
- **Limit:** Max 1 OTP request per 60 seconds per phone number
- **Enforcement:** In-memory store with automatic cleanup
- **Response:** 429 Too Many Requests with retry-after time

### 2. OTP Expiration
- **TTL:** 5 minutes (300 seconds)
- **Enforcement:** Timestamp comparison on verification
- **Action:** OTP deleted automatically if expired

### 3. Attempt Limiting
- **Max Attempts:** 3 incorrect OTP entries
- **Action:** OTP deleted after 3 failed attempts
- **Prevents:** Brute force attacks

### 4. Phone Normalization
- **Validation:** Only accepts valid 10-digit Indian mobile numbers
- **Format:** Normalizes to +91 format
- **Prevents:** Invalid/typo numbers from being processed

### 5. Cost Protection
- **SMS Budget:** Your $20 prepaid balance
- **Rate Limiting:** Prevents bot spam consuming credits
- **Verification:** Only legitimate users can trigger SMS sends

---

## 📊 SMS Specifications

### Message Format
```
"Your Gutmantra verification code is XXXXXX. Valid for 5 minutes."
```

**Character Count:** 73 characters (well under 160-character SMS limit)

### Sender Details
- **Sender ID:** kd71wx4apzpmr0fmdaq857t6h187hecp
- **Sender Name:** SMS One-Way
- **Type:** Transactional (not promotional)

### Delivery
- **Provider:** Zavu.dev
- **Gateway:** Raw carrier routing
- **Cost:** Charged to prepaid balance
- **Delivery Time:** Typically 1-5 seconds

---

## 🧪 Testing

### Test in Postman

**1. Request OTP:**
```
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "9601279172"
}
```

**2. Verify OTP:**
```
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919601279172",
  "otp": "123456",
  "email": "test@example.com"
}
```

### Check Firestore

Navigate to Firebase Console → Firestore → `otp_requests` collection to see stored OTPs (before they expire).

### View Backend Logs

```bash
pm2 logs gut-backend --lines 50
```

Look for:
- `📞 OTP request received for phone:`
- `✅ Phone validated and normalized:`
- `🔐 Generated OTP:`
- `📱 Sending SMS to`
- `✅ SMS sent successfully`

---

## 🐛 Troubleshooting

### SMS Not Sending

**Check 1: API Key**
```bash
echo $ZAVUDEV_API_KEY
```
Should print your API key. If empty, add it to `.env` and restart.

**Check 2: Zavu Account Balance**
- Log in to [Zavu Dashboard](https://app.zavu.dev)
- Check your prepaid balance (should be $20)
- Verify SMS channel is enabled

**Check 3: Backend Logs**
```bash
pm2 logs gut-backend | grep -i "sms\|zavu"
```

### Phone Validation Failing

**Valid formats:**
- ✅ `9601279172` (10 digits)
- ✅ `+919601279172` (with country code)
- ✅ `09601279172` (with leading 0)

**Invalid formats:**
- ❌ `8601279172` (starts with 8, must start with 6-9)
- ❌ `960127917` (only 9 digits)
- ❌ `+1 960 127 9172` (wrong country code)

### Rate Limit Error

If user gets "Too many requests" error:
- Wait the specified `retryAfter` seconds
- Or use a different phone number

---

## 📈 Monitoring

### Track OTP Requests

Query in Firestore Console:
```
db.collection('otp_requests').orderBy('createdAt', 'desc').limit(10)
```

### Monitor SMS Costs

Check your Zavu balance:
1. Go to [Zavu Dashboard](https://app.zavu.dev)
2. Check SMS usage and balance
3. Each OTP costs approximately $0.01-0.05 depending on region

---

## 🚀 Next Steps

### Frontend Integration

Create login page with phone input:
1. User enters phone
2. POST `/api/auth/send-otp` → show "OTP sent" message
3. User sees OTP entry screen
4. POST `/api/auth/verify-otp` → redirect to dashboard

### Session Management

After OTP verification:
1. Store `userId` in localStorage/sessionStorage
2. Include `userId` in subsequent API requests
3. Implement logout to clear userId

### User Profile

Complete user information:
1. After OTP verification, show profile completion form
2. Collect email, address, name
3. Update user document in Firestore

---

## 📞 Support

**Zavu Support:** [docs.zavu.dev](https://docs.zavu.dev)

**Your Account:** API Key visible in Zavu Dashboard Settings

---

## ✅ Checklist

- [ ] Installed `@zavudev/sdk` via npm
- [ ] Added `ZAVUDEV_API_KEY` to `.env`
- [ ] Rebuilt backend: `npm run build`
- [ ] Restarted server: `pm2 restart gut-backend`
- [ ] Verified SMS client initialized in logs
- [ ] Tested `/api/auth/send-otp` endpoint
- [ ] Received test SMS with OTP
- [ ] Tested `/api/auth/verify-otp` endpoint
- [ ] Checked user created in Firestore
- [ ] Tested rate limiting (request twice within 60 seconds)
- [ ] Integrated frontend login page
- [ ] Deployed to production

---

**Setup Complete!** Your SMS OTP system is ready to handle user authentication. 🎉
