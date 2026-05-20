# 🔐 BillDesk Setup Checklist - What You Need from BillDesk Team

## Critical Requirements (MUST HAVE)

### 1. ✅ Sandbox Merchant ID & Secret Key
**Status:** You already have this ✅

In `.env`:
```env
BILLDESK_MERCHANT_ID=your_sandbox_merchant_id
BILLDESK_SECRET_KEY=your_64_char_secret_key
```

**Where to get:** BillDesk Sandbox Dashboard → Settings → API Keys

---

### 2. 🔴 **IP WHITELISTING** (CRITICAL!)
**Status:** Likely MISSING ❌

**What it is:**
- BillDesk won't accept callbacks from unknown IPs
- Your backend IP needs to be whitelisted in BillDesk dashboard

**What to do:**
1. **Find your backend's public IP:**
   ```bash
   # If deployed on server
   curl https://api.ipify.org
   
   # If local development
   curl https://api.ipify.org
   ```

2. **Request from BillDesk team:**
   - Email: support@billdesk.com (or your account manager)
   - Subject: "IP Whitelisting Request - Sandbox"
   - Content:
     ```
     Please whitelist the following IP for sandbox:
     - Production IP: xxx.xxx.xxx.xxx
     - Staging IP: xxx.xxx.xxx.xxx (if applicable)
     - Sandbox IP: xxx.xxx.xxx.xxx
     
     Merchant ID: YOUR_MERCHANT_ID
     ```

3. **Why it matters:**
   - Without this, BillDesk callback to `/api/billdesk/callback` will be REJECTED
   - Payment will appear to hang
   - Order won't be created in PetPooja

---

### 3. 🔴 **RETURN URL WHITELISTING** (CRITICAL!)
**Status:** Likely MISSING ❌

**What it is:**
- After payment, BillDesk redirects user back to your website
- This URL must be whitelisted in BillDesk dashboard

**What to do:**
1. **Identify your return URLs:**
   ```
   Sandbox: https://api.sandbox.gutmantra.in/api/billdesk/callback
   (OR)
   Development: http://localhost:5000/api/billdesk/callback
   
   Production: https://api.gutmantra.in/api/billdesk/callback
   ```

2. **Request from BillDesk team:**
   - Email: support@billdesk.com
   - Subject: "Return URL Whitelisting Request"
   - Content:
     ```
     Please whitelist the following return URLs:
     
     SANDBOX:
     - Callback URL: https://api.sandbox.gutmantra.in/api/billdesk/callback
     - Return URL: https://gutmantra.in/payment-processing?orderId={orderId}
     
     PRODUCTION:
     - Callback URL: https://api.gutmantra.in/api/billdesk/callback
     - Return URL: https://gutmantra.in/payment-processing?orderId={orderId}
     
     Merchant ID: YOUR_MERCHANT_ID
     ```

3. **Why it matters:**
   - User won't be redirected back after payment
   - User will be stuck on BillDesk page
   - Frontend won't know payment status

---

### 4. 🟠 **SSL/HTTPS Certificate** (HIGH PRIORITY)
**Status:** For production only

**Requirement:**
- All URLs must use HTTPS (not HTTP)
- Self-signed certs don't work - must be valid SSL

**Current status:**
```
✅ Sandbox: Can use HTTP (https://pguat.billdesk.io)
❌ Production: MUST use HTTPS
```

