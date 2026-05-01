# Backend - Migration & Auth System

## Overview

Production-ready Node.js + Express + Firebase migration and authentication system for WordPress to Firebase transition.

## Directory Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── firebaseAdmin.ts       # Firebase Admin SDK initialization
│   │   └── passwordVerification.ts # Password hash verification (bcrypt/phpass)
│   ├── routes/
│   │   └── auth.ts                # Auth endpoints (login, register, legacy-login)
│   └── utils/
│       ├── migrationUtils.ts      # Firestore operations for migration
│       ├── orderLinking.ts        # Order relationship management
│       └── migrationHelpers.ts    # Helper utilities for monitoring/debugging
├── scripts/
│   └── migrate.ts                 # Main migration script (users, products, orders)
├── data/
│   ├── users.csv                  # User export from WordPress
│   ├── products.csv               # Product export from WordPress
│   └── orders.csv                 # Orders export from WordPress
├── server.ts                      # Express server (development)
├── server.mjs                     # Express server (production)
├── firebase-applet-config.json    # Firebase service account credentials
├── firestore.rules                # Firestore security rules
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── .env.local                     # Environment variables
```

## Environment Variables

```bash
# .env.local
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NODE_ENV=development
PORT=3000
```

## Installation

```bash
# Install dependencies
npm install

# Start in development mode (with hot reload)
npm run dev

# Start in production mode
npm start

# Run migration script
npm run migrate
npm run migrate data/custom-users.csv data/custom-products.csv data/custom-orders.csv
```

## Services

### Firebase Admin Service (`src/services/firebaseAdmin.ts`)

Manages Firebase Admin SDK initialization and provides access to Auth and Firestore.

```typescript
import { initializeFirebaseAdmin, getFirestoreDb, getAuth } from './services/firebaseAdmin';

// Initialize once
initializeFirebaseAdmin();

// Use throughout app
const db = getFirestoreDb();
const auth = getAuth();
```

### Password Verification (`src/services/passwordVerification.ts`)

Handles verification of legacy WordPress password hashes.

```typescript
import { verifyPassword, hashPassword } from './services/passwordVerification';

// Verify legacy hash
const isValid = await verifyPassword(plaintext, legacyHash);

// Hash new password
const hash = await hashPassword(password);
```

Supports:
- ✅ bcrypt ($2... hashes)
- ✅ WordPress phpass ($P$, $H$ hashes)
- ✅ Custom hash algorithms

## Routes

### Auth Routes (`src/routes/auth.ts`)

```
POST /api/auth/legacy-login   # Migrate WordPress user
POST /api/auth/login          # Firebase Auth login
POST /api/auth/register       # Register new user
GET  /api/auth/profile        # Get user profile
POST /api/auth/logout         # Logout
```

### Request/Response Examples

**Legacy Login:**
```bash
POST /api/auth/legacy-login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "plaintext_password"
}

# Response:
{
  "success": true,
  "customToken": "eyJhbGc...",
  "user": {
    "uid": "firebase-uid",
    "email": "user@example.com",
    "phone": "+919876543210",
    "petpoojaCustomerId": "CUST_001",
    "migrationStatus": "completed"
  }
}
```

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure_password",
  "phone": "+919876543210"
}
```

## Utilities

### Migration Utils (`src/utils/migrationUtils.ts`)

Database operations for migration:

```typescript
// Create user in Firestore
const userId = await createUser({
  email,
  phone,
  wordpressUserId,
  petpoojaCustomerId,
  legacyPasswordHash,
  migrationStatus: 'pending'
});

// Check if user exists
const exists = await userExists(email);

// Update user with Firebase UID
await updateUserWithFirebaseUid(userId, firebaseUid);

// Link orders to Firebase UID
const linked = await linkOrdersToFirebaseUid(wordpressUserId, firebaseUid);

// Get migration statistics
const stats = await getMigrationStats();
```

### Order Linking (`src/utils/orderLinking.ts`)

Manage order relationships:

```typescript
// Link orders from WordPress to Firebase UID
await linkOrdersToUser(wordpressUserId, firebaseUid);

// Get all orders for user
const orders = await getUserOrders(firebaseUid);

// Get order by Petpooja ID (for POS integration)
const order = await getOrderByPetpoojaId(petpoojaOrderId);

// Get orders by phone (for POS matching)
const orders = await getOrdersByPhone(phone);

// Update order status
await updateOrderStatus(orderId, 'completed');

// Verify order data consistency
const { valid, errors } = await verifyOrderConsistency(orderId);
```

### Migration Helpers (`src/utils/migrationHelpers.ts`)

Monitoring and debugging utilities:

```typescript
// Get unmigrated users
const pending = await getUnmigratedUsers();

// Get migrated users
const migrated = await getMigratedUsers();

// Find user by email
const user = await getUserByEmail(email);

// Find user by Firebase UID
const user = await getUserByFirebaseUid(uid);

// Find user by WordPress ID
const user = await getUserByWordPressId(wordpressUserId);

// Verify user data consistency
const { valid, errors } = await verifyUserConsistency(userId);

// Get full migration report
const report = await getMigrationReport();

// Find data inconsistencies
const issues = await findInconsistencies();
```

## Migration Script (`scripts/migrate.ts`)

Imports data from CSV files into Firestore.

### Features:
✅ Idempotent (safe to re-run)
✅ Validates data before import
✅ Logs all migrations
✅ Skips duplicates automatically
✅ Handles errors gracefully
✅ Preserves all data relationships

### Usage:

