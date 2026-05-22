# WhatsApp Business API OTP Authentication - Complete Documentation

## 📋 Overview

This is a complete WhatsApp Business API OTP authentication system for the GutMantra food ordering platform. It replaces Firebase OTP with Meta's WhatsApp Business Cloud API for sending and verifying one-time passwords during user login.

**Key Features:**
- ✅ Phone number validation (Indian: +91XXXXXXXXXX)
- ✅ 6-digit OTP generation and delivery via WhatsApp
- ✅ 10-minute OTP expiry
- ✅ 5-attempt maximum before lockout
- ✅ Automatic user creation on first login
- ✅ JWT token generation (7-day expiry)
- ✅ Rate limiting on resends (30 seconds)
- ✅ Two-stage frontend flow (phone → OTP)
- ✅ Auto-login after OTP verification
- ✅ Responsive mobile-friendly UI

---

## 📁 Files Created

### Backend Files
```
src/
├── routes/
│   └── whatsappRoutes.ts          ← 3 endpoints (send, verify, resend)
├── utils/
│   ├── otpUtils.ts                ← Phone validation, OTP generation
│   └── jwtUtils.ts                ← Token generation, verification
.env.example                        ← Template for credentials
.gitignore                          ← Updated to include .env
```

### Frontend Files
```
src/
├── pages/
│   ├── LoginPage.tsx               ← Complete login component
│   └── LoginPage.css               ← Styling (responsive, WhatsApp theme)
```

### Configuration Files
```
.env                                ← Credentials (CREATE MANUALLY - never commit)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 16+ installed
- Firebase Firestore initialized
- Meta Developer Account with WhatsApp Business API access
- WhatsApp template "gutmantra_otp" created and approved

### Step 1: Get WhatsApp Credentials

Go to https://developers.facebook.com/

1. Select your GutMantra app
2. Navigate to WhatsApp → Configuration
3. Note down:
   - **Phone ID**: `1108455795690267`
   - **Access Token**: (Generate in System Users section)
   - **Business Account ID**: `1495438322369061`

⚠️ **IMPORTANT**: Template must be in "APPROVED" status (wait 24-48 hours)

### Step 2: Create .env File

In `backend/` directory, create `.env`:

```env
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=7d
NODE_ENV=development
PORT=5000
```

**⚠️ CRITICAL**: 
- Add `.env` to `.gitignore`
- Never commit `.env` to git
- Use strong, random JWT_SECRET

### Step 3: Install Dependencies

```bash
cd backend
npm install axios jsonwebtoken
```

### Step 4: Update server.ts

Add to `src/server.ts`:

```typescript
import whatsappRoutes from './routes/whatsappRoutes';

// Register routes (before other routes)
app.use('/api/whatsapp', whatsappRoutes);
```

### Step 5: Start Backend

```bash
npm run dev

# Expected output:
# ✓ Server running on http://localhost:5000
# ✓ WhatsApp API endpoints available at /api/whatsapp
```

### Step 6: Add Frontend LoginPage

Copy provided files to frontend:
- `src/pages/LoginPage.tsx`
- `src/pages/LoginPage.css`

Update routing in `App.tsx`:
```typescript
import LoginPage from './pages/LoginPage';

