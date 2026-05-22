# 🎯 GITHUB COPILOT PROMPT - WhatsApp OTP Frontend Integration

**Copy this entire prompt and paste into GitHub Copilot in your VS Code**

---

## Complete Frontend Integration: Meta WhatsApp Business API OTP Authentication

I need to integrate Meta WhatsApp Business API for OTP authentication in my GutMantra React frontend. Replace all existing Firebase OTP authentication with WhatsApp Business API OTP verification.

### PROJECT CONTEXT:

**Tech Stack**: React.js, TypeScript, React Router
**Backend API**: http://localhost:5000 (or production URL)
**Backend Endpoints Available**:
- `POST /api/whatsapp/send-otp` - Takes {phone} → Returns {success, messageId}
- `POST /api/whatsapp/verify-otp` - Takes {phone, otp} → Returns {success, token, user, isNewUser}
- `POST /api/whatsapp/resend-otp` - Takes {phone} → Returns {success, retryAfter}

**Current User Firestore Schema** (maintain exactly):
```
{
  id: string,
  phone: string (will be populated via WhatsApp OTP),
  email: string,
  firstName: string,
  lastName: string,
  address: {
    apartment: string,
    city: string,
    country: string,
    pinCode: string,
    state: string,
    streetAddress: string
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  migrationStatus: string,
  wordpressUserId: string,
  legacyPasswordHash: string,
  verified: boolean (ADD THIS - set to true after OTP verification)
}
```

