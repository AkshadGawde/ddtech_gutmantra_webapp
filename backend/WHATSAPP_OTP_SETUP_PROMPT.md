# WhatsApp Business API OTP Authentication Setup - Claude Code Prompt

Copy and paste this entire prompt into Claude Code:

---

## Complete WhatsApp Business API OTP Authentication Implementation

I need to implement a complete WhatsApp Business API OTP authentication system for my GutMantra food ordering platform. Replace Firebase OTP with Meta WhatsApp Business API for sending and verifying OTPs.

### Requirements:
1. **Backend Setup:**
   - Create `.env.example` file with WhatsApp Business API credentials template
   - Create `src/utils/otpUtils.ts` with phone validation, OTP generation, and hashing utilities
   - Create `src/utils/jwtUtils.ts` with JWT token generation, verification, and auth middleware
   - Create `src/routes/whatsappRoutes.ts` with three endpoints:
     - `POST /api/whatsapp/send-otp` - Generates OTP and sends via WhatsApp template
     - `POST /api/whatsapp/verify-otp` - Verifies OTP and auto-logs in user with JWT
     - `POST /api/whatsapp/resend-otp` - Resends OTP with rate limiting
   - Update `src/server.ts` to register whatsappRoutes at `/api/whatsapp`
   - Verify Firebase Firestore connection is working

2. **Database Schema:**
   - Create `otpVerifications` collection in Firestore with structure:
     ```
     {
       phone: string,
       otp: string,
       hashedOTP: string,
       createdAt: timestamp,
       expiresAt: timestamp,
       attempts: number,
       verified: boolean,
       verifiedAt: timestamp (optional)
     }
     ```
   - Update existing `users` collection:
     - Add phone field if not exists
     - Add migrationStatus field for tracking new WhatsApp signups
     - Keep existing fields: firstName, lastName, email, address, createdAt, updatedAt

3. **Frontend Implementation:**
   - Create `src/pages/LoginPage.tsx` with two-stage OTP flow:
     - Stage 1: Phone number input with validation (+91XXXXXXXXXX format)
     - Stage 2: 6-digit OTP input with timer (2 minutes)
     - Show "Resend OTP" button after 30 seconds
     - Auto-login after OTP verification
     - Handle errors gracefully with user-friendly messages
     - Show WhatsApp icon during OTP delivery
     - Store JWT token in localStorage after verification
     - Redirect to dashboard on success

4. **Key Features:**
   - Phone number validation (Indian: +91XXXXXXXXXX)
   - 6-digit OTP generation
   - 10-minute OTP expiry
   - 5-attempt maximum before lockout
   - 30-second rate limiting on resends
   - JWT auto-login (7-day expiry by default)
   - New user auto-creation on first login
   - Error handling for all edge cases
   - WhatsApp API error logging (without exposing sensitive data)

5. **Environment Variables Required:**
   - WHATSAPP_PHONE_ID=1108455795690267
   - WHATSAPP_ACCESS_TOKEN=your_token_here
   - WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
   - WHATSAPP_TEMPLATE_NAME=gutmantra_otp
   - JWT_SECRET=your-secret-key
   - JWT_EXPIRY=7d
   - Must add .env to .gitignore

6. **Dependencies to Install:**
   - axios (if not already installed) - for WhatsApp API calls
   - jsonwebtoken - for JWT token generation
   - dotenv - for environment variables

7. **Backend Code Structure:**
   - Use TypeScript with proper interfaces
   - Implement proper error handling
   - Log all WhatsApp API errors for debugging
   - Use Firestore collections for OTP storage
   - Return consistent JSON responses
   - Set proper HTTP status codes

8. **Frontend Code Structure:**
   - Use React hooks (useState, useEffect)
   - Implement phone number formatting on input
   - Show OTP timer countdown (2 minutes)
   - Validate OTP format before submission
   - Store token in localStorage with key: "authToken"
   - Store user data in localStorage with key: "userData"
   - Handle network errors gracefully
   - Show loading states during API calls

9. **Integration Points:**
   - Make sure whatsappRoutes are registered BEFORE other routes in server.ts
   - Ensure Firebase is already initialized in your config
   - Update any existing auth guards to check for JWT token
   - Remove any Firebase OTP dependencies from frontend login
   - Ensure CORS is configured if frontend and backend are on different origins

10. **Security Considerations:**
    - Never log OTP values in production
    - Keep WHATSAPP_ACCESS_TOKEN secret in .env, never commit to git
    - JWT tokens are httpOnly (secure) when sent as cookies
    - Implement rate limiting on OTP send endpoint (already included: 30s between resends)
    - Phone numbers are stored in lowercase for consistency
    - OTP hashing using SHA256 for audit trail

### Current User Firestore Structure:
The existing users collection has these fields:
- firstName, lastName, email, phone (currently null)
- address (object), streetAddress, city, state, country, pinCode
- createdAt, updatedAt
- legacyPasswordHash, wordpressUserId, migrationStatus

### Implementation Order:
1. First: Create utility files (otpUtils.ts, jwtUtils.ts)
2. Second: Create .env.example file
3. Third: Create whatsappRoutes.ts
4. Fourth: Update server.ts to register routes
5. Fifth: Create LoginPage.tsx component
6. Sixth: Test endpoints with Postman/curl

### Test Instructions:
After implementation:
1. Ensure .env file is created with actual WhatsApp credentials
2. Ensure WhatsApp template "gutmantra_otp" is APPROVED in Meta Developer Console
3. Test send-otp endpoint: `POST /api/whatsapp/send-otp` with `{"phone": "+919028107111"}`
4. Check Firestore for OTP storage
5. Test verify-otp endpoint: `POST /api/whatsapp/verify-otp` with `{"phone": "+919028107111", "otp": "123456"}`
6. Verify JWT token is returned
7. Test frontend LoginPage with actual phone number
8. Verify auto-login and redirect to dashboard

### Notes:
- Wait for WhatsApp template approval (24-48 hours) before testing live
- Use a valid Indian phone number for testing (you can use your own)
- Check WhatsApp Business Account settings to ensure phone is verified
- If you get 401 errors, verify: template approved, access token valid, phone verified
- All timestamps use milliseconds (Date.now())

---

**After Claude Code completes all files, manually:**
1. Create `.env` file (copy from `.env.example` and fill in actual credentials)
2. Run `npm install axios jsonwebtoken` if not already installed
3. Add `.env` to `.gitignore`
4. Test the endpoints using provided curl/Postman commands
5. Update your frontend navigation to use the new LoginPage component
