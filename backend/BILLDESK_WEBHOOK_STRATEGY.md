# BillDesk Webhook Implementation Strategy

**Problem**: BillDesk docs don't specify webhook payload structure, signature headers, or retry behavior.

**Solution**: Capture first webhook and work backwards.

## Implementation Approach

### Phase 1: Debug & Capture (Current)

I've created `src/routes/billdesk-webhook.routes.ts` with two endpoints:

#### Debug Endpoint (Non-Production)
```
POST https://api.gutmantra.in/api/billdesk/debug
```
- Logs ALL headers, body, query params
- Saves to Firestore collection `webhooks_debug`
- No verification - just capture

#### Production Endpoint (With Auto-Detection)
```
POST https://api.gutmantra.in/api/billdesk/callback
```
- Auto-detects signature header (checks 5 common names)
- Tries 3 signature verification methods (SHA256 hex, SHA1 hex, SHA256 base64)
- Logs which method worked
- Updates Firestore transaction & order status
- Always returns 200 OK (prevents BillDesk retries)

### Phase 2: Setup & Monitor

1. **Add webhook route to your Express app**:
```typescript
// src/index.ts or src/app.ts
import billDeskWebhookRoutes from './routes/billdesk-webhook.routes';
app.use('/api/billdesk', billDeskWebhookRoutes);
```

2. **Deploy to production** (https://api.gutmantra.in)

3. **Update BillDesk webhook URL** (via merchant dashboard or email):
```
https://api.gutmantra.in/api/billdesk/callback
```

4. **Test with first payment** (in UAT or production)

5. **Check Firestore logs** to see what was received:
```
Collections → webhooks_debug
```

### Phase 3: Analyze & Confirm

When you receive first webhook, check the Firestore `webhooks_debug` collection:

```json
{
  "headers": {
    "x-billdesk-signature": "abc123...",  // ← Signature location
    "content-type": "application/json",
    "user-agent": "BillDesk-Webhook/1.0"
  },
  "body": {
    "transactionid": "TXN123456789",
    "bdorderid": "OAFC19XTFD8TSP",
    "auth_status": "0300",                 // ← Expected status field
    "authcode": "123456",
    "bank_ref_no": "BRN123456789",
    "rrn": "RRN123456"
  }
}
```

**What to look for**:
- ✅ Which header contains signature? (x-billdesk-signature, authorization, etc.)
- ✅ What's the signature format? (hex, base64, JWT, etc.)
- ✅ What fields are in the payload?
- ✅ Does status come as `auth_status` or `status`?

### Phase 4: Verify & Update

Once you know the actual structure, update the webhook endpoint to use only the correct verification method.

## Current Auto-Detection Features

The webhook endpoint automatically tries to detect:

### Signature Header Names (Checked in Order)
1. `x-billdesk-signature`
2. `x-signature`
3. `billdesk-signature`
4. `bd-signature`
5. `authorization` (Bearer token)

### Signature Verification Methods
1. HMAC-SHA256 (hex) ← **Most likely**
2. HMAC-SHA1 (hex)
3. HMAC-SHA256 (base64)

### Status Field Names
- Primary: `auth_status` (from BillDesk API)
- Fallback: `status` (some webhook systems use this)

## Expected Response Behavior

Your endpoint returns:
```json
{
  "received": true,
  "transactionid": "TXN123456789",
  "processed_at": "2026-05-27T10:30:45.123Z"
}
```

**BillDesk Expected Behavior** (industry standard):
- ✅ Timeout: 30 seconds (standard)
- ✅ Retries: 3-5 attempts (standard)
- ✅ Backoff: Exponential (standard)
- Your endpoint always returns 200 OK to prevent retries

## Firestore Updates

When webhook is successfully processed:

**transactions collection**:
```
transactionid (doc ID)
├── auth_status: "0300"
├── authcode: "123456"
├── bank_ref_no: "BRN123456789"
├── rrn: "RRN123456"
├── webhook_received_at: timestamp
└── webhook_payload: {...}
```

**orders collection**:
```
orderid (doc ID)
├── status: "completed" (if auth_status = "0300")
├── payment_status: "0300"
└── updated_at: timestamp
```

## Testing Checklist

- [ ] Deploy webhook routes to production
- [ ] Configure BillDesk callback URL to: `https://api.gutmantra.in/api/billdesk/callback`
- [ ] Process first payment transaction
- [ ] Check `webhooks_debug` Firestore collection
- [ ] Identify signature header name
- [ ] Identify signature algorithm
- [ ] Verify console logs show "✅ Signature verified"
- [ ] Confirm Firestore orders/transactions updated correctly
- [ ] Test second transaction to verify consistency

## Common Issues & Fixes

### Issue: "Signature verification failed"
- **Check**: Is the signature header named differently?
- **Action**: Add header name to `possibleSignatureHeaders` array
- **Test**: Send sample webhook with known signature

### Issue: "No signature found"
- **Check**: Does BillDesk send signatures at all?
- **Action**: Check BillDesk webhook security settings in merchant dashboard
- **Alternative**: Use timestamp validation instead (if provided in headers)

### Issue: "Transaction not updating"
- **Check**: Is `transactionid` present in webhook payload?
- **Action**: Console log will show exact payload structure
- **Fix**: Adjust Firestore query if ID field name is different

### Issue: "Multiple retries received"
- **Check**: Is endpoint returning 200 OK?
- **Action**: Ensure `res.status(200)` is always called
- **Monitor**: Check Firestore `webhooks_debug` for duplicate entries

## Questions to Ask BillDesk After Testing

Once you see the actual webhook structure:

1. "We received webhook with signature in `[header_name]` header. Is this correct?"
2. "The payload contains fields: `[list_fields]`. Are these all available or optional?"
3. "Should we implement retrying your webhook or handle once-per-transaction?"
4. "Is there a test mode to replay webhooks for debugging?"

## Expected Webhook Timeline

1. **Payment submitted**: Create Order → Create Transaction → Update Transaction (polling)
2. **Customer completes 3DS**: Update Transaction response
3. **Settlement processing**: ⏰ **Webhook sent** (timing varies: 5 seconds to several hours)
4. **Order updated**: Your system receives webhook, updates Firestore

## Production Readiness Checklist

- [ ] Debug endpoint working at `/api/billdesk/debug`
- [ ] Production endpoint working at `/api/billdesk/callback`
- [ ] Firestore collections `webhooks_debug`, `transactions`, `orders` accessible
- [ ] Console logging enabled for production (check your logging service)
- [ ] Error handling catches all exceptions
- [ ] Always returns 200 OK (prevents infinite retries)
- [ ] IP whitelist verified (204.236.218.85)
- [ ] HTTPS enabled on callback URL
- [ ] Rate limiting doesn't block webhook calls

## Alternative: Polling Only (No Webhooks)

If webhooks prove unreliable, you can continue using **frontend polling** indefinitely:
```
Frontend polls: GET /api/orders/status/:orderid every 2 seconds
Max duration: 10 minutes (covers most settlement scenarios)
Fallback: Email receipt after 10 minutes if status still pending
```

This works but is less efficient than webhooks.

---

**Next Steps**:
1. Add webhook routes to Express app
2. Deploy to production
3. Update BillDesk callback URL configuration
4. Process first payment and check `webhooks_debug` collection
5. Report back with webhook structure details