**What to do:**
1. Get SSL certificate (Let's Encrypt is free)
2. Configure on your server
3. Update `.env` URLs to use HTTPS

---

## Secondary Requirements (NICE TO HAVE)

### 5. Test Credentials for Sandbox
**What it is:** Test card numbers for BillDesk sandbox

**Request from BillDesk:**
- Email: support@billdesk.com
- Subject: "Sandbox Test Credentials"

**You'll get:**
```
✅ Test Card: 4111 1111 1111 1111
✅ Test UPI: success@billdesk
✅ Test OTP: Any 6 digits
✅ Test Expiry: Any future date
```

---

### 6. Webhook Signature Validation
**What it is:** How to verify callbacks are really from BillDesk

**Current status:** ✅ Already implemented in your code!

```typescript
// verifyBilldesk.ts validates signature
const signature = createBillDeskSignature(encoded);
if (generated !== expectedSignature) {
  // Reject callback
}
```

**No action needed** - your code already does this.

---

### 7. Amount Validation
**Current status:** ✅ Already implemented!

```typescript
// money.ts - Safe integer comparison
const expectedMoney = Money.fromRupees(expectedAmount);
const callbackMoney = Money.fromRupees(callbackAmount);
if (!expectedMoney.equals(callbackMoney)) {
  // Reject payment - amount tampered
}
```

**No action needed** - protected against tampering.

---

## Quick Setup Timeline

```
DAY 1:
[ ] Email BillDesk team with IP whitelisting request
[ ] Email BillDesk team with return URL whitelisting request
[ ] Request test credentials

DAY 2-3:
[ ] Receive whitelisting approval from BillDesk
[ ] Receive test credentials
[ ] Test in sandbox

DAY 4-5:
[ ] Setup SSL certificate
[ ] Configure production URLs
[ ] Deploy to production

DAY 6:
[ ] Live payment testing
```

---

## Email Template for BillDesk Team

**Subject:** API Setup Requirements - Merchant Integration

**Content:**
```
Hello,

We're integrating BillDesk payment gateway into our food ordering platform (GutMantra).

Merchant ID: [YOUR_MERCHANT_ID]

We need the following for sandbox and production:

1. IP WHITELISTING
   - Sandbox API Server IP: xxx.xxx.xxx.xxx
   - Production API Server IP: xxx.xxx.xxx.xxx
   
2. RETURN URL WHITELISTING
   - Sandbox Callback: https://api.sandbox.gutmantra.in/api/billdesk/callback
   - Production Callback: https://api.gutmantra.in/api/billdesk/callback

3. TEST CREDENTIALS
   - Test card numbers for sandbox
   - Test UPI IDs for sandbox
   - Test OTPs if required

4. DOCUMENTATION
   - Current callback status codes (success/failure)
   - Required headers for requests
   - Signature verification examples

Please let me know the timeline for these approvals.

Thanks,
[Your Name]
[Your Email]
[Contact Number]
```

---

## Current Sandbox vs Production Setup

| Item | Sandbox | Production |
|------|---------|-----------|
| **Merchant ID** | Provided ✅ | Request separately |
| **Secret Key** | Provided ✅ | Request separately |
| **IP Whitelisting** | Needed ❌ | Needed ❌ |
| **Return URL** | Needed ❌ | Needed ❌ |
| **SSL Certificate** | Optional | Required ✅ |
| **Test Cards** | Request | N/A |
| **Production Cards** | N/A | Works automatically |

---

## Troubleshooting Callbacks

If callbacks aren't working, it's usually:

### 1. ❌ IP Not Whitelisted
**Symptom:** Callback never arrives at `/api/billdesk/callback`
**Fix:** Request IP whitelisting from BillDesk

**Debug:**
```bash
# Check if endpoint is reachable
curl -X POST https://api.gutmantra.in/api/billdesk/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=true"

# Should return: INVALID_BILLDESK_CALLBACK (good, server is up)
# Connection refused = server down or IP blocked
```

### 2. ❌ Return URL Not Whitelisted
**Symptom:** User redirected to error page after payment
**Fix:** Request return URL whitelisting from BillDesk

### 3. ❌ Signature Verification Failed
**Symptom:** `Checkout error: INVALID_BILLDESK_CALLBACK`
**Fix:** Verify `BILLDESK_SECRET_KEY` matches exactly

```bash
# Check your secret key
echo $BILLDESK_SECRET_KEY
# Should be 64+ characters
```

### 4. ❌ Status Not Recognized
**Symptom:** Payment succeeds but order not created
**Symptom:** Log shows "Invalid callback payload"
**Fix:** Check BillDesk response status codes

**Common success codes:**
```
✅ "0300" - Success
✅ "SUCCESS" - Success
✅ "TXN_SUCCESS" - Success

❌ "FAIL" - Failed
❌ "CANCEL" - Cancelled
```

---

## Before You Go Live

### Sandbox Checklist:
```
[ ] IP whitelisted for sandbox
[ ] Callback endpoint returns "OK"
[ ] Return URL whitelisted
[ ] Test payment flow end-to-end
[ ] Order appears in PetPooja
[ ] Status updates in Firestore
[ ] Frontend shows success page
[ ] Error handling works for failures
```

### Production Checklist:
```
[ ] Different Merchant ID obtained for production
[ ] Production Secret Key obtained
[ ] Production IP whitelisted
[ ] Production return URLs whitelisted
[ ] SSL certificate installed
[ ] All URLs updated in .env
[ ] Tested with real payment (small amount)
[ ] Monitoring/logging configured
[ ] Support contact ready
```

---

## Contact Details Template

**For quick reference, save these:**

```
BillDesk Support:
- Email: support@billdesk.com
- Phone: +91-XXXXXX-XXXXX
- Dashboard: https://pguat.billdesk.io (sandbox)
- Dashboard: https://pg.billdesk.io (production)

Your Merchant Details:
- Merchant ID: [YOUR_ID]
- Account Manager: [IF ANY]
- Support Email: [YOUR_SUPPORT]
```

---

## Next Steps

1. **TODAY:** Send emails to BillDesk for IP & return URL whitelisting
2. **TOMORROW:** Rebuild backend, test locally
3. **WITHIN 2-3 DAYS:** Receive approvals from BillDesk
4. **SANDBOX TEST:** Full payment flow testing
5. **PRODUCTION:** Deploy with updated config

---

**Status:** 🟠 PARTIALLY READY
- ✅ Code is fixed
- ❌ BillDesk setup incomplete
- ⏳ Waiting for BillDesk approvals

**You can test locally once you rebuild, but callbacks won't work until IP is whitelisted.**

