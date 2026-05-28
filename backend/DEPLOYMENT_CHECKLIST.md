# BillDesk Payment Gateway - Deployment Checklist

## ✅ Implementation Complete

Claude Code has fixed and implemented:
- ✅ Create Order API call (calls real BillDesk API, not local generation)
- ✅ Create Transaction API call with proper 3DS2 support
- ✅ Update Transaction API call with signature verification
- ✅ Webhook callback handler with HMAC-SHA256 verification
- ✅ Payment status polling endpoint
- ✅ Firestore schema for orders and transactions
- ✅ Frontend payment flow component
- ✅ Error handling with proper logging

---

## Pre-UAT Testing Checklist (Next 2-3 Days)

### 1. Environment Setup
```bash
# Verify .env has these values
BILLDESK_MERCHANT_ID=KANAKV2
BILLDESK_MERCHANT_KEY=to8pJnluXU43FPzhC2P2YLlbmylW4NEm
BILLDESK_BASE_URL=https://uat1.billdesk.com/u2
NODE_ENV=development
```

### 2. Deploy to Backend (UAT Server)
```bash
# From backend directory
npm install  # Install any new dependencies
npm run build
npm start    # Or deploy to your UAT server
```

### 3. Verify Routes Are Registered
Check that these routes are added to your Express app:
```typescript
// In src/index.ts or src/app.ts
import billDeskOrderRoutes from './routes/billdesk-orders.routes';
import billDeskWebhookRoutes from './routes/billdesk-webhook.routes';

app.use('/api/orders', billDeskOrderRoutes);
app.use('/api/billdesk', billDeskWebhookRoutes);
```

**Verify endpoints exist**:
```bash
# Check logs when server starts - should see routes registered
POST /api/orders/create-order
POST /api/orders/create-transaction
POST /api/orders/update-transaction
POST /api/billdesk/callback (webhook)
GET /api/orders/status/:orderid
GET /api/orders/:orderid
```

### 4. Test Firestore Schema
```bash
# Run setup script
npx ts-node scripts/setup-firestore-payment.ts

# Verify collections exist in Firestore:
# - orders
# - transactions
```

### 5. Test Create Order Endpoint
```bash
curl -X POST https://api.gutmantra.in/api/orders/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userid": "test-user-123",
    "items": [
      {"productid": "001", "quantity": 1, "price": "299.28"}
    ],
    "paymentmethod": "card",
    "buyerEmail": "test@example.com",
    "buyerPhone": "+919876543210"
  }'

# Expected response:
{
  "success": true,
  "orderid": "ORD-1234567890",
  "bdorderid": "OAFC19XTFD8TSP",
  "payment_link": "https://..."
}
```

### 6. Check Console Logs
Look for these log messages:
```
[BillDesk] Creating order in UAT environment...
[BillDesk] Create Order API call successful
[BillDesk] bdorderid returned: OAFC19XTFD8TSP
[BillDesk] Order saved to Firestore
```

---

## UAT Testing Phase (3-5 Days)

### Test Case 1: Complete Payment Flow
**Scenario**: Customer completes full payment with 3DS2

1. Click "Place Order" on frontend
2. POST to `/api/orders/create-order` → Get `bdorderid`
3. POST to `/api/orders/create-transaction` → Get `transactionid` + `next_step: "3ds2_challenge"`
4. Redirect to 3DS2 challenge (ACS page)
5. Complete 3DS2 challenge → Get `cres` parameter
6. POST to `/api/orders/update-transaction` with `cres`
7. Check Firestore: `auth_status` should be "0300"
8. Frontend polling should detect completion

**Verify**:
- ✅ Order created in Firestore
- ✅ Transaction created in Firestore
- ✅ auth_status = "0300" after update
- ✅ Payment success page displays
- ✅ Webhook received (check `webhooks_debug` collection)

**Test Cards (UAT)**:
- Visa: `4111111111111111` | Any future MM/YY | Any CVV
- Mastercard: `5555555555554444` | Any future MM/YY | Any CVV

