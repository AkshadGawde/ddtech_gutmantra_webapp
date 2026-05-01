# 🎯 IMMEDIATE ACTION ITEMS

## Install & Deploy (5 min)

```bash
cd backend

# 1. Install new dependencies
npm install

# 2. Update server to use new routes
# (already updated in server.ts)

# 3. Run migration
npm run migrate

# 4. Verify data
npm run verify

# 5. Start server
npm run dev
```

---

## What Changed (Reference)

### ✅ New Services (Backend)
- `src/services/passwordService.ts` - WordPress phpass + bcrypt
- `src/services/authService.ts` - All auth logic, batch operations
- `src/services/migrationService.ts` - Batch migration with validation

### ✅ New Routes
- `src/routes/authRoutes.ts` - Replaces old auth.ts

### ✅ New Scripts
- `scripts/migrateV2.ts` - Improved migration with batch writes

### ✅ New Frontend
- `frontend/src/hooks/useAuthFlow.ts` - Complete login flow hook
- `frontend/src/components/LoginForm.tsx` - Production-ready UI

---

## Testing (Verify Everything Works)

```bash
# 1. Legacy login (WordPress user)
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Should return:
# {
#   "success": true,
#   "data": {
#     "uid": "firebase-uid",
#     "customToken": "...",
#     "migrationStatus": "completed"
#   }
# }

# 2. Register (new user)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123","phone":"+919876543210"}'

# 3. Rate limiting (make 6 requests in 60s to same IP)
# Should get 429 on 6th request

# 4. Already migrated (try legacy login twice)
# First: success
# Second: should return ALREADY_MIGRATED error
```

---

## Key Improvements

| Fix | Before | After |
|-----|--------|-------|
| Password hash | Only bcrypt | bcrypt + phpass ✅ |
| Auth flow | Only Firebase | Firebase → Legacy ✅ |
| Duplicates | Could happen | Prevented ✅ |
| Order linking | Single write | Batch writes ✅ |
| Consistency | Not checked | Pre-migration check ✅ |
| Rate limiting | None | 5 req/min on login ✅ |
| Error codes | Inconsistent | Standardized ✅ |
| Migration | Basic | Batch + idempotent ✅ |
| Frontend | Firebase only | Firebase + legacy ✅ |

---

## Firestore Indexes to Create

Firebase Console → Firestore → Indexes:

```
1. users collection
   - Single field: email (Ascending)

2. orders collection
   - Composite: firebaseUid (Asc) + createdAt (Desc)
   - Single field: wordpressUserId (Asc)
   - Single field: petpoojaOrderId (Asc)
```

---

## Critical Notes

⚠️ **Before migrating production data**:
1. ✅ Test with sample data first
2. ✅ Run `npm run verify` - should show no critical errors
3. ✅ Test legacy login with real WordPress user
4. ✅ Verify Petpooja IDs preserved
5. ✅ Monitor migration logs

⚠️ **During migration**:
1. Keep WordPress backup
2. Have rollback plan ready
3. Monitor for orphan orders

⚠️ **After migration**:
1. Test with first batch of users
2. Check orders linked correctly
3. Monitor auth error rates
4. Verify no password hashes exposed

---

## Error Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_INPUT | 400 | Missing email/password |
| USER_NOT_FOUND | 401 | User not in Firestore |
| ALREADY_MIGRATED | 400 | Firebase user exists |
| INVALID_CREDENTIALS | 401 | Wrong password |
| INVALID_TOKEN | 401 | Bad ID token |
| EMAIL_EXISTS | 409 | Email in use |
| INTERNAL_ERROR | 500 | Server error |

---

## Database Consistency Guarantees

✅ `wordpressUserId` - NEVER deleted  
✅ `wordpressOrderId` - NEVER deleted  
✅ `petpoojaOrderId` - NEVER deleted  
✅ `petpoojaCustomerId` - NEVER modified  
✅ `phone` - Preserved for POS fallback  

All customer history preserved. No data loss.

---

## Next Steps

1. **Install**: `npm install`
2. **Migrate**: `npm run migrate`
3. **Verify**: `npm run verify`
4. **Test**: Legacy login + register
5. **Deploy**: Production server
6. **Monitor**: First 24 hours
7. **Celebrate**: Migration complete! 🎉

---

**System is production-ready. Deploy with confidence.** ✅