<Route path="/login" element={<LoginPage />} />
```

### Step 7: Start Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000/login

---

## 📡 API Endpoints

### 1. Send OTP

**Endpoint**: `POST /api/whatsapp/send-otp`

**Request**:
```json
{
  "phone": "+919028107111"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to your WhatsApp",
  "messageId": "wamid.xxx..."
}
```

**Error Response** (400/401):
```json
{
  "success": false,
  "message": "Invalid phone number / Failed to send OTP"
}
```

---

### 2. Verify OTP

**Endpoint**: `POST /api/whatsapp/verify-otp`

**Request**:
```json
{
  "phone": "+919028107111",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "isNewUser": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_doc_id",
    "phone": "+919028107111",
    "firstName": null,
    "lastName": null,
    "email": null
  }
}
```

**Error Response** (400/429):
```json
{
  "success": false,
  "message": "Incorrect OTP / Too many attempts",
  "attemptsRemaining": 4
}
```

---

### 3. Resend OTP

**Endpoint**: `POST /api/whatsapp/resend-otp`

**Request**:
```json
{
  "phone": "+919028107111"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "New OTP sent to your WhatsApp"
}
```

**Rate Limited Response** (429):
```json
{
  "success": false,
  "message": "Please wait before requesting another OTP",
  "retryAfter": 25
}
```

---

## 🗄️ Database Schema

### otpVerifications Collection (Auto-created)

```typescript
interface OTPData {
  phone: string;                  // Document ID: "+919028107111"
  otp: string;                    // 6-digit OTP
  hashedOTP: string;              // SHA256 hash for audit
  createdAt: number;              // Timestamp in milliseconds
  expiresAt: number;              // Timestamp + 10 minutes
  attempts: number;               // Wrong attempt counter
  verified: boolean;              // Verification status
  verifiedAt?: number;            // When verified (optional)
}
```

### users Collection (Updated)

```typescript
interface User {
  id: string;                     // Document ID
  phone: string;                  // New field from WhatsApp OTP
  firstName?: string;
  lastName?: string;
  email?: string;
  address: {
    apartment?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  migrationStatus?: string;       // "new_whatsapp_signup"
  wordpressUserId?: string;
}
```

---

## 🔐 Security Features

✅ **Phone Validation**: Regex validation for Indian numbers
✅ **OTP Expiry**: 10-minute TTL, auto-deleted after expiry
✅ **Attempt Limiting**: 5 attempts max, then lockout
✅ **Rate Limiting**: 30 seconds between resend requests
✅ **JWT Tokens**: Signed with secret, 7-day expiry
✅ **Error Handling**: No sensitive info in error messages
✅ **Environment Variables**: Credentials never in code
✅ **Token Verification**: Every protected route validates JWT

---

## 📱 Frontend Flow

### Stage 1: Phone Entry
```
User enters phone number
  ↓
Phone validation (regex check)
  ↓
Calls /api/whatsapp/send-otp
  ↓
OTP sent to WhatsApp
  ↓
Show success message
  ↓
Move to OTP entry stage
```

### Stage 2: OTP Entry
```
User receives OTP in WhatsApp
  ↓
User enters 6-digit OTP in form
  ↓
OTP timer shows 2-minute countdown
  ↓
Call /api/whatsapp/verify-otp
  ↓
On success:
  - Store token in localStorage
  - Store user data in localStorage
  - Redirect to /dashboard
```

### Resend Logic
```
After 30 seconds, "Resend OTP" button appears
  ↓
User can click to resend
  ↓
Gets rate-limited if tried within 30 seconds
  ↓
Max 5 wrong attempts before new OTP required
```

---

## 🧪 Testing

### Test Send OTP

```bash
curl -X POST http://localhost:5000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111"}'
```

### Test Verify OTP

```bash
curl -X POST http://localhost:5000/api/whatsapp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111", "otp": "123456"}'
```

### Full E2E Test

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Go to http://localhost:3000/login
4. Enter your phone number (9028107111)
5. Check WhatsApp for OTP
6. Enter OTP on frontend
7. Should redirect to dashboard

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Template not approved | Wait 24-48 hours in Meta Console |
| OTP not received | Phone not verified | Verify phone in WhatsApp Business Account |
| Routes return 404 | Routes not registered | Check server.ts has whatsappRoutes |
| Firebase errors | Not initialized | Verify src/config/firebase.ts |
| CORS errors | Different origin | Update CORS in server.ts |
| .env not found | Wrong path | Ensure .env is in backend root |
| Cannot find module | Dependencies missing | Run npm install |

**For detailed troubleshooting**, see: `TESTING_GUIDE.md`

---

## 📚 Documentation Files

1. **WHATSAPP_OTP_SETUP_PROMPT.md** - Complete Claude Code prompt
2. **CLAUDE_CODE_INSTRUCTIONS.md** - How to use Claude Code
3. **SERVER_TS_UPDATE.md** - How to update server.ts
4. **TESTING_GUIDE.md** - Comprehensive testing procedures
5. **COMPLETE_SETUP_CHECKLIST.md** - Step-by-step setup checklist
6. **README_WHATSAPP_OTP.md** - This file

---

## 🚢 Deployment

### Before Deploying to Production

- [ ] WhatsApp template is APPROVED
- [ ] .env file created with production credentials
- [ ] NODE_ENV=production in .env
- [ ] Strong JWT_SECRET (use random generator)
- [ ] HTTPS enabled on frontend and backend
- [ ] CORS configured for production domain
- [ ] Database backups configured
- [ ] Error logging set up
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

### Production Environment Variables

```env
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=prod_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp
JWT_SECRET=strong-random-secret-key
JWT_EXPIRY=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://gutmantra.in
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

- OTP send success rate
- OTP verification success rate
- Average time to verify
- User login success rate
- WhatsApp API error rate
- Attempt limit hits per day
- Rate limit hits per day

### Error Tracking

All errors are logged with context:
```typescript
console.error('Send OTP Error:', error);
console.error('Verify OTP Error:', error);
console.error('WhatsApp API Error:', whatsappError.response?.data);
```

---

## 🔄 Maintenance

### Monthly
- Check WhatsApp template approval status
- Review error logs
- Monitor API usage and costs

### Quarterly
- Audit JWT tokens and secret rotation plan
- Review rate limiting effectiveness
- Update dependencies

### Annually
- Rotate JWT_SECRET (with grace period)
- Review security settings
- Update WhatsApp template if needed

---

## 📞 Support

For issues:

1. Check **TESTING_GUIDE.md** for debugging
2. Review error messages in server logs
3. Check **Firebase Console** for data issues
4. Verify **Meta Developer Console** settings
5. Test endpoints with **curl/Postman**

---

## 📝 License & Credits

This implementation uses:
- **Express.js** - Web framework
- **Axios** - HTTP client for WhatsApp API
- **JWT** - Token generation
- **Firebase Firestore** - Database
- **React** - Frontend framework

---

## ✅ Implementation Status

- [x] Backend routes created
- [x] Utility functions created
- [x] Frontend component created
- [x] Styling created
- [x] Documentation created
- [x] Testing guide created
- [x] Setup checklist created
- [ ] WhatsApp template approval (pending - 24-48 hours)
- [ ] API testing (pending template approval)
- [ ] Frontend testing (pending API)
- [ ] Production deployment (pending testing)

---

## 🎯 Next Steps

1. **Wait for template approval** (24-48 hours from submission)
2. **Create .env file** with actual credentials
3. **Test send-otp endpoint** with curl
4. **Check Firestore** for OTP storage
5. **Test verify-otp endpoint** with actual OTP
6. **Test frontend** login flow
7. **Deploy to production** once verified

---

**Last Updated**: May 22, 2026
**Version**: 1.0 (Initial Release)
**Status**: Ready for Testing (Awaiting Template Approval)