```bash
# Default locations (data/users.csv, data/products.csv, data/orders.csv)
npm run migrate

# Custom locations
npm run migrate custom/users.csv custom/products.csv custom/orders.csv
```

### CSV Format:

**users.csv:**
```
email,phone,wordpress_user_id,hashed_password,petpooja_customer_id
john@example.com,+919876543210,WP_USER_001,$2y$10$...,CUST_001
```

**products.csv:**
```
wordpress_product_id,name,category,description,price,unit,image_url
WP_PROD_001,Aata,atta,Flour,350,1kg,https://...
```

**orders.csv:**
```
wordpress_order_id,wordpress_user_id,petpooja_order_id,items_json,total_amount,status
WP_ORD_001,WP_USER_001,POS_ORD_001,"[...]",899,completed
```

## Firestore Collections

### users/
```javascript
{
  email: "user@example.com",
  phone: "+919876543210",
  wordpressUserId: "WP_USER_001",
  petpoojaCustomerId: "CUST_001",
  legacyPasswordHash: "$2y$10$...", // Removed after migration
  firebaseUid: "firebase-uid",       // Added on login
  migrationStatus: "pending" | "completed",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### products/
```javascript
{
  wordpressProductId: "WP_PROD_001",
  name: "Aata Wheat Flour",
  category: "atta",
  description: "Premium wheat flour",
  price: 350,
  unit: "1kg",
  imageUrl: "...",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### orders/
```javascript
{
  wordpressOrderId: "WP_ORD_001",
  wordpressUserId: "WP_USER_001",
  firebaseUid: "firebase-uid", // Added on user login
  petpoojaOrderId: "POS_ORD_001",
  items: [...],
  totalAmount: 899,
  status: "pending" | "completed" | "cancelled",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### migrationLogs/
```javascript
{
  timestamp: date,
  type: "users" | "products" | "orders",
  status: "started" | "completed" | "failed",
  recordsProcessed: 50,
  recordsSuccessful: 50,
  recordsFailed: 0,
  errors: ["..."]
}
```

## Firestore Security Rules

Updated rules allow:
- ✅ Users to read/write their own documents
- ✅ Admin access via email check or custom claims
- ✅ Public read of products
- ✅ Protected migration logs (admin only)
- ✅ Order access by user or admin

See `firestore.rules` for details.

## Data Integrity

### What's Preserved:
✅ wordpressUserId (NEVER deleted)
✅ wordpressOrderId (NEVER deleted)
✅ petpoojaCustomerId (NEVER deleted)
✅ petpoojaOrderId (NEVER deleted)
✅ Order history and items

### What's Migrated:
✅ Users → Firestore + Firebase Auth
✅ Products → Firestore
✅ Orders → Firestore with user references

### What's Removed:
❌ legacyPasswordHash (after successful login)
❌ Duplicate data

## Petpooja POS Integration

Orders are linked with:
- `petpoojaOrderId` - Original POS order reference
- `petpoojaCustomerId` - POS customer ID
- `phone` - For customer matching

This ensures POS continues working without disruption.

## Error Handling

All routes include comprehensive error handling:
- ✅ Input validation
- ✅ Firebase Auth errors
- ✅ Firestore operation failures
- ✅ Migration inconsistencies
- ✅ Detailed error messages

## Testing

### Manual Testing:

```bash
# Start server
npm run dev

# Test legacy login
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password"}'

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password","phone":"+919876543210"}'
```

### Integration with Frontend:

See `API_DOCUMENTATION.md` for complete integration examples and React/Next.js code samples.

## Production Checklist

Before deploying:

- [ ] Firebase project configured
- [ ] Service account credentials secure
- [ ] Firestore security rules updated
- [ ] Migration script runs successfully
- [ ] All data verified in Firestore
- [ ] Legacy login tested with real users
- [ ] Petpooja POS integration verified
- [ ] Error monitoring set up
- [ ] Rate limiting configured
- [ ] HTTPS enabled

## Monitoring & Logs

### Check Migration Status:
```typescript
const stats = await getMigrationStats();
console.log(`Migrated: ${stats.usersMigrated}/${stats.usersTotal}`);
```

### View Migration Logs:
```bash
# In Firebase Console:
Firestore → Collections → migrationLogs
```

### Monitor Errors:
```bash
# Check console for errors
# Review Firestore security rules violations
# Monitor Firebase Auth usage
```

## Troubleshooting

### Firebase Admin init fails
1. Check `firebase-applet-config.json` exists
2. Verify `FIREBASE_DATABASE_URL` in `.env.local`
3. Ensure service account has Firestore permissions

### Migration script fails
1. Verify CSV format (check headers)
2. Ensure data directory exists (`backend/data/`)
3. Check file encoding (UTF-8)

### Legacy login fails
1. Verify password hash format
2. Check email exists in Firestore
3. Ensure Firebase Auth enabled

### Orders not linking
1. Verify `wordpressUserId` matches in CSVs
2. Check `items_json` is valid JSON
3. Ensure products exist

## Performance Optimization

### Firestore Indexes:
Composite indexes recommended for:
- `users (email, migrationStatus)`
- `orders (firebaseUid, createdAt DESC)`
- `orders (petpoojaOrderId)`

### Batch Operations:
Migration script uses batch writes (500 ops/batch) for optimal performance.

## Support & Documentation

- **Migration Guide:** See `MIGRATION_GUIDE.md`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Quick Start:** See `QUICK_START.md`
- **Root README:** See `README.md`

## License

Copyright © 2024. All rights reserved.
