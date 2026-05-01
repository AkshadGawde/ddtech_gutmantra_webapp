# 🔗 INTEGRATION GUIDE - USE THESE NEW FILES

## Backend Updates

### 1. Update server.ts
```typescript
// Change this line:
import authRoutes from "./src/routes/auth.js";

// To this:
import authRoutes from "./src/routes/authRoutes.js";

// Everything else stays the same
```

### 2. Keep In Production

**Old files** (can deprecate or delete):
- `src/services/passwordVerification.ts` → Use `passwordService.ts` instead
- `src/routes/auth.ts` → Use `authRoutes.ts` instead
- `scripts/migrate.ts` → Use `scripts/migrateV2.ts` instead

**Keep these** (still needed):
- `src/services/firebaseAdmin.ts` - Initialization
- `src/utils/migrationUtils.ts` - Helper functions
- `src/utils/orderLinking.ts` - Order operations
- `src/utils/migrationHelpers.ts` - Debugging tools

### 3. Migration Command Change
```bash
# Old:
npm run migrate

# New (automatically uses migrateV2.ts now):
npm run migrate

# Both accept same arguments:
npm run migrate data/users.csv data/products.csv data/orders.csv
```

---

## Frontend Updates

### 1. Use New Login Hook
```typescript
// In your login page/component:
import { useAuthFlow } from "@/hooks/useAuthFlow";

export default function LoginPage() {
  const { login, register, loading, error, isAuthenticated } = useAuthFlow();
  
  // Use the hook in your logic
}
```

### 2. Or Use Pre-built Component
```typescript
// In your page:
import { LoginForm } from "@/components/LoginForm";

export default function AuthPage() {
  return (
    <LoginForm 
      onSuccess={() => console.log("Logged in!")}
      redirectTo="/dashboard"
    />
  );
}
```

### 3. Manual Implementation
```typescript
// If you want to implement yourself:
import { useAuthFlow } from "@/hooks/useAuthFlow";

export function MyLoginForm() {
  const { login, error, loading } = useAuthFlow();

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      // User is now logged in with Firebase
      window.location.href = "/dashboard";
    } else {
      // result.error has the message
      console.error(result.error);
    }
  };

  return (
    // Your form JSX
  );
}
```

---

## API Endpoints (Unchanged)

All endpoints remain the same:
```
POST /api/auth/legacy-login  - Migrate WordPress user
POST /api/auth/login         - Firebase login
POST /api/auth/register      - Register new user
GET  /api/auth/profile       - Get user profile
POST /api/auth/logout        - Logout
GET  /api/auth/health        - Health check
```

Response format changed slightly to be more consistent:
```json
// Old:
{
  "success": true,
  "user": {...}
}

// New:
{
  "success": true,
  "data": {...},
  "code": "ERROR_CODE" (only on errors)
}
```

---

## Database (No Changes Required)

Firestore collections and schema unchanged:
- `users/` - Same structure
- `products/` - Same structure
- `orders/` - Same structure
- `migrationLogs/` - Same structure

---

## NPM Dependencies Added

```bash
npm install express-rate-limit
```

Already updated in package.json. Run `npm install` after pulling.

---

## Environment Variables (No Changes)

No new env vars needed. Keep using:
```
FIREBASE_DATABASE_URL=...
NODE_ENV=development
PORT=3000
```

---

## Testing Commands

```bash
# Run the improved migration
npm run migrate

# Verify data integrity
npm run verify

# Start dev server with new code
npm run dev

# Test legacy login
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test rate limiting (make 6 requests in 60 seconds)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/legacy-login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  sleep 1
done
# Request 6 should fail with 429 (Too Many Requests)
```

---

## File Structure After Updates

```
backend/
├── src/
│   ├── services/
│   │   ├── firebaseAdmin.ts        (unchanged)
│   │   ├── passwordService.ts      ✅ NEW (phpass + bcrypt)
│   │   ├── authService.ts          ✅ NEW (all auth logic)
│   │   ├── migrationService.ts     ✅ NEW (batch migration)
│   │   └── passwordVerification.ts (deprecated)
│   ├── routes/
│   │   ├── authRoutes.ts           ✅ NEW (with rate limit)
│   │   └── auth.ts                 (deprecated)
│   └── utils/
│       ├── migrationUtils.ts       (unchanged)
│       ├── orderLinking.ts         (unchanged)
│       └── migrationHelpers.ts     (unchanged)
├── scripts/
│   ├── migrateV2.ts                ✅ NEW (batch + validate)
│   ├── migrate.ts                  (deprecated)
│   └── verify.ts                   (unchanged)
├── server.ts                       ✅ UPDATED (new import)
└── package.json                    ✅ UPDATED (new dep + script)

frontend/
├── src/
│   ├── hooks/
│   │   └── useAuthFlow.ts          ✅ NEW (complete flow)
│   ├── components/
│   │   └── LoginForm.tsx           ✅ NEW (production UI)
│   └── [other components]
```

---

## Breaking Changes

Only one breaking change:

```typescript
// Old response:
{
  "success": true,
  "user": { uid, email, ... }
}

// New response:
{
  "success": true,
  "data": { uid, email, customToken, ... }
}

// To update frontend:
// Change: response.user
// To:     response.data
```

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to old code:
git checkout HEAD -- backend/src/services/passwordVerification.ts
git checkout HEAD -- backend/src/routes/auth.ts
git checkout HEAD -- backend/scripts/migrate.ts

# Revert server.ts import:
# Change: import authRoutes from "./src/routes/authRoutes.js";
# To:     import authRoutes from "./src/routes/auth.js";

# Restart:
npm run dev
```

No database changes, so zero data migration needed for rollback.

---

## Production Deployment Steps

1. **Test locally**
   - `npm install`
   - `npm run dev`
   - Test login/register/legacy-login
   - `npm run verify`

2. **Deploy backend**
   - Push code to production
   - `npm install`
   - `npm run dev` (or use pm2)

3. **Deploy frontend**
   - Update frontend code
   - `npm run build`
   - Deploy to hosting

4. **Monitor**
   - Check `/api/auth/health`
   - Monitor error rates
   - Watch migration logs in Firestore
   - Test with first batch of users

5. **Celebrate**
   - System running in production
   - No data loss
   - Petpooja integration preserved
   - All users can login
   - Legacy users auto-migrated

---

**Everything is ready. Start with ACTION_ITEMS.md** ✅
