# WhatsApp OTP Authentication - Complete Setup Checklist

## Phase 1: Meta Developer Console Setup ✓

- [ ] Go to https://developers.facebook.com/
- [ ] Select your GutMantra app
- [ ] Navigate to WhatsApp > Configuration
- [ ] Verify phone number ID: `1108455795690267` is listed and ACTIVE
- [ ] Verify Business Account ID: `1495438322369061`
- [ ] Check that template `gutmantra_otp` exists
- [ ] **CRITICAL**: Wait for template to show "APPROVED" status (24-48 hours)
  - [ ] Status should be in green
  - [ ] If "Pending", check status regularly
  - [ ] If "Rejected", review rejection reason and update template

### Template Details (for reference):
- **Name**: gutmantra_otp
- **Language**: English (en_US)
- **Category**: OTP
- **Body Text**: `Your OTP is: {{1}}`
- **Status**: Must be APPROVED before testing

---

## Phase 2: Backend Files Creation ✓

### Create Utility Files:

- [ ] **Create `src/utils/otpUtils.ts`**
  - Includes: validatePhoneNumber, generateOTP, hashOTP, formatPhoneForWhatsApp
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/backend/src/utils/otpUtils.ts`

- [ ] **Create `src/utils/jwtUtils.ts`**
  - Includes: generateToken, verifyToken, extractTokenFromHeader, authMiddleware
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/backend/src/utils/jwtUtils.ts`

### Create Route File:

- [ ] **Create `src/routes/whatsappRoutes.ts`**
  - POST /api/whatsapp/send-otp
  - POST /api/whatsapp/verify-otp
  - POST /api/whatsapp/resend-otp
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/backend/src/routes/whatsappRoutes.ts`

### Create Config Files:

- [ ] **Create `.env.example`** (template for environment variables)
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/backend/.env.example`

- [ ] **Create actual `.env` file** (DO NOT COMMIT)
  ```
  WHATSAPP_PHONE_ID=1108455795690267
  WHATSAPP_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_HERE
  WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
  WHATSAPP_TEMPLATE_NAME=gutmantra_otp
  JWT_SECRET=generate-a-random-secret-key-here
  JWT_EXPIRY=7d
  NODE_ENV=development
  PORT=5000
  ```

---

## Phase 3: Backend Configuration ✓

### Update Existing Files:

- [ ] **Update `src/server.ts`**
  ```typescript
  // Add import at top
  import whatsappRoutes from './routes/whatsappRoutes';
  
  // Register routes (before other routes)
  app.use('/api/whatsapp', whatsappRoutes);
  ```
  - Reference guide: `/Users/akshadgawde/Desktop/Developer/gut/backend/SERVER_TS_UPDATE.md`

- [ ] **Update `.gitignore`**
  ```
  .env
  .env.local
  .env.*.local
  ```
  - Ensure `.env` is listed to prevent credentials leak

### Install Dependencies:

- [ ] Run: `npm install axios jsonwebtoken`
- [ ] Run: `npm install --save-dev @types/jsonwebtoken` (if using TypeScript)
- [ ] Verify in `package.json`:
  ```json
  {
    "dependencies": {
      "axios": "^1.x.x",
      "jsonwebtoken": "^9.x.x",
      "express": "^4.x.x"
    }
  }
  ```

### Verify Firebase Setup:

- [ ] Firestore database is initialized
- [ ] Check `src/config/firebase.ts` exists and exports `db`
- [ ] Test Firebase connection:
  ```bash
  npm run dev
  # Should see: "✓ Firebase initialized"
  ```

---

## Phase 4: Frontend Implementation ✓

### Create Frontend Components:

