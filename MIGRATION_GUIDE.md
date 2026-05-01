# WordPress to Firebase Migration Guide

## Overview

This migration system enables seamless transition from WordPress/WooCommerce to a modern Firebase + Next.js + Node.js stack while maintaining complete data integrity and preserving critical integrations (like Petpooja POS).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  WordPress MySQL Database                               │
│  - Users (with bcrypt/phpass hashes)                    │
│  - Products                                              │
│  - Orders + Order Items                                  │
└────────────────────┬────────────────────────────────────┘
                     │ (CSV Export)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Migration Script (Node.js)                              │
│  - Imports CSV files                                     │
│  - Validates data                                        │
│  - Stores in Firestore                                   │
│  - Idempotent (safe to re-run)                           │
│  - Generates migration logs                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Firestore Database                                      │
│  ├─ users/ (pending migration)                           │
│  │  └─ legacyPasswordHash stored                         │
│  ├─ products/                                            │
│  ├─ orders/                                              │
│  └─ migrationLogs/                                       │
└─────────────────────────────────────────────────────────┘

                     │
    Legacy User Login│
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Express API - /auth/legacy-login                        │
│  1. Find user in Firestore                              │
│  2. Verify legacy password hash                         │
│  3. Create Firebase Auth user                           │
│  4. Link all orders (WP UID → Firebase UID)             │
│  5. Remove legacy hash (security)                        │
│  6. Return custom Firebase token                         │
└─────────────────────────────────────────────────────────┘
```

## Data Model

### Users Collection
```javascript
users/
  {userId}/
    {
      email: "user@example.com",
      phone: "+919876543210",
      wordpressUserId: "WP_USER_001",           // NEVER delete
      petpoojaCustomerId: "CUST_001",            // For POS
      legacyPasswordHash: "$2y$10$...",          // Removed after migration
      firebaseUid: "firebase-uid-123",           // Added on login
      migrationStatus: "pending" | "completed",
      createdAt: timestamp,
      updatedAt: timestamp
    }
```

### Products Collection
```javascript
products/
  {productId}/
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

### Orders Collection
```javascript
orders/
  {orderId}/
    {
      wordpressOrderId: "WP_ORD_001",            // NEVER delete
      wordpressUserId: "WP_USER_001",            // Maintained
      firebaseUid: "firebase-uid-123",           // Added on login
      petpoojaOrderId: "POS_ORD_001",            // For POS
      items: [
        { productId, name, quantity, price }
      ],
      totalAmount: 899,
      status: "pending" | "completed" | "cancelled",
      createdAt: timestamp,
      updatedAt: timestamp
    }
```

## CSV Format Requirements

### users.csv
```
email,phone,wordpress_user_id,hashed_password,petpooja_customer_id
john@example.com,+919876543210,WP_USER_001,$2y$10$...,CUST_001
```

### products.csv
```
wordpress_product_id,name,category,description,price,unit,image_url
WP_PROD_001,Aata,atta,Flour,350,1kg,https://...
```

### orders.csv
```
wordpress_order_id,wordpress_user_id,petpooja_order_id,items_json,total_amount,status
WP_ORD_001,WP_USER_001,POS_ORD_001,"[{...}]",899,completed
```

## Setup Instructions

### 1. Prerequisites
```bash
# Install dependencies
npm install

# Ensure Firebase credentials are set up
# Place firebase-applet-config.json in backend directory
# Set FIREBASE_DATABASE_URL in .env
```

### 2. Prepare CSV Files
```bash
# Export from WordPress MySQL
# Place in backend/data/ directory:
# - data/users.csv
# - data/products.csv
# - data/orders.csv
```

### 3. Run Migration
```bash
# Run the migration script
npm run migrate

# Or with custom CSV paths
npm run migrate data/users.csv data/products.csv data/orders.csv
```

### 4. Start Server
```bash
npm run dev          # Development (with tsx watch)
npm start            # Production
```

## API Endpoints

### Legacy Login (For Migrating Users)
```
POST /api/auth/legacy-login

Request:
{
  "email": "user@example.com",
  "password": "plaintext-password"
}

Response:
{
  "success": true,
  "message": "Legacy user successfully migrated and logged in",
  "customToken": "firebase-custom-token",
  "user": {
    "uid": "firebase-uid-123",
    "email": "user@example.com",
    "phone": "+919876543210",
    "petpoojaCustomerId": "CUST_001",
    "migrationStatus": "completed"
  }
}
```

### Firebase Login
```
POST /api/auth/login

Request:
{
  "idToken": "firebase-id-token"
}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Register New User
```
POST /api/auth/register

Request:
{
  "email": "newuser@example.com",
  "password": "password123",
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "customToken": "firebase-custom-token",
  "user": { ... }
}
```

### Get User Profile
```
GET /api/auth/profile
Authorization: Bearer {firebase-id-token}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Logout
```
POST /api/auth/logout

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Migration Flow (Detailed)

### Phase 1: Data Import
1. **Users**: Import with `migrationStatus: "pending"`
   - Store legacyPasswordHash
   - Preserve wordpressUserId
   - Store petpoojaCustomerId

2. **Products**: Import with wordpressProductId mapping

3. **Orders**: Import with wordpressUserId and petpoojaOrderId
   - Orders NOT yet linked to Firebase UIDs

### Phase 2: User Login Migration
When user attempts login with legacy credentials:

```
1. Find user by email in Firestore
2. Verify password against legacyPasswordHash
   └─ Use bcrypt or WordPress phpass algorithm
3. Create Firebase Auth user
   └─ Handle "email already exists" gracefully
4. Link orders:
   └─ Update all orders: wordpressUserId → add firebaseUid