### Test Case 2: Failed Payment
**Scenario**: Customer declines or fails 3DS2

1. Use test card that triggers failure
2. Complete flow but 3DS2 returns failure
3. Update Transaction receives error
4. Check auth_status = "0399"
5. Frontend should display error message

**Verify**:
- ✅ Order status = "failed"
- ✅ Error message displayed
- ✅ Retry button works

### Test Case 3: OTP Flow (if applicable)
**Scenario**: Payment requires OTP instead of 3DS2

1. Next step from Create Transaction = "capture_otp"
2. Display OTP input form
3. Customer enters OTP
4. POST to Update Transaction with OTP
5. Check result

### Test Case 4: Webhook Reception
**Scenario**: Verify webhook is received and processed

1. Complete payment flow
2. Check Firestore `webhooks_debug` collection
3. Verify webhook payload contains:
   - `transactionid`
   - `bdorderid`
   - `auth_status`
   - `authcode`
   - `bank_ref_no`
4. Verify console logs show signature verification
5. Check if "✅ Signature verified" appears

**Webhook Debug Logs** (in console/logs):
```
=== BILLDESK WEBHOOK DEBUG ===
{
  "headers": {
    "x-billdesk-signature": "abc123...",
    ...
  },
  "body": {
    "transactionid": "TXN123456789",
    "auth_status": "0300",
    ...
  }
}
==============================
```

### Test Case 5: Status Polling
**Scenario**: Frontend polls for status updates

1. After Update Transaction, frontend polls every 2 seconds
2. GET `/api/orders/status/:orderid`
3. Should return current transaction status
4. Polling should stop when `auth_status = "0300"`

**Verify**:
- ✅ Polling endpoint returns correct data
- ✅ Polling stops when payment completes
- ✅ No excessive API calls (2 sec interval respected)

---

## Production Deployment (After UAT Success)

### Pre-Production Checklist
- [ ] All UAT tests passed
- [ ] Webhook signature verification confirmed
- [ ] Error handling tested
- [ ] Performance verified (response times < 2 seconds)
- [ ] Logs reviewed for any errors
- [ ] BillDesk support confirmed production domain is whitelisted
- [ ] Production credentials verified (Merchant ID, Merchant Key)

### Change to Production

**Step 1: Update .env**
```env
BILLDESK_BASE_URL=https://api.billdesk.com
NODE_ENV=production
```

**Step 2: Verify Credentials**
```bash
# In .env, confirm:
BILLDESK_MERCHANT_ID=KANAKV2
BILLDESK_MERCHANT_KEY=to8pJnluXU43FPzhC2P2YLlbmylW4NEm
# Both should be your PRODUCTION credentials from BillDesk
```

**Step 3: Deploy to Production**
```bash
npm run build
# Deploy to production server
npm start
```

**Step 4: Verify Production Endpoints**
```bash
# Test with real card (small amount)
curl -X POST https://api.gutmantra.in/api/orders/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userid": "test", ...}'

# Should return real bdorderid from production BillDesk
```

**Step 5: First Production Transaction**
1. Process a small amount (~₹1-10) with test card
2. Verify:
   - Order created in production Firestore
   - Transaction processed
   - Webhook received
   - Settlement initiated
3. Monitor for next 24 hours:
   - Check error rates
   - Verify settlements
   - Monitor webhook deliveries

---

## Important Security Notes

### Before Going Live
- ✅ Never log full card numbers
- ✅ Never log CVVs or OTPs
- ✅ HTTPS only on all endpoints
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation on all fields
- ✅ Signature verification always enabled
- ✅ Timeout protection (30 seconds max)

### Monitoring in Production
- 📊 Dashboard showing daily transaction volume
- 📊 Alert on payment failure rate > 5%
- 📊 Alert on webhook delivery failures
- 📊 Daily settlement reconciliation
- 📊 Log review for errors/exceptions

