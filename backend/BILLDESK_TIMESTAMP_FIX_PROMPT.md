# Fix BillDesk Invalid Timestamp Header Error

## Problem
BillDesk Create Order API is returning:
```
status: 422,
error_type: 'invalid_data_error',
error_code: 'GNIDE0001',
message: 'Invalid timestamp header'
```

This error occurs when calling `POST /payments/ve1_2/orders/create`

## Current Implementation
File: `/Users/akshadgawde/Desktop/Developer/gut/backend/src/utils/billdesk.ts`

Current timestamp function:
```typescript
export function getBillDeskTimestamp(): string {
  const now = new Date();
  const isoString = now.toISOString();
  const withoutMs = isoString.substring(0, 19);
  return withoutMs + '+0000';
}
```

Currently returns: `2026-05-27T18:11:07+0000`

## What To Fix

1. **Investigate timestamp format** - Try multiple formats:
   - `YYYY-MM-DDThh:mm:ss+0000` (current, failing)
   - `YYYY-MM-DDThh:mm:ss+00:00` (with colon)
   - `YYYY-MM-DDThh:mm:ssZ` (UTC format)
   - `YYYY-MM-DDThh:mm:ss.000Z` (with milliseconds)
   - `YYYY-MM-DDThh:mm:ss IST` (timezone name)
   - Unix timestamp format (seconds since epoch)
   - Any other format BillDesk might accept

2. **Check signature calculation** - The signature might need:
   - Payload only (current approach)
   - Payload + timestamp
   - Different field ordering
   - Different serialization

3. **Verify headers** - Ensure headers being sent are exactly:
   - `Content-Type: application/json` (check case/format)
   - `Accept: application/jose`
   - `BD-Traceid: {traceId}`
   - `BD-Timestamp: {timestamp}`
   - `BD-Signature: {signature}`

4. **Check request body** - Verify all required fields in Create Order payload:
   - mercid (Merchant ID)
   - orderid (Order ID)
   - amount (Must be string with 2 decimals)
   - currency ("356" for INR)
   - order_date (Format: YYYY-MM-DD)
   - itemcode (Item code)
   - ru (Redirect URL)
   - additional_info (optional: email, mobile)

## Task for Claude Code

IMPORTANT: Review the BillDesk API documentation provided and test systematically:

1. **Read and analyze** the BillDesk API specs from the project context
2. **Test timestamp formats** by:
   - Creating a test script that tries different timestamp formats
   - Logging exactly what's being sent to BillDesk
   - Attempting the Create Order API call with each format
3. **Debug the signature** by:
   - Logging the payload JSON being signed
   - Logging the expected signature
   - Comparing with BillDesk's expected values
4. **Fix the implementation** in `/src/utils/billdesk.ts`:
   - Update `getBillDeskTimestamp()` with correct format
   - Update `generateBillDeskSignature()` if needed
   - Update `createOrder()` to log request details for debugging
5. **Verify the fix** by:
   - Testing locally with the same test request
   - Confirming 200 OK response with bdorderid

## Test Details

**Endpoint**: `POST http://localhost:5000/api/orders/create-order`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer test-token-123
```

**Body**:
```json
{
  "userid": "test-user",
  "items": [{"productid": "ATTA001", "quantity": 1, "price": "299.28"}],
  "paymentmethod": "card",
  "buyerEmail": "test@example.com",
  "buyerPhone": "+919876543210"
}
```

**Expected Success Response**:
```json
{
  "success": true,
  "orderid": "ORD-...",
  "bdorderid": "OAFC...",
  "amount": "299.28",
  "payment_link": "https://..."
}
```

## Deliverables

1. ✅ Fixed `getBillDeskTimestamp()` function with correct format
2. ✅ Updated signature generation if needed
3. ✅ Enhanced logging to show:
   - Exact timestamp being sent
   - Exact payload being signed
   - Exact signature being sent
   - Complete request headers
4. ✅ Test that Create Order API returns 200 OK
5. ✅ Confirm bdorderid is returned from BillDesk (not locally generated)

## Notes

- The error "Invalid timestamp header" specifically means the timestamp format is wrong
- This is NOT a signature issue (that would have different error code)
- BillDesk is strict about timestamp format - must be exact
- UTC timezone must be correct (±00:00 offset for IST is wrong - should be +0530 or Z)
- The timestamp should be current time when request is sent, not future or past

## Start Implementing Now

Fix this systematically:
1. Check BillDesk API docs for exact timestamp format requirement
2. Try different formats until one works
3. Once working, update `getBillDeskTimestamp()` permanently
4. Add logging for future debugging
5. Test locally to confirm 200 OK response
