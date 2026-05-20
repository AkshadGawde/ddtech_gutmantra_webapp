# 📧 Follow-up Email to BillDesk - IP & URL Whitelisting (UPDATED)

## Email to Send:

---

**To:** yogesh.kulkarni@billdesk.com  
**CC:** support@billdesk.com  
**Subject:** RE: IP Whitelisting & Return URL Configuration - GutMantra (Merchant: KANAKV2)

---

### Email Body:

```
Hi Yogesh,

Thank you for sharing the API documentation and guidance.

Following up on our previous discussion regarding the migration of our WordPress 
platform to a custom-built web application, we now have our new infrastructure 
ready and need to configure IP and Return URL whitelisting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MERCHANT DETAILS:
Merchant ID: KANAKV2
Organization: Gut Mantra
Website: https://gutmantra.in

MIGRATION STATUS:
✓ Migrated from WordPress to custom Node.js/React platform
✓ New API server deployed on AWS
✓ Payment integration ready for testing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHITELISTING REQUESTS - PRODUCTION ENVIRONMENT:

1. NEW SERVER IP WHITELISTING
   IP Address: 204.236.218.85
   Server Location: AWS
   Environment: Production
   Purpose: Payment callback reception from BillDesk

2. NEW RETURN URL WHITELISTING
   Callback URL: https://api.gutmantra.in/api/billdesk/callback
   HTTP Method: POST
   Environment: Production
   Purpose: Receive payment status updates

IMPORTANT NOTE:
⚠️ Please KEEP THE EXISTING WHITELISTED URL(s) as they are for now
   We will notify you to remove the old configuration once our 
   testing phase is complete (estimated 1-2 weeks from approval)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SANDBOX TESTING (Optional but helpful):
For our pre-production testing, it would be beneficial if you could also whitelist:

Sandbox IP: 204.236.218.85 (same server, different environment)
Sandbox Callback URL: https://api.gutmantra.in/api/billdesk/callback

And provide test credentials:
- Test Card Number(s)
- Test UPI ID(s)
- Test OTP (if required)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIMELINE:
We plan to go live with the new platform in 2-3 days. 
Please prioritize this whitelisting request.

NEXT STEPS:
1. Please confirm receipt of this request
2. Provide timeline for approval
3. Once approved, we'll proceed with payment testing
4. After testing phase, we'll request removal of old configuration

Please let me know if you need any additional information or clarification.

You can reach me at:
- Email: gawdeakshad@gmail.com
- Phone: [YOUR_PHONE_NUMBER]

Looking forward to your prompt response.

Best regards,
Akshad Gawde
GutMantra - Food Ordering Platform
https://gutmantra.in
Organization: Gut Mantra Enterprises
```

---

## Quick Summary of What You're Asking:

✅ **Add NEW IP:** 204.236.218.85  
✅ **Add NEW Return URL:** https://api.gutmantra.in/api/billdesk/callback  
✅ **Keep EXISTING configuration** (don't remove old one yet)  
✅ **We'll ask you to remove old config later** after testing  
✅ **Timeline:** 2-3 days before going live  
✅ **Sandbox credentials** (optional but helpful)

---

## Key Points in This Email:

1. ✅ References previous conversation with Yogesh
2. ✅ Explains migration from WordPress to custom platform
3. ✅ Clear new IP and URL to whitelist
4. ✅ **IMPORTANT:** Keep existing whitelist, don't remove
5. ✅ Says we'll ask for removal after testing
6. ✅ Urgent 2-3 day timeline
7. ✅ Professional and organized format

---

## What to Do:

1. **Replace [YOUR_PHONE_NUMBER]** with your actual phone
2. **Keep everything else as is**
3. **Copy and paste** into email reply to Yogesh
4. **Send immediately**

---

## Expected Response:

Within 24 hours, you should get:

```
"Hi Akshad,

Your IP 204.236.218.85 has been whitelisted for production.
Return URL https://api.gutmantra.in/api/billdesk/callback has been whitelisted.

Existing configuration has been retained as requested.

Test Credentials (Sandbox):
Card: 4111 1111 1111 1111
UPI: success@billdesk
OTP: Any 6 digits

Please confirm once testing is complete.

Regards,
Yogesh Kulkarni
BillDesk Support"
```

---

## After Approval:

```bash
# 1. Rebuild backend with latest code
npm run build
npm run dev

# 2. Test complete payment flow
- Add item → Checkout → Select ONLINE → Place Order
- Should redirect to BillDesk → Complete test payment
- Check Firestore for order status
- Check PetPooja for order

# 3. Once testing complete, ask Yogesh to remove old config
"Hi Yogesh, Testing is complete. 
Please remove the old whitelisted URLs/IPs from our previous setup.
New configuration is working perfectly."
```

---

## Pro Tips:

✅ **Keep this email professional** - Yogesh is your account manager  
✅ **Be specific** - Include exact IP and URL (not generic)  
✅ **Be clear about timeline** - They prioritize urgent requests  
✅ **Explain the migration** - Context helps them understand why  
✅ **Ask them to keep old config** - Shows you're not rushing  
✅ **Follow up after 24 hours** if no response  

---

**Ready? Copy, customize with phone number, and send!** 📧

The sooner you send, the sooner you can test and go live! 🚀

