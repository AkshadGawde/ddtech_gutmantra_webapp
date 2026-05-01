# Quick Start Guide - WordPress to Firebase Migration

## Step 1: Prerequisites ✅

```bash
# Node.js 16+ and npm installed
node --version  # v16.0.0+
npm --version   # 8.0.0+

# Firebase project created at https://console.firebase.google.com
# Firestore database enabled
# Firebase Auth enabled
```

## Step 2: Setup Firebase ✅

### 2.1 Download Service Account Key
```
Firebase Console → Project Settings → Service Accounts
→ Generate New Private Key
→ Save as backend/firebase-applet-config.json
```

### 2.2 Get Database URL
```
Firebase Console → Firestore Database → Details
→ Copy Database URL
→ Add to .env as FIREBASE_DATABASE_URL
```

### 2.3 Configure .env
```bash
cd backend
cp .env.example .env.local

# Edit .env.local
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NODE_ENV=development
PORT=3000
```

## Step 3: Install Dependencies ✅

```bash
cd backend
npm install
```

## Step 4: Prepare Data ✅

### 4.1 Export from WordPress
```bash
# Using WordPress admin panel or WP-CLI:
# Export Users, Products, Orders as CSV

# Users CSV must have:
# - email
# - phone
# - wordpress_user_id
# - hashed_password (bcrypt or phpass format)
# - petpooja_customer_id (optional)

# Products CSV must have:
# - wordpress_product_id
# - name
# - category
# - description (optional)
# - price
# - unit
# - image_url (optional)

# Orders CSV must have:
# - wordpress_order_id
# - wordpress_user_id
# - petpooja_order_id (optional)
# - items_json (JSON array)
# - total_amount
# - status (optional)
```

### 4.2 Place CSV Files
```bash
mkdir -p backend/data
cp users.csv backend/data/
cp products.csv backend/data/
cp orders.csv backend/data/
```

### 4.3 Verify CSV Format
```bash
# Check first row is headers
head -1 backend/data/users.csv
head -1 backend/data/products.csv
head -1 backend/data/orders.csv

# Should output:
# email,phone,wordpress_user_id,hashed_password,petpooja_customer_id
# wordpress_product_id,name,category,description,price,unit,image_url
# wordpress_order_id,wordpress_user_id,petpooja_order_id,items_json,total_amount,status
```

## Step 5: Run Migration ✅

```bash
cd backend

# Run migration script
npm run migrate

# Expected output:
# =======================================
#    🌍 WordPress to Firebase Migration
# =======================================
# 
# 📂 Using CSV files:
#    Users: data/users.csv
#    Products: data/products.csv
#    Orders: data/orders.csv
# 
# 🚀 Starting user migration...
# 📄 Found 50 users to migrate
# ✅ Migrated user: john@example.com (abc123...)
# ...
# ✨ User migration completed in 2.34s: 50 successful, 0 failed
# 
# 📊 Migration Statistics:
#    Total Users: 50
#    Migrated Users: 0
#    Pending Users: 50
#    Total Products: 125
#    Total Orders: 3400
# 
# ✅ Migration complete!
```

## Step 6: Verify Migration ✅

```bash
# Check Firestore collections
Firebase Console → Firestore → Collections

# Verify:
✅ users/ collection has all users with migrationStatus: "pending"
✅ products/ collection populated
✅ orders/ collection with wordpressUserIds
✅ migrationLogs/ collection shows success

# Check specific user
- Open users collection
- Find user by email
- Verify legacyPasswordHash exists
- Verify migrationStatus = "pending"
- Verify wordpressUserId preserved
```

## Step 7: Start Server ✅

```bash
cd backend

# Development
npm run dev

# Production
npm start

# Expected output:
# ✅ Firebase Admin SDK initialized
# 📝 Registering auth routes...
# ✅ Server running at http://localhost:3000
# 📝 Auth endpoints:
#    POST /api/auth/legacy-login - Migrate WordPress users
#    POST /api/auth/login - Firebase login
#    POST /api/auth/register - Register new user
#    GET /api/auth/profile - Get user profile
#    POST /api/auth/logout - Logout
```

## Step 8: Test Legacy Login ✅

