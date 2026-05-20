# 📧 Email to BillDesk - Copy & Send This

---

## Email 1: IP Whitelisting + Return URL Setup

**To:** support@billdesk.com  
**CC:** your-email@gutmantra.in  
**Subject:** Urgent: IP Whitelisting & Return URL Configuration Required - GutMantra (Merchant ID: YOUR_MERCHANT_ID)

---

### Email Body:

```
Hello BillDesk Support Team,

I hope this email finds you well. 

We are integrating BillDesk payment gateway into our food ordering platform 
"GutMantra" (https://gutmantra.in) and need urgent assistance with IP 
whitelisting and return URL configuration for both sandbox and production 
environments.

═══════════════════════════════════════════════════════════════════════════

1. MERCHANT ACCOUNT DETAILS
───────────────────────────
Merchant Name: GutMantra (Food Ordering Platform)
Merchant ID: [YOUR_MERCHANT_ID_HERE]
Website: https://gutmantra.in
Primary Contact: [YOUR_NAME]
Email: [YOUR_EMAIL]
Phone: [YOUR_PHONE]

═══════════════════════════════════════════════════════════════════════════

2. IP WHITELISTING REQUEST (CRITICAL)
──────────────────────────────────────

Please whitelist the following IP addresses for payment callback processing:

🔹 PRODUCTION IP:
   IP Address: 204.236.218.85
   Server Location: AWS
   Purpose: Payment callback endpoint
   Environment: Production

🔹 SANDBOX IP (if different):
   IP Address: 204.236.218.85
   Server Location: AWS
   Purpose: Testing & integration
   Environment: Sandbox

═══════════════════════════════════════════════════════════════════════════

3. RETURN URL WHITELISTING REQUEST (CRITICAL)
──────────────────────────────────────────────

Please whitelist the following URLs for payment callbacks and redirects:

🔹 PRODUCTION CALLBACK URL:
   URL: https://api.gutmantra.in/api/billdesk/callback
   Method: POST
   Purpose: Receive payment status from BillDesk
   Environment: Production

🔹 PRODUCTION RETURN URL:
   URL: https://gutmantra.in/payment-processing
   Method: GET (with orderId parameter)
   Purpose: User redirect after payment completion
   Environment: Production

🔹 SANDBOX CALLBACK URL (for testing):
   URL: https://api.gutmantra.in/api/billdesk/callback
   Method: POST
   Purpose: Testing payment callbacks
   Environment: Sandbox

═══════════════════════════════════════════════════════════════════════════

4. IMPLEMENTATION DETAILS
──────────────────────────

API Version: BillDesk ve1_2
Integration Type: Server-to-Server (S2S) with form POST
Payment Methods: UPI, Card, Netbanking
Use Case: Food ordering platform with real-time order sync
Expected Monthly Volume: [Estimated number of transactions]

═══════════════════════════════════════════════════════════════════════════

5. WHAT WE'VE ALREADY CONFIGURED
─────────────────────────────────

✅ Signature Verification: HMAC-SHA256
✅ Rdata Encoding: Base64 with signature
✅ Amount Validation: Integer-based comparison (safe)
✅ Transaction Token: Generated and stored
✅ Callback Processing: Async with full logging
✅ Error Handling: Comprehensive error management
✅ Security: Input validation on all fields

═══════════════════════════════════════════════════════════════════════════

6. NEXT STEPS
──────────────

Once whitelisting is approved:
1. We'll test payment flow in sandbox
2. Conduct full end-to-end testing
3. Verify callback delivery
4. Confirm production readiness

═══════════════════════════════════════════════════════════════════════════

7. REFERENCE INFORMATION
─────────────────────────

Our API Endpoint Structure:
- Order Creation: POST /api/create-order
- Payment Init: POST /api/create-online-order
- Callback Handler: POST /api/billdesk/callback
- Status Query: GET /api/order-status/{orderId}

Base URL: https://api.gutmantra.in

═══════════════════════════════════════════════════════════════════════════

Please confirm receipt of this email and provide:
1. Expected timeline for IP whitelisting approval
2. Expected timeline for return URL whitelisting approval
3. Test credentials for sandbox environment (if not already provided)
4. Sandbox merchant ID (if different from production)
5. Any additional documentation or setup required

I'm available for any clarifications or additional information needed.

Thank you for your urgent assistance with this integration.

Best regards,

[YOUR_FULL_NAME]
[YOUR_TITLE]
GutMantra
Email: [YOUR_EMAIL]
Phone: [YOUR_PHONE]
Website: https://gutmantra.in

───────────────────────────────────────────────────────────────────────────
```

