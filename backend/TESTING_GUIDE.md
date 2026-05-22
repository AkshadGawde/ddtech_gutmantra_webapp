# WhatsApp OTP Authentication - Testing Guide

## Pre-Testing Checklist

Before testing the API endpoints, ensure:

- [ ] `.env` file created with valid WhatsApp credentials
- [ ] WhatsApp template "gutmantra_otp" is **APPROVED** in Meta Developer Console
- [ ] All files created: whatsappRoutes.ts, otpUtils.ts, jwtUtils.ts
- [ ] server.ts updated with whatsappRoutes import and registration
- [ ] Dependencies installed: `npm install axios jsonwebtoken`
- [ ] Firebase Firestore is initialized and accessible
- [ ] Backend server is running on port 5000

## Test 1: Verify Server is Running

```bash
curl http://localhost:5000/api/health

# Expected Response:
# {"status":"OK","timestamp":"2026-05-22T..."}
```

## Test 2: Send OTP Endpoint

### Using curl:

```bash
curl -X POST http://localhost:5000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919028107111"
  }'
```

### Using Postman:
1. Create new POST request
2. URL: `http://localhost:5000/api/whatsapp/send-otp`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "phone": "+919028107111"
   }
   ```

### Expected Success Response (200):
```json
{
  "success": true,
  "message": "OTP sent to your WhatsApp",
  "messageId": "wamid.xxx..."
}
```

### Expected Error Responses:

**Invalid phone format (400):**
```json
{
  "success": false,
  "message": "Invalid phone number. Use format: +91XXXXXXXXXX"
}
```

**WhatsApp template not approved (401):**
```json
{
  "success": false,
  "message": "Failed to send OTP via WhatsApp. Please try again.",
  "error": "Authentication Error"
}
```

### Verification in Firestore:
1. Open Firebase Console
2. Go to Firestore Database
3. Check `otpVerifications` collection
4. You should see a document with key `+919028107111` containing:
   - otp: 6-digit number
   - createdAt: timestamp
   - expiresAt: timestamp (10 minutes later)
   - attempts: 0
   - verified: false

## Test 3: Verify OTP Endpoint

After sending OTP, immediately test verification:

### Using curl:

```bash
curl -X POST http://localhost:5000/api/whatsapp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919028107111",
    "otp": "123456"
  }'
```

### Expected Success Response (200):
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

### Expected Error Responses:

**Incorrect OTP (400):**
```json
{
  "success": false,
  "message": "Incorrect OTP. Please try again.",
  "attemptsRemaining": 4
}
```

**OTP Expired (400):**
```json
{
  "success": false,
  "message": "OTP expired. Please request a new one."
}
```

**Too many attempts (429):**
```json
{
  "success": false,
  "message": "Too many incorrect attempts. Please request a new OTP."
}
```

### Verification in Firestore:
After successful verification:
1. Document in `otpVerifications` will have `verified: true`
2. New user document created in `users` collection with phone number
3. You should receive a JWT token in response

## Test 4: Resend OTP Endpoint

### Using curl:

```bash
curl -X POST http://localhost:5000/api/whatsapp/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919028107111"
  }'
```

### Expected Success Response (200):
```json
{
  "success": true,
  "message": "New OTP sent to your WhatsApp"
}
```

### Expected Error Response - Rate Limited (429):
```json
{
  "success": false,
  "message": "Please wait before requesting another OTP",
  "retryAfter": 25
}
```

## Test 5: Phone Number Validation

Test various phone number formats to ensure validation works:

### Valid Formats (should work):
- `+919028107111` ✓
- `919028107111` ✓
- `9028107111` ✓
- `+91-9028107111` ✓

### Invalid Formats (should fail):
- `9028107111` (missing 1 digit) ✗
- `+919028107111111` (too many digits) ✗
- `8928107111` (starts with 8) ✗
- `+14155552671` (US number) ✗
- `abc1234567` (non-numeric) ✗

## Test 6: OTP Expiry

1. Send OTP
2. Wait 10 minutes
3. Try to verify - should fail with "OTP expired" message
4. Check Firestore - OTP document should be deleted

## Test 7: Attempt Limits

1. Send OTP
2. Try to verify with wrong OTP 5 times
3. On 6th attempt should get "Too many attempts" (429)
4. Check Firestore - OTP document should be deleted

## Test 8: JWT Token Verification

After successful OTP verification, you'll get a JWT token:

```bash
# Extract and decode the token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Verify it in https://jwt.io or using Node.js:
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.decode('$TOKEN'))"

# Expected payload:
# {
#   "userId": "document_id",
#   "phone": "+919028107111",
#   "iat": 1716379200000,
#   "exp": ...
# }
```

## Test 9: Protected Routes (Using JWT)

Once you have a token, use it to access protected routes:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Test 10: Frontend Integration

1. Navigate to `http://localhost:3000/login` (or your frontend URL)
2. Enter phone number: 9028107111
3. Click "Send OTP via WhatsApp"
4. Check your actual WhatsApp for OTP
5. Enter OTP on frontend
6. Should auto-login and redirect to dashboard
7. Check localStorage for token and userData

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized from WhatsApp | Template not approved | Wait for Meta approval or check template status in Developer Console |
| Template not approved | Template pending review | Check template status in Configuration section |
| Invalid phone error | Wrong format | Use +91XXXXXXXXXX format with correct digits |
| OTP not received on WhatsApp | Phone number not verified | Verify phone number in WhatsApp Business Account settings |
| Firestore errors | Firebase not initialized | Check firebase/config.ts initialization |
| TypeError: db is not defined | Missing Firebase import | Add `import { db } from '../config/firebase'` to whatsappRoutes.ts |
| Timeout errors | Server not running | Start backend: `npm run dev` |
| CORS errors | Cross-origin issue | Update CORS settings in server.ts or use proxy |
| Token verification fails | Secret mismatch | Ensure JWT_SECRET in .env matches in jwtUtils.ts |

## Performance Testing

Test with multiple requests to ensure rate limiting works:

```bash
# Rapid resend attempts (should be rate limited)
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/whatsapp/resend-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+919028107111"}'
  sleep 1
done

# Only 1st request should succeed, others get 429
```

## Debugging Tips

### Enable Debug Logging:
```typescript
// In whatsappRoutes.ts
console.log('Send OTP called with:', phone);
console.log('WhatsApp API Response:', response.data);
console.log('Firestore OTP stored:', otpData);
```

### Check Firestore in Real-time:
1. Open Firebase Console
2. Select your project
3. Go to Firestore Database
4. Watch otpVerifications collection during test
5. Should see documents created/updated/deleted in real-time

### Monitor WhatsApp API:
1. Go to Meta Business Suite
2. System User > Logs
3. Look for API calls to /messages endpoint
4. Check for error details

### Check Server Logs:
```bash
# If using nodemon
npm run dev

# Watch for console.error() and console.log() output
```

## Success Criteria

- [ ] All endpoints return 200 on success
- [ ] OTP is stored in Firestore with 10-minute expiry
- [ ] JWT token is generated and can be verified
- [ ] User is created in users collection on first login
- [ ] Phone number validation works correctly
- [ ] Rate limiting works (30 seconds between resends)
- [ ] Attempt limiting works (5 attempts max)
- [ ] Frontend receives and stores token correctly
- [ ] Auto-login redirects to dashboard
- [ ] Error messages are user-friendly
