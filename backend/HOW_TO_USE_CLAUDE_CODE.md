# How to Use Claude Code for BillDesk Integration

## Quick Start

### 1. Open Claude Code in Your Terminal
```bash
cd /Users/akshadgawde/Desktop/Developer/gut/backend
claude code
```

### 2. Copy and Paste the Full Prompt
Open `BILLDESK_INTEGRATION_PROMPT.md` in your editor and copy the entire content.

Paste it into Claude Code and add these specific instructions at the beginning:

```
You are implementing a complete BillDesk payment gateway integration for a Node.js/Express backend with React frontend. 

STRICT REQUIREMENTS:
1. Follow the BillDesk REST API v1.2 documentation EXACTLY as specified
2. Use the existing billdesk.ts utility file I created (already in src/utils/)
3. Do NOT deviate from the three-stage payment flow: Create Order → Create Transaction → Update Transaction
4. All monetary amounts MUST use string format with exactly 2 decimals
5. HMAC-SHA256 signatures MUST be generated using the Merchant Key
6. All API responses MUST include trace IDs for debugging
7. Implement proper error handling with retry logic
8. Firestore schema must match the exact structure provided

SKIP IF NOT APPLICABLE:
- Do not create authentication middleware (Firebase Auth already exists)
- Do not modify existing WhatsApp OTP routes
- Do not create new payment method parsers (card validation only)

DELIVER:
1. Backend routes file (orders payment routes)
2. Firestore schema setup script
3. Frontend payment component
4. Payment flow implementation guide
5. Full testing checklist with sample test cases
6. Deployment verification steps

START NOW with the prompt below:
```

Then paste the entire BILLDESK_INTEGRATION_PROMPT.md content.

### 3. Let Claude Code Work
Claude Code will:
- ✅ Generate all backend routes
- ✅ Create Firestore schema updates
- ✅ Build the payment component
- ✅ Implement polling mechanism
- ✅ Add comprehensive error handling
- ✅ Create test files

### 4. Review the Generated Code
Claude Code will output:
1. **Backend files** - Copy to `src/routes/` and `src/services/`
2. **Frontend files** - Copy to `src/pages/` and `src/components/`
3. **Test files** - Copy to `tests/` or `__tests__/`
4. **Setup scripts** - Run firestore schema updates

### 5. Integrate Into Your Project
```bash
# Copy generated files to appropriate locations
cp generated/orders.routes.ts src/routes/
cp generated/paymentService.ts src/services/
cp generated/PaymentPage.tsx src/pages/
cp generated/setup-firestore.ts scripts/

# Update your main Express app to include new routes
# Add to src/index.ts or src/app.ts:
import ordersRoutes from './routes/orders.routes';
app.use('/api/orders', ordersRoutes);

# Update environment variables
cp .env.example .env
# Edit .env with BillDesk credentials
```

### 6. Set Up Database Schema
```bash
# Run the Firestore setup script
npx ts-node scripts/setup-firestore.ts
```

### 7. Test in UAT Environment
```bash
# Make sure environment is set to UAT
export BILLDESK_ENVIRONMENT=uat

# Run tests
npm test -- payment

# Test with sample order creation
curl -X POST http://localhost:5000/api/orders/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [{"productid": "001", "quantity": 1, "price": "299.28"}],
    "paymentmethod": "card"
  }'
```

### 8. Verify All Endpoints
- [ ] POST /api/orders/create-order → Returns bdorderid
- [ ] POST /api/orders/create-transaction → Returns transactionid
- [ ] POST /api/orders/update-transaction → Returns auth_status
- [ ] GET /api/orders/status/:orderid → Returns current status
- [ ] GET /api/orders/:orderid → Returns complete order details

### 9. Frontend Integration
1. Import PaymentPage component
2. Update your cart/checkout flow to use /payment route
3. Set payment gateway to BillDesk (not Firebase/Meta)
4. Test payment flow end-to-end

### 10. Production Deployment
Once UAT testing is complete:
```bash
# Change to production
export BILLDESK_ENVIRONMENT=production
export BILLDESK_BASE_URL=https://api.billdesk.com

# Verify credentials
echo $BILLDESK_MERCHANT_ID  # Should show: KANAKV2
echo $BILLDESK_MERCHANT_KEY # Should show: to8pJnluXU43FPzhC2P2YLlbmylW4NEm

# Deploy
npm run build
npm start
```

## Expected Output from Claude Code

### Files Generated:
```
/src/routes/orders.routes.ts          # All payment endpoints
/src/services/paymentService.ts        # BillDesk API wrapper
/src/services/orderService.ts          # Order management logic
/src/pages/PaymentPage.tsx             # Payment UI component
/src/components/PaymentForm.tsx        # Card entry form
/src/components/PaymentStatus.tsx      # Status polling component
/scripts/setup-firestore.ts            # Database schema initialization
/tests/payment.integration.test.ts     # Integration tests
/tests/billdesk-signature.test.ts      # Signature generation tests
/docs/PAYMENT_FLOW_DIAGRAM.md          # Flow documentation
```

## Troubleshooting

### Issue: "BD-Signature verification failed"
**Solution**: Ensure Merchant Key is exactly: `to8pJnluXU43FPzhC2P2YLlbmylW4NEm`

### Issue: "bdorderid not found"
**Solution**: Verify Create Order endpoint was called successfully and bdorderid was stored in Firestore

### Issue: "3DS2 challenge not redirecting"
**Solution**: Ensure next_step value is correctly parsed from BillDesk response and ACS URL is valid

### Issue: "Transaction status stuck at pending"
**Solution**: Implement webhook support (optional) or increase polling interval, check if Update Transaction was called

### Issue: "Card payment failing in UAT"
**Solution**: Use test cards (4111111111111111 for Visa), ensure expiry is in MM/YY format and future date

### Issue: "CORS errors on payment API"
**Solution**: Ensure backend CORS is configured to allow payment origin, check browser console for exact error

## Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| BILLDESK_INTEGRATION_PROMPT.md | Complete integration specification | backend/ |
| billdesk.ts | BillDesk API utilities | src/utils/ |
| orders.routes.ts | Payment endpoints (from Claude Code) | src/routes/ |
| PaymentPage.tsx | Payment UI (from Claude Code) | src/pages/ |
| paymentService.ts | Payment business logic (from Claude Code) | src/services/ |
| setup-firestore.ts | Database initialization (from Claude Code) | scripts/ |

## Support & Documentation

- **BillDesk API Docs**: https://docs.billdesk.io
- **Create Order Endpoint**: /payments/ve1_2/orders/create
- **Create Transaction Endpoint**: /payments/ve1_2/transactions/create
- **Update Transaction Endpoint**: /payments/ve1_2/transactions/update
- **Test Environment**: https://uat1.billdesk.com/u2
- **Production Environment**: https://api.billdesk.com

## Next Steps After Integration

1. ✅ Complete backend implementation via Claude Code
2. ✅ Test all endpoints in UAT
3. ✅ Implement frontend payment flow
4. ✅ End-to-end testing with test cards
5. ⬜ Whitelist production domain with BillDesk (you mentioned this earlier)
6. ⬜ Deploy to production
7. ⬜ Monitor first 24 hours of live transactions
8. ⬜ Set up daily reconciliation reports
9. ⬜ Implement webhook notifications (optional but recommended)

---

**Ready to start?** Run Claude Code now and paste the BILLDESK_INTEGRATION_PROMPT.md content!