5. Update user in Firestore:
   └─ Add firebaseUid
   └─ Set migrationStatus = "completed"
   └─ Remove legacyPasswordHash (security)
6. Return custom Firebase token for immediate login
```

### Phase 3: Data Integrity
- **Never delete wordpressUserId** (needed for order history)
- **Never delete petpoojaOrderId** (POS system critical)
- **Never delete wordpressOrderId** (historical reference)
- Always maintain bidirectional relationships

## Error Handling

### Safe to Re-run
The migration script is idempotent:
- Checks if user/product/order already exists
- Skips existing records
- Logs errors without stopping
- Can be run multiple times safely

### Duplicate User Prevention
```javascript
// Script checks for existing users
const exists = await userExists(email);
if (exists) {
  console.log("⏭️  User already exists");
  continue;
}
```

### Password Verification Fallback
```javascript
// Legacy login handles:
✅ bcrypt hashes ($2...)
✅ WordPress phpass ($P$, $H$)
✅ Custom hash algorithms
❌ If verification fails → return 401
```

## Petpooja POS Integration

### Maintaining Relationships
```javascript
// On order creation
{
  petpoojaOrderId: "POS_ORD_001",
  petpoojaCustomerId: "CUST_001",  // Links to POS system
  phone: "+919876543210"             // Backup matching
}
```

### Order Lookup by Phone
```javascript
// POS can look up orders by customer phone
GET /api/orders?phone=+919876543210
→ Returns all orders for that customer
```

### Syncing Orders
```javascript
// After Petpooja creates order
POST /api/orders/sync-petpooja
{
  petpoojaOrderId: "POS_ORD_001",
  customerId: "CUST_001"
}
→ Links to user via customerId or phone
```

## Monitoring & Logs

### Migration Logs
Stored in `migrationLogs` collection:
```javascript
{
  timestamp: Date,
  type: "users" | "products" | "orders",
  status: "started" | "completed" | "failed",
  recordsProcessed: number,
  recordsSuccessful: number,
  recordsFailed: number,
  errors: string[]
}
```

### Checking Migration Status
```bash
# Query Firestore
db.collection("migrationLogs")
  .orderBy("timestamp", "desc")
  .limit(10)
  .get()
```

### User Migration Progress
```bash
# Get stats
db.collection("users")
  .where("migrationStatus", "==", "pending")
  .get()
  // Shows how many users haven't logged in yet
```

## Security Considerations

### Password Hashing
- ✅ bcrypt hashes verified during legacy login
- ✅ Firebase Auth handles new password hashing
- ✅ Legacy hashes removed after successful migration
- ✅ Never log passwords

### Firebase Auth Integration
- ✅ Verified ID tokens required for protected routes
- ✅ Custom tokens for immediate login after migration
- ✅ Email verification enforced
- ✅ Phone numbers validated

### Data Privacy
- ✅ PII only stored where necessary
- ✅ POS identifiers maintained separately
- ✅ Order history preserved with original IDs
- ✅ Firestore security rules enforce access control

## Troubleshooting

### Issue: "Firebase Admin initialization failed"
```
Solution:
1. Verify firebase-applet-config.json exists
2. Check FIREBASE_DATABASE_URL in .env
3. Ensure credentials have admin privileges
```

### Issue: "CSV file not found"
```
Solution:
1. Create data/ directory in backend/
2. Place CSV files: data/users.csv, data/products.csv, data/orders.csv
3. Run: npm run migrate data/users.csv data/products.csv data/orders.csv
```

### Issue: "Users already exists"
```
Solution (expected):
Migration script is idempotent - this is normal behavior.
Script automatically skips duplicates and continues.
```

### Issue: "Password verification failed"
```
Solution:
1. Verify hashed_password format in CSV
2. Ensure bcrypt ($2...) or phpass ($P$/$H$) format
3. Check password encoding (UTF-8)
```

### Issue: "Order linking failed"
```
Solution:
1. Verify wordpressUserId in orders.csv matches users.csv
2. Check order items JSON format
3. Ensure all product IDs exist in products collection
```

## Testing

### Local Testing with Sample Data
```bash
# Use included sample CSVs
npm run migrate data/users.csv data/products.csv data/orders.csv

# Test legacy login
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"actual_password"}'

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","phone":"+919876543210"}'
```

## Performance Optimization

### Firestore Indexes
```javascript
// Recommended indexes
// Composite: users (email, migrationStatus)
// Composite: orders (firebaseUid, createdAt DESC)
// Composite: orders (petpoojaOrderId)
```

### Batch Operations
```javascript
// For large migrations, use batch writes
const batch = db.batch();
// Add up to 500 operations
batch.commit();
```

## Rollback / Troubleshooting

### If Migration Fails
```bash
# 1. Check migration logs
db.collection("migrationLogs").get()

# 2. Delete incomplete collections
# 3. Fix CSV format/data
# 4. Re-run migration (it's idempotent)
```

### Verifying Data Integrity
```javascript
// Check all orders have required fields
db.collection("orders")
  .where("wordpressOrderId", "==", null)
  .get()  // Should be empty

// Check users with migration status
db.collection("users")
  .where("migrationStatus", "==", "pending")
  .get()  // Shows unmigrated users
```

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Export WordPress data to CSVs
3. ✅ Review and validate CSV format
4. ✅ Run migration script
5. ✅ Test legacy login flows
6. ✅ Test new registration flows
7. ✅ Verify Petpooja POS integration
8. ✅ Deploy to production
9. ✅ Monitor migration logs
10. ✅ Coordinate cutover with users

## Support

For issues or questions:
1. Check migrationLogs collection
2. Review error messages in console
3. Verify CSV format matches specification
4. Check Firestore security rules
5. Ensure Firebase credentials are valid