```bash
# Test with curl
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "actual_password"
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Legacy user successfully migrated and logged in",
#   "customToken": "eyJhbGc...",
#   "user": {
#     "uid": "firebase-uid-123",
#     "email": "john@example.com",
#     "phone": "+919876543210",
#     "petpoojaCustomerId": "CUST_001",
#     "migrationStatus": "completed"
#   }
# }
```

### Check Firestore After Login ✅
```
- User document updated:
  ✅ firebaseUid added
  ✅ migrationStatus: "completed"
  ✅ legacyPasswordHash removed
  
- Orders linked:
  ✅ All orders now have firebaseUid
  ✅ wordpressOrderId preserved
  ✅ petpoojaOrderId preserved
```

## Step 9: Test New Registration ✅

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "phone": "+919876543211"
  }'

# Expected response:
# {
#   "success": true,
#   "message": "User registered successfully",
#   "customToken": "eyJhbGc...",
#   "user": {
#     "uid": "firebase-uid-xyz",
#     "email": "newuser@example.com",
#     "phone": "+919876543211",
#     "source": "firebase",
#     "migrationStatus": "completed"
#   }
# }
```

## Step 10: Frontend Integration ✅

### In your Next.js app:

```typescript
// pages/login.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { legacyLogin, error, loading } = useAuth();

  const handleLegacyLogin = async (e) => {
    e.preventDefault();
    const result = await legacyLogin(email, password);
    if (result.success) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleLegacyLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

## Troubleshooting

### "Firebase Admin initialization failed"
```bash
✅ Solution:
1. Check firebase-applet-config.json exists in backend/
2. Verify FIREBASE_DATABASE_URL in .env.local
3. Ensure service account has Firestore permissions
```

### "CSV file not found"
```bash
✅ Solution:
1. Create backend/data/ directory
2. Verify file names match (users.csv, products.csv, orders.csv)
3. Check CSV is in correct format with headers
```

### "Invalid password" on login
```bash
✅ Solution:
1. Verify hashed_password is bcrypt or WordPress phpass format
2. For phpass hashes, ensure they start with $P$ or $H$
3. Test with known password from WordPress
```

### Orders not linking
```bash
✅ Solution:
1. Verify wordpressUserId in orders.csv matches users.csv
2. Check items_json is valid JSON format
3. Ensure all product references exist
```

## Next: Petpooja POS Integration

```bash
# After migration is complete, integrate POS:

# 1. Verify petpoojaCustomerId and petpoojaOrderId preserved
# 2. Test POS order creation with Firebase UID
# 3. Ensure phone number matching works
# 4. Set up order sync webhook

# See: MIGRATION_GUIDE.md → Petpooja POS Integration
```

## Monitoring

### Check Migration Status
```bash
# In Firebase Console, run query:
db.collection('users')
  .where('migrationStatus', '==', 'pending')
  .count()
  .get()

# Shows remaining unmigrated users
```

### View Migration Logs
```bash
# In Firebase Console:
Firestore → Collections → migrationLogs
→ Shows each migration run, records processed, errors
```

### Monitor in Production
```bash
# Check real-time stats
curl http://localhost:3000/api/migration/stats

# Expected:
{
  "totalUsers": 50,
  "usersMigrated": 35,
  "usersPending": 15,
  "productCount": 125,
  "orderCount": 3400
}
```

## Production Deployment

### Before Going Live:

✅ Test with production data
✅ Verify all orders linked
✅ Confirm Petpooja integration works
✅ Test legacy login with real users
✅ Set up monitoring/alerts
✅ Brief support team on new flows
✅ Plan user communication

### Deployment Steps:

```bash
# 1. Deploy backend
npm run build
npm start

# 2. Deploy frontend with new auth components
npm run build && npm deploy

# 3. Enable legacy login in UI
# 4. Monitor for errors in first 24h
# 5. Keep WordPress backup for rollback

# See MIGRATION_GUIDE.md for detailed production checklist
```

---

**You're all set!** 🎉

- Migration system is ready
- Legacy users can login
- New users can register
- Petpooja POS integration maintained
- Data integrity preserved

For detailed documentation, see:
- `MIGRATION_GUIDE.md` - Complete migration guide
- `API_DOCUMENTATION.md` - API reference
- `backend/README.md` - Backend setup