**ADD TO .env.local**:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WHATSAPP_PHONE_FORMAT=+91
```

---

## REQUIREMENTS:

### PART 1: CREATE NEW LOGIN PAGE WITH WHATSAPP OTP

Create file: `src/pages/LoginPage.tsx`

**Features Required**:
1. **Two-stage login flow**:
   - Stage 1: Phone number entry (9 or 10 digits, auto-format to +91XXXXXXXXXX)
   - Stage 2: OTP entry (6-digit code)

2. **Phone Input Stage**:
   - Accept phone numbers: 9028107111, +919028107111, 91928107111
   - Auto-format to +91XXXXXXXXXX
   - Validate: 10 digits after +91, starts with 6-9
   - Show "Send OTP via WhatsApp" button
   - Call backend `/api/whatsapp/send-otp`
   - Show success: "✓ OTP sent to your WhatsApp"
   - Show error messages if API fails

3. **OTP Entry Stage**:
   - Accept 6-digit OTP only (0-9)
   - Show countdown timer (2 minutes / 120 seconds)
   - Auto-format input to spaces: 123 456 (for readability)
   - Show "Resend OTP" button (disabled first 30 seconds)
   - Show "Change Number" button to go back
   - Call backend `/api/whatsapp/verify-otp`
   - On success:
     - Store JWT token in localStorage with key: "authToken"
     - Store user data in localStorage with key: "userData"
     - Auto-redirect to /dashboard
   - Show error: "Incorrect OTP" with attempts remaining
   - Show error: "Too many attempts - request new OTP"
   - Show error: "OTP expired - request new OTP"

4. **Resend OTP**:
   - Disabled for first 30 seconds
   - Show countdown timer
   - Call `/api/whatsapp/resend-otp`
   - Rate limiting: Show "Please wait Xs" if tried too soon
   - Reset timer and OTP input on resend

5. **UI/UX**:
   - Two-stage flow (phone → OTP)
   - WhatsApp green color scheme (#25D366)
   - WhatsApp icon display
   - Loading states for API calls
   - Error messages in red
   - Success messages in green
   - Mobile-responsive design
   - Smooth animations between stages
   - Clear, user-friendly error messages

6. **State Management**:
   - Current stage (phone or otp)
   - Phone number input
   - OTP input
   - Timer countdown
   - Resend button availability
   - Attempt counter
   - Loading state
   - Error message
   - Success message

7. **Logic**:
   - Phone validation before API call
   - OTP expiry handling (2 minutes)
   - Attempt limit handling (5 max)
   - Rate limit handling (30 seconds between resends)
   - Auto-login after successful OTP
   - Store token with auto-expiry check
   - Redirect non-authenticated users
   - Prevent double submission

---

### PART 2: CREATE LOGIN PAGE STYLING

Create file: `src/pages/LoginPage.css`

**Design Requirements**:
1. **Color Scheme**: WhatsApp green (#25D366), gray backgrounds, white containers
2. **Layout**: Centered card design, max-width 420px
3. **Responsive**: Mobile-first, works on all screen sizes
4. **Elements**:
   - Header with app logo and title
   - Phone input with country code (+91)
   - OTP input with spacing (123 456 format)
   - Timer progress bar
   - Buttons: Send OTP, Verify OTP, Resend, Change Number
   - Error/success alert boxes
   - Loading spinner
5. **Animations**: Fade in/out between stages, smooth transitions
6. **Accessibility**: Focus states, keyboard navigation, clear contrast

---

### PART 3: UPDATE AUTHENTICATION FLOW

**File to Update**: `src/App.tsx` or `src/routes.tsx`

**Changes Required**:
1. Add LoginPage route: `<Route path="/login" element={<LoginPage />} />`
2. Set LoginPage as default/landing page if not authenticated
3. Create auth check function:
   ```typescript
   const isAuthenticated = () => {
     const token = localStorage.getItem('authToken');
     return !!token;
   };
   ```
4. Redirect unauthenticated users to /login
5. Pass token in Authorization header for protected API calls:
   ```typescript
   headers: {
     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
   }
   ```

---

### PART 4: REMOVE FIREBASE OTP

**Actions**:
1. Delete or comment out any Firebase OTP imports
2. Remove Firebase OTP initialization from main.tsx/index.tsx
3. Remove RecaptchaVerifier code if exists
4. Remove any Firebase phone auth code
5. Replace with Meta WhatsApp API calls only

---

### PART 5: DATABASE UPDATE ON VERIFICATION

**Important**: Backend handles database updates, but ensure:

1. **On successful OTP verification, user will have**:
   - phone: "+91XXXXXXXXXX" (set by backend)
   - verified: true (ADD THIS FIELD - backend must set)
   - migrationStatus: "new_whatsapp_signup" or "phone_verified" (for new users)
   - All existing fields maintained (email, firstName, lastName, address, etc.)

2. **Frontend to store in localStorage**:
   ```typescript
   localStorage.setItem('authToken', response.token);
   localStorage.setItem('userData', JSON.stringify(response.user));
   ```

3. **Frontend to use in API calls**:
   ```typescript
   const userData = JSON.parse(localStorage.getItem('userData') || '{}');
   const userPhone = userData.phone; // Now available for future requests
   ```

---

### PART 6: ERROR HANDLING

Handle these scenarios:

1. **Network Errors**: Show "Network error. Please check connection"
2. **API Errors**:
   - 400: "Invalid phone/OTP format"
   - 401: "WhatsApp API error (template not approved yet)"
   - 429: "Too many attempts. Please request new OTP"
   - 500: "Server error. Please try again"
3. **User Errors**:
   - Invalid phone: "Enter valid 10-digit number"
   - Invalid OTP: "OTP must be 6 digits"
   - Wrong OTP: "Incorrect OTP. X attempts remaining"
   - Expired OTP: "OTP expired. Request new one"
4. **Success Messages**:
   - "✓ OTP sent to your WhatsApp"
   - "✓ Resend OTP in 30 seconds"
   - "✓ OTP verified. Logging in..."

---

### PART 7: LOCAL STORAGE MANAGEMENT

Structure:

```javascript
// After successful login
localStorage.setItem('authToken', 'jwt_token_here');
localStorage.setItem('userData', JSON.stringify({
  id: 'user_id',
  phone: '+919028107111',
  firstName: 'Name',
  lastName: 'Surname',
  email: 'email@example.com',
  verified: true
}));

// Before making protected API calls
const token = localStorage.getItem('authToken');
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

// On logout
localStorage.removeItem('authToken');
localStorage.removeItem('userData');
```

---

### PART 8: API INTEGRATION DETAILS

**Backend Endpoint**: `POST /api/whatsapp/send-otp`
```typescript
// Request
{
  phone: "+919028107111"
}

// Response (200)
{
  success: true,
  message: "OTP sent to your WhatsApp",
  messageId: "wamid.xxx..."
}

// Error (400/401)
{
  success: false,
  message: "Invalid phone number / Failed to send OTP",
  error: "details"
}
```

**Backend Endpoint**: `POST /api/whatsapp/verify-otp`
```typescript
// Request
{
  phone: "+919028107111",
  otp: "123456"
}

// Response (200)
{
  success: true,
  message: "OTP verified successfully",
  isNewUser: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "user_doc_id",
    phone: "+919028107111",
    firstName: "Saurabh",
    lastName: "Mishra",
    email: "email@example.com",
    verified: true
  }
}