---

## Troubleshooting

### Issue: "BD-Signature verification failed"
**Solution**:
- Check Merchant Key in .env is exactly: `to8pJnluXU43FPzhC2P2YLlbmylW4NEm`
- Verify webhook payload is being logged correctly
- Check if signature header name changed

**Action**:
1. Check `webhooks_debug` collection in Firestore
2. Verify `x-billdesk-signature` header exists
3. Console logs should show signature match attempt
4. If mismatch, email BillDesk with webhook payload sample

### Issue: "bdorderid is null/undefined"
**Solution**:
- Create Order API call failed
- Check Firestore `orders` collection - is it empty?
- Check console logs for BillDesk API error response

**Action**:
1. Verify BILLDESK_BASE_URL is correct (should be UAT or production)
2. Verify Merchant ID and Key are in .env
3. Test Create Order endpoint directly
4. Check API response in logs

### Issue: "Transaction not updating"
**Solution**:
- Update Transaction API call failed
- transactionid might be null from Create Transaction

**Action**:
1. Verify Create Transaction returned transactionid
2. Check transactionid is being stored in Firestore
3. Verify response_parameters format matches flow type (3ds2 vs otp)

### Issue: "Webhook not received"
**Solution**:
- BillDesk might not have webhook endpoint configured
- Webhook URL might be incorrect

**Action**:
1. Check Firestore `webhooks_debug` - is there any data?
2. If empty, webhook hasn't been received
3. Email BillDesk: "Please verify webhook endpoint is configured to: https://api.gutmantra.in/api/billdesk/callback"
4. Fallback: Use polling only (less efficient but works)

---

## Contact BillDesk Support

When ready, email Yogesh at BillDesk:

```
Subject: Production Deployment - BillDesk Payment Gateway

Hi Yogesh,

We have successfully integrated your BillDesk payment gateway APIs and 
completed UAT testing. We are now ready for production deployment.

Merchant Details:
- Merchant ID: KANAKV2
- Organization: Gut Mantra
- Website: https://gutmantra.in

Production Configuration:
- API Base URL: https://api.billdesk.com
- Callback URL: https://api.gutmantra.in/api/billdesk/callback
- Payment Gateway IP: 204.236.218.85

Please confirm:
1. Production domain (204.236.218.85 + https://api.gutmantra.in) is whitelisted
2. Webhook endpoint is configured for production
3. Webhook signature format (so we can validate)
4. Any additional configuration needed

We will process first transaction tomorrow.

Best regards,
Akshad Gawde
```

---

## Success Criteria

✅ **UAT Success**:
- [ ] Create Order returns bdorderid from BillDesk API
- [ ] Create Transaction returns transactionid
- [ ] 3DS2 challenge completes successfully
- [ ] Update Transaction processes cres correctly
- [ ] Firestore order shows status = "completed"
- [ ] Webhook is received and logged
- [ ] Polling endpoint works
- [ ] All error cases handled gracefully

✅ **Production Ready**:
- [ ] All UAT tests passed
- [ ] Production credentials verified
- [ ] Error monitoring configured
- [ ] Settlement reconciliation process defined
- [ ] Support escalation plan documented
- [ ] Rollback plan documented

---

## Timeline

**Today**: Finish environment setup and start UAT testing
**Day 1-3**: Complete test cases 1-5
**Day 4**: Review logs, confirm webhook structure, make any needed adjustments
**Day 5**: Deploy to production
**Day 1-7 (Production)**: Monitor transactions, verify settlements, watch for errors

---

## You're Almost Done! 🎯

All the heavy lifting is done. Now it's just:
1. ✅ Test in UAT
2. ✅ Confirm webhook structure
3. ✅ Change one environment variable
4. ✅ Deploy to production
5. ✅ Process first transaction
6. ✅ Celebrate! 🎉

**Next action**: Start with Test Case 1 (Complete Payment Flow) in UAT.
