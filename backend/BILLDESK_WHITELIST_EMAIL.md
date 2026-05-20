# 📧 Email to BillDesk - IP & Return URL Whitelisting

## Email #1: Production Setup Request

---

**To:** support@billdesk.com  
**CC:** (your account manager if you have one)  
**Subject:** IP Whitelisting & Return URL Configuration Request - GutMantra Merchant

---

### Email Body:

```
Dear BillDesk Team,

I hope this email finds you well.

We are integrating BillDesk payment gateway into our food ordering platform - GutMantra 
(https://gutmantra.in). We need to whitelist our API server IP address and callback URL 
for production environment.

MERCHANT DETAILS:
- Merchant ID: [YOUR_MERCHANT_ID]
- Platform: Food Ordering & Delivery
- Environment: Production

WHITELISTING REQUESTS:

1. SERVER IP WHITELISTING (PRODUCTION)
   - Server IP Address: 204.236.218.85
   - Server Location: AWS
   - Environment: Production
   - Purpose: Payment callback reception

2. RETURN URL WHITELISTING (PRODUCTION)
   - Callback URL: https://api.gutmantra.in/api/billdesk/callback
   - HTTP Method: POST
   - Purpose: Payment status callback from BillDesk
   - Environment: Production

IMPLEMENTATION DETAILS:
- We are using BillDesk Payment Gateway v1.2
- Callback endpoint accepts POST requests with order status data
- Signature verification: HMAC-SHA256
- Expected response: Plain text "OK"

TIMELINE:
We plan to go live with payments in the next 5-7 days. Could you please prioritize 
this whitelisting request and confirm once it's done?

Please confirm:
1. Receipt of this request
2. Timeline for whitelisting approval
3. Any additional information you need from us

You can reach me at:
- Email: gawdeakshad@gmail.com
- Phone: [YOUR_PHONE_NUMBER]

Looking forward to your prompt response.

Best regards,
Akshad Gawde
GutMantra - Food Ordering Platform
https://gutmantra.in
```

---

## Email #2: Sandbox Testing (Send This in Parallel)

---

**To:** support@billdesk.com  
**Subject:** Sandbox Setup Request - Test Credentials & Whitelisting

---

### Email Body:

```
Dear BillDesk Team,

Additionally, for our sandbox testing before production deployment, we need:

SANDBOX WHITELISTING:

1. SANDBOX IP WHITELISTING
   - Server IP Address: 204.236.218.85 (same server, different environment)
   - Environment: Sandbox/Testing
   - Purpose: Testing payment callbacks

2. SANDBOX RETURN URL WHITELISTING
   - Callback URL: https://api.gutmantra.in/api/billdesk/callback
   - Environment: Sandbox
   - Purpose: Receive test payment callbacks

SANDBOX TEST CREDENTIALS:
Please provide test credentials for sandbox testing:
- Test Card Number(s)
- Test UPI ID(s)
- Test OTP (if applicable)
- Expiry date for test cards

INTEGRATION DETAILS:
- We will be testing complete payment flow:
  * Order creation
  * Payment initiation
  * Payment completion/failure scenarios
  * Callback handling
  * Order synchronization

Timeline: We'd like to start sandbox testing immediately.

Please provide test credentials and confirm whitelisting status.

Thank you,
Akshad Gawde
GutMantra
gawdeakshad@gmail.com
```

---

## Email #3: Follow-up (If No Response in 24 Hours)

---

**To:** support@billdesk.com  
**Subject:** URGENT - IP Whitelisting Request (Merchant ID: [YOUR_ID])

---

### Email Body:

```
Dear BillDesk Support Team,

I sent a whitelisting request 24 hours ago (Date/Time) with the following details:

Server IP: 204.236.218.85
Callback URL: https://api.gutmantra.in/api/billdesk/callback
Merchant ID: [YOUR_MERCHANT_ID]

We are on a time-sensitive deployment schedule and would appreciate 
an urgent response or confirmation of receipt.

Could you please:
1. Confirm receipt of the previous request
2. Provide expected timeline for approval
3. Let me know if any additional information is needed

Contact: gawdeakshad@gmail.com

Thank you,
Akshad Gawde
```

---

## Quick Copy-Paste Version (Minimal)

If you prefer shorter version:

```
Subject: IP & URL Whitelisting Request - GutMantra Merchant

Hi,

Please whitelist the following for production:

IP Address: 204.236.218.85
Callback URL: https://api.gutmantra.in/api/billdesk/callback

Merchant ID: [YOUR_ID]

Also, please provide sandbox test credentials.

Timeline: ASAP

Thanks,
Akshad Gawde
gawdeakshad@gmail.com
```

---

## Things to Remember:

✅ **DO:**
- [ ] Replace [YOUR_MERCHANT_ID] with your actual merchant ID
- [ ] Replace [YOUR_PHONE_NUMBER] with your actual phone
- [ ] Keep IP address as: **204.236.218.85**
- [ ] Keep callback URL as: **https://api.gutmantra.in/api/billdesk/callback**
- [ ] Send from professional email
- [ ] Follow up if no response in 24-48 hours
- [ ] Save their response (you'll need secret key and merchant ID confirmation)

❌ **DON'T:**
- Don't include sensitive data (secret keys, passwords)
- Don't change the IP or URL format
- Don't send from personal email if possible
- Don't send same email multiple times (wait 24-48 hours first)

---

## Alternative Contacts:

If support@billdesk.com is slow, try:
- **Phone:** Check BillDesk website for support number
- **Account Manager:** If you have one assigned
- **Sales Team:** If you signed up through sales
- **Partner Support:** If you're integrating via a partner

---

## What to Expect:

**Response Timeline:**
- 🟢 Best: Same day response (2-4 hours)
- 🟡 Normal: 24 hours response
- 🔴 Slow: 24-48 hours
- ⏰ Follow up after 48 hours if no response

**What They'll Send Back:**
```
"Your IP 204.236.218.85 has been whitelisted.
Your return URL https://api.gutmantra.in/api/billdesk/callback 
has been whitelisted.

Test credentials:
Card: 4111 1111 1111 1111
UPI: success@billdesk
OTP: Any 6 digits"
```

---

## After Whitelisting is Done:

Once you get approval from BillDesk:

```
✅ Rebuild backend: npm run build && npm run dev
✅ Test payment flow end-to-end
✅ Order should appear in PetPooja on successful payment
✅ Order should NOT appear on failed payment
✅ Frontend should show success page
```

---

**Ready to send? Copy the first email and customize with your details!** 📧