---

## Email 2: Follow-up (if no response in 24 hours)

**To:** support@billdesk.com  
**Subject:** URGENT FOLLOW-UP: IP Whitelisting Required - GutMantra (Merchant ID: YOUR_MERCHANT_ID)

```
Hello BillDesk Team,

This is a follow-up to my previous email regarding IP whitelisting and return 
URL configuration for our GutMantra payment integration.

We are ready to go live and need these approvals urgently:

⚠️ CRITICAL REQUIREMENTS:
─────────────────────────
1. IP Address 204.236.218.85 must be whitelisted
2. Return URL https://api.gutmantra.in/api/billdesk/callback must be whitelisted
3. Test credentials for sandbox testing

Could you please prioritize this request and confirm the timeline?

If there are any issues or additional information needed, please reply immediately.

Thank you,
[YOUR_NAME]
[YOUR_PHONE]
```

---

## Email 3: Request for Test Credentials

**To:** support@billdesk.com  
**Subject:** Test Credentials for Sandbox - GutMantra Integration

```
Hello,

Could you also provide test credentials for sandbox payment testing?

Please share:
✅ Test Credit Card Number
✅ Test Debit Card Number (if available)
✅ Test UPI ID
✅ Test Expiry Date (for cards)
✅ Test OTP (if required)
✅ Any other test account credentials

This will help us validate the integration before going live.

Thanks,
[YOUR_NAME]
```

---

## 📋 Before Sending - Fill in These Blanks:

Replace these in the email:

| Placeholder | Your Value |
|-------------|-----------|
| `[YOUR_MERCHANT_ID_HERE]` | Your BillDesk Merchant ID |
| `[YOUR_NAME]` | Your full name |
| `[YOUR_EMAIL]` | Your email address |
| `[YOUR_PHONE]` | Your phone number |
| `[YOUR_TITLE]` | Your job title (e.g., CTO, Tech Lead) |
| `[Estimated number of transactions]` | Expected monthly transaction volume |

---

## 📧 Quick Copy-Paste Ready Version

If you want just the essential info (shorter version):

```
Subject: IP Whitelisting & Return URL Setup - GutMantra

Hi BillDesk Team,

We're integrating BillDesk for our food ordering platform GutMantra.

Please whitelist:

PRODUCTION IP:
204.236.218.85

RETURN URL:
https://api.gutmantra.in/api/billdesk/callback

Merchant ID: [YOUR_MERCHANT_ID]

Also, please provide test credentials for sandbox.

Thanks,
[YOUR_NAME]
[YOUR_EMAIL]
[YOUR_PHONE]
```

---

## ✅ Checklist Before Sending:

- [ ] Replaced all `[PLACEHOLDERS]` with actual values
- [ ] Email address is correct (support@billdesk.com)
- [ ] Merchant ID is correct
- [ ] IP address is correct (204.236.218.85)
- [ ] Return URL is correct (https://api.gutmantra.in/api/billdesk/callback)
- [ ] Your contact information is complete
- [ ] Added CC to your own email for record-keeping
- [ ] Used professional tone
- [ ] Proofread for typos

---

## 🚀 Send From:

- **Email Provider:** Gmail, Outlook, or your company email
- **Best Time:** Business hours (9 AM - 5 PM IST)
- **Expected Response:** 24-48 hours

---

## 📞 Alternative Contact Options:

If email takes too long, try:
1. **BillDesk Support Portal:** https://pg.billdesk.io/login
2. **Live Chat:** Available on BillDesk dashboard
3. **Escalation Email:** escalations@billdesk.com
4. **Phone:** Check your merchant account for support number

---

## 📝 After You Send:

**Save the response you get from BillDesk which will include:**
- ✅ Confirmation of IP whitelist
- ✅ Confirmation of return URL whitelist
- ✅ Test credentials (card, UPI, OTP)
- ✅ Merchant ID for sandbox (if different)
- ✅ Secret key for sandbox (if different)
- ✅ Any additional setup instructions

---

**Status:** Ready to send! 📧

Just fill in the bracketed values and hit send!