// Error (400)
{
  success: false,
  message: "Incorrect OTP / OTP expired / Too many attempts",
  attemptsRemaining: 4
}
```

**Backend Endpoint**: `POST /api/whatsapp/resend-otp`
```typescript
// Request
{
  phone: "+919028107111"
}

// Response (200)
{
  success: true,
  message: "New OTP sent to your WhatsApp"
}

// Rate Limited (429)
{
  success: false,
  message: "Please wait before requesting another OTP",
  retryAfter: 25
}
```

---

### PART 9: TYPESCRIPT TYPES

Create `src/types/auth.ts`:

```typescript
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  isNewUser?: boolean;
  error?: string;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  verified?: boolean;
  address?: Address;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Address {
  apartment?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}

export interface OTPError {
  success: false;
  message: string;
  attemptsRemaining?: number;
  retryAfter?: number;
}
```

---

## IMPLEMENTATION ORDER:

1. Create `src/types/auth.ts` with interfaces
2. Create `src/pages/LoginPage.tsx` component
3. Create `src/pages/LoginPage.css` styling
4. Update `src/App.tsx` routing
5. Test phone input validation
6. Test OTP flow with backend
7. Verify localStorage is working
8. Test auto-redirect to dashboard
9. Verify user data is persistent
10. Test error handling

---

## ENVIRONMENT VARIABLES (.env.local):

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WHATSAPP_PHONE_FORMAT=+91
REACT_APP_NODE_ENV=development
```

---

## KEY IMPLEMENTATION NOTES:

⚠️ **Important**:
1. Remove ALL Firebase OTP code (recaptcha, phone auth, etc.)
2. Use Meta WhatsApp API endpoints only
3. Always send phone in +91XXXXXXXXXX format
4. Store JWT token securely (localStorage is basic, use httpOnly cookies in production)
5. Check token before making API calls
6. Handle 401 unauthorized → redirect to login
7. Set verified: true for all OTP-verified users
8. Maintain existing user schema (don't remove any fields)
9. Phone field will be populated by backend after OTP verification
10. Never hardcode API URLs - use .env variables

---

## VERIFICATION CHECKLIST:

After implementation, verify:
- [ ] Phone input accepts various formats and auto-formats to +91XXXXXXXXXX
- [ ] Send OTP button disabled until valid phone entered
- [ ] OTP appears in WhatsApp within seconds
- [ ] OTP input shows 2-minute countdown timer
- [ ] Resend button disabled for first 30 seconds
- [ ] Correct OTP verifies and redirects to dashboard
- [ ] Wrong OTP shows error with attempts remaining
- [ ] 5 wrong attempts locks and forces new OTP request
- [ ] JWT token stored in localStorage
- [ ] User data stored in localStorage
- [ ] Token used in Authorization header for protected routes
- [ ] Logout clears localStorage
- [ ] User with verified: true can access dashboard
- [ ] All error messages are clear and helpful
- [ ] Mobile responsive on all screen sizes
- [ ] No console errors
- [ ] No Firebase OTP code remains

---

## TESTING COMMANDS:

```bash
# Start frontend
npm run dev

# Visit login page
http://localhost:3000/login

# Test phone inputs
9028107111 → should auto-format to +919028107111
+919028107111 → should stay same
919028107111 → should auto-format to +919028107111
8928107111 → should show error (starts with 8)

# Monitor network requests
Open DevTools → Network tab
Check /api/whatsapp/send-otp and /api/whatsapp/verify-otp calls

# Check localStorage
Open DevTools → Application → Local Storage
Verify authToken and userData stored after login
```

---

## SUCCESS CRITERIA:

✅ LoginPage component renders without errors
✅ Phone input validation works correctly
✅ /api/whatsapp/send-otp called on button click
✅ OTP received in WhatsApp
✅ /api/whatsapp/verify-otp called on OTP submit
✅ JWT token received and stored
✅ User auto-logged in after OTP verification
✅ Redirected to /dashboard
✅ Token used in subsequent API calls
✅ verified field is true for user
✅ All error messages are helpful
✅ Rate limiting respected (30s between resends)
✅ Attempt limiting respected (5 max)
✅ No Firebase OTP code in project
✅ Mobile responsive
✅ No console errors

---

**That's everything needed for complete WhatsApp OTP frontend integration!**

Create LoginPage, update routing, test endpoints, and you're done. 🚀