- [ ] **Create `src/pages/LoginPage.tsx`**
  - Two-stage OTP flow (phone → OTP)
  - Phone validation
  - OTP timer (2 minutes)
  - Resend button with rate limiting (30 seconds)
  - Auto-login with JWT
  - Error handling
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/frontend/src/pages/LoginPage.tsx`

- [ ] **Create `src/pages/LoginPage.css`**
  - Responsive styling
  - WhatsApp theme colors
  - Mobile-friendly layout
  - Copy from: `/Users/akshadgawde/Desktop/Developer/gut/frontend/src/pages/LoginPage.css`

### Update Frontend Configuration:

- [ ] **Update `.env.local` (Frontend)**
  ```
  REACT_APP_API_URL=http://localhost:5000
  ```
  - Or your production API URL

- [ ] **Update routing** (if using React Router)
  ```typescript
  // In your App.tsx or Routes file
  import LoginPage from './pages/LoginPage';
  
  <Route path="/login" element={<LoginPage />} />
  ```

- [ ] **Remove old Firebase OTP login** (if exists)
  - Delete or comment out Firebase OTP authentication logic
  - Replace with new WhatsApp OTP LoginPage

### Test Frontend Setup:

- [ ] `npm run dev` in frontend directory
- [ ] Visit http://localhost:3000/login
- [ ] See LoginPage component rendering correctly

---

## Phase 5: Database Setup ✓

### Firestore Collections:

- [ ] **Ensure `users` collection exists** with documents containing:
  ```
  {
    id: string (document ID),
    phone: string or null,
    firstName: string or null,
    lastName: string or null,
    email: string or null,
    address: object,
    createdAt: timestamp,
    updatedAt: timestamp,
    migrationStatus: string,
    wordpressUserId: string or null
  }
  ```

- [ ] **Create `otpVerifications` collection** (auto-created by app on first OTP)
  - Will store documents with phone number as key:
  ```
  {
    phone: string (document ID: "+919028107111"),
    otp: string,
    hashedOTP: string,
    createdAt: number (timestamp in ms),
    expiresAt: number (timestamp in ms),
    attempts: number,
    verified: boolean,
    verifiedAt?: number
  }
  ```

- [ ] **Enable TTL cleanup** (optional but recommended)
  - Go to Firestore > otpVerifications > Indexes
  - Create a TTL index on `expiresAt` field to auto-delete expired OTPs

---

## Phase 6: Testing ✓

### Backend Testing:

- [ ] Start backend: `npm run dev`
  - Should see: "✓ Server running on http://localhost:5000"
  - Should see: "✓ WhatsApp API endpoints available at /api/whatsapp"

- [ ] Test health endpoint:
  ```bash
  curl http://localhost:5000/api/health
  # Expected: {"status":"OK","timestamp":"..."}
  ```

### Send OTP Test:

- [ ] Test `/send-otp` endpoint:
  ```bash
  curl -X POST http://localhost:5000/api/whatsapp/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+919028107111"}'
  ```
  - Expected response: `{"success": true, "message": "OTP sent to your WhatsApp"}`
  - Check Firestore for OTP document

- [ ] **IF GETTING 401 ERROR**:
  - Check template status in Meta Console (must be APPROVED)
  - Verify WHATSAPP_ACCESS_TOKEN in .env is correct
  - Verify WHATSAPP_PHONE_ID in .env is correct
  - Confirm phone number is verified in WhatsApp Business Account

### Verify OTP Test:

- [ ] Test `/verify-otp` endpoint:
  ```bash
  curl -X POST http://localhost:5000/api/whatsapp/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+919028107111", "otp": "ACTUAL_OTP_HERE"}'
  ```
  - Expected response: JWT token and user data
  - Check Firestore: verified: true in otpVerifications document
  - Check Firestore: new/updated user in users collection

### Resend OTP Test:

- [ ] Test `/resend-otp` endpoint:
  ```bash
  curl -X POST http://localhost:5000/api/whatsapp/resend-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+919028107111"}'
  ```
  - Should get new OTP sent within 30 seconds window

### Frontend Testing:

- [ ] Start frontend: `npm run dev`
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter your phone number (9028107111)
- [ ] Click "Send OTP via WhatsApp"
- [ ] Check your actual WhatsApp for OTP
- [ ] Enter OTP on frontend
- [ ] Should auto-login and redirect to dashboard
- [ ] Check localStorage:
  ```javascript
  // In browser console
  console.log(localStorage.getItem('authToken'));
  console.log(JSON.parse(localStorage.getItem('userData')));
  ```

### Full End-to-End Test:

- [ ] New user first login
  - Phone not in system
  - Should create new user document
  - Should return JWT token
  - Should redirect to /complete-profile or /dashboard

- [ ] Existing user login
  - Phone already in system
  - Should fetch existing user
  - Should return JWT token
  - Should redirect to /dashboard

---

## Phase 7: Security Review ✓

### Environment Variables:

- [ ] `.env` file exists and is in `.gitignore`
- [ ] Never commit `.env` to git
- [ ] All sensitive tokens are in `.env` only
- [ ] JWT_SECRET is unique and strong
- [ ] WHATSAPP_ACCESS_TOKEN is never logged

### Code Security:

- [ ] OTP is never logged in production
- [ ] Phone numbers are validated before processing
- [ ] Attempt limits prevent brute force (5 attempts max)
- [ ] Rate limiting on resend (30 seconds)
- [ ] JWT tokens have expiry (7 days default)
- [ ] Error messages don't expose sensitive details

### Network Security:

- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] API rate limiting implemented (optional but recommended)
- [ ] Invalid tokens rejected with 401

---

## Phase 8: Deployment Preparation ✓

### Production Checklist:

- [ ] Create production `.env` file with:
  - WHATSAPP_ACCESS_TOKEN (production token)
  - JWT_SECRET (strong, random key)
  - NODE_ENV=production
  - Appropriate REACT_APP_API_URL

- [ ] Update CORS settings for production domain
  ```typescript
  // server.ts
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
  ```

- [ ] Disable debug logging in production
  ```typescript
  // Only log errors in production
  if (process.env.NODE_ENV === 'development') {
    console.log(...);
  }
  ```

- [ ] Update API endpoint in frontend
  ```
  REACT_APP_API_URL=https://your-production-api.com
  ```

- [ ] Test with production WhatsApp phone number
- [ ] Verify WhatsApp template is approved for production
- [ ] Load test with expected traffic

---

## Phase 9: Documentation & Handoff ✓

### Create Documentation:

- [ ] README with setup instructions
- [ ] API documentation with endpoints
- [ ] Error codes and troubleshooting
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures

### Training Materials:

- [ ] How to add new users manually (if needed)
- [ ] How to reset OTP for users
- [ ] How to monitor WhatsApp API usage
- [ ] How to handle common issues

---

## Phase 10: Monitoring & Maintenance ✓

### Set Up Monitoring:

- [ ] Monitor WhatsApp API error rates
- [ ] Monitor JWT token generation/verification
- [ ] Monitor Firestore OTP collection growth
- [ ] Set up alerts for 401/429 errors

### Regular Maintenance:

- [ ] Check WhatsApp template approval status monthly
- [ ] Review and rotate JWT_SECRET annually
- [ ] Clean up old OTP records (auto-deleted by TTL)
- [ ] Monitor API costs and usage

---

## Troubleshooting Quick Reference

| Problem | Check | Solution |
|---------|-------|----------|
| 401 Unauthorized | Template status | Wait for approval or check Meta Console |
| OTP not received | Phone number | Verify number in WhatsApp Business Account |
| Frontend 404 | Route registration | Update server.ts with whatsappRoutes |
| Database errors | Firebase | Verify Firestore is initialized |
| CORS errors | server.ts | Update CORS origin settings |
| Token invalid | JWT_SECRET | Ensure .env has correct secret |

---

## Contact & Support

If you encounter issues:

1. Check the TESTING_GUIDE.md for detailed test procedures
2. Review error messages in server console
3. Check browser DevTools (frontend errors)
4. Check Firestore for data consistency
5. Verify Meta Developer Console settings

---

## Sign-Off Checklist

- [ ] All files created
- [ ] All endpoints tested
- [ ] Frontend component working
- [ ] Database documents created
- [ ] .env file secured
- [ ] Tests passed
- [ ] Ready for production deployment

**Date Completed**: ___________
**Completed By**: ___________
**Notes**: ___________________________________________________

