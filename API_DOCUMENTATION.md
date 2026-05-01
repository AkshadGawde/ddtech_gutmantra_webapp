# Auth & Migration API Documentation

## Base URL
```
http://localhost:3000/api
https://api.gutmantra.com/api  # Production
```

## Authentication

### Token Types
- **Firebase ID Token**: Used for all authenticated requests after login
  ```
  Authorization: Bearer {firebaseIdToken}
  ```
- **Custom Token**: Returned after legacy login or registration for immediate client-side login
  ```javascript
  // Use with Firebase SDK
  firebase.auth().signInWithCustomToken(customToken);
  ```

---

## Endpoints

### 1. Legacy Login (WordPress Users)
Allows users with WordPress accounts to login and migrate to Firebase.

**Endpoint:**
```
POST /auth/legacy-login
```

**Description:**
Verifies user's legacy WordPress password, creates Firebase Auth account, and migrates all associated data.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "user_password"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's plaintext password |

**Response (Success):**
```json
{
  "success": true,
  "message": "Legacy user successfully migrated and logged in",
  "customToken": "eyJhbGc...",
  "user": {
    "uid": "firebase-uid-abc123",
    "email": "john@example.com",
    "phone": "+919876543210",
    "petpoojaCustomerId": "CUST_001",
    "migrationStatus": "completed"
  }
}
```

**Response (Error - Invalid Credentials):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Response (Error - Already Migrated):**
```json
{
  "success": false,
  "error": "User already migrated. Please use normal login.",
  "code": "ALREADY_MIGRATED"
}
```

**Status Codes:**
- 200: Login successful
- 400: Missing required fields or already migrated
- 401: Invalid email/password
- 500: Server error

**What Happens:**
1. ✅ User found in Firestore by email
2. ✅ Password verified against stored hash
3. ✅ Firebase Auth user created
4. ✅ Firestore user document updated with Firebase UID
5. ✅ All orders linked to Firebase UID
6. ✅ Legacy password hash removed for security
7. ✅ Custom token generated for immediate client login

**Client Usage (Next.js):**
```typescript
// 1. Call legacy login endpoint
const response = await fetch('/api/auth/legacy-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { customToken, user } = await response.json();

// 2. Sign in with Firebase using custom token
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const auth = getAuth();
await auth.signInWithCustomToken(customToken);

// 3. Now user is logged in!
```

---

### 2. Firebase Login
Login using Firebase Auth (for non-legacy users).

**Endpoint:**
```
POST /auth/login
```

**Description:**
Verifies Firebase ID token and returns user data from Firestore.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1In0..."
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| idToken | string | Yes | Firebase ID token from Firebase Auth |

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-uid-abc123",
    "email": "john@example.com",
    "phone": "+919876543210",
    "firestoreId": "firestore-doc-id",
    "migrationStatus": "completed"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Status Codes:**
- 200: Login successful
- 400: Missing ID token
- 401: Invalid/expired token
- 500: Server error

---

### 3. Register New User
Create a new user account with Firebase Auth.

**Endpoint:**
```
POST /auth/register
```

**Description:**
Creates new Firebase Auth user and Firestore user document. For new users (not migrating from WordPress).

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "secure_password_123",
  "phone": "+919876543210"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email (must be unique) |
| password | string | Yes | Password (min 6 characters) |
| phone | string | No | User's phone number (E.164 format) |

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "customToken": "eyJhbGc...",
  "user": {
    "uid": "firebase-uid-xyz789",
    "email": "newuser@example.com",
    "phone": "+919876543210",
    "source": "firebase",
    "migrationStatus": "completed"
  }
}
```

**Response (Error - Email Exists):**
```json
{
  "success": false,
  "error": "Email already in use"
}
```

**Response (Error - Weak Password):**
```json
{
  "success": false,
  "error": "Password should be at least 6 characters long"
}
```

**Status Codes:**
- 200: Registration successful
- 400: Missing fields or invalid format
- 409: Email already in use
- 500: Server error

**Client Usage:**
```typescript
// 1. Call register endpoint
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, phone })
});

const { customToken } = await response.json();

// 2. Sign in with custom token
await auth.signInWithCustomToken(customToken);
```

---

### 4. Get User Profile
Retrieve authenticated user's profile information.

**Endpoint:**
```
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer {firebaseIdToken}
```

**Description:**
Returns user's complete profile data from Firestore.

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-uid-abc123",
    "email": "john@example.com",
    "phone": "+919876543210",
    "wordpressUserId": "WP_USER_001",
    "petpoojaCustomerId": "CUST_001",
    "migrationStatus": "completed",
    "source": "legacy",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-04-28T15:45:00Z"
  }
}
```

**Response (Error - Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Response (Error - User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid/missing token
- 404: User not found
- 500: Server error

---

### 5. Logout
Logout current user.

**Endpoint:**
```
POST /auth/logout
```

**Description:**
Server-side logout handling. Client should also sign out from Firebase Auth.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Client Usage:**
```typescript
// 1. Sign out from Firebase
import { signOut } from 'firebase/auth';
await signOut(auth);

// 2. Call logout endpoint (optional for cleanup)
await fetch('/api/auth/logout', { method: 'POST' });

// 3. Redirect to login
window.location.href = '/login';
```

---

## Order APIs

### Get User Orders
Retrieve all orders for the authenticated user.

**Endpoint:**
```
GET /api/orders
```

**Headers:**
```
Authorization: Bearer {firebaseIdToken}
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "firestore-order-id",
      "wordpressOrderId": "WP_ORD_001",
      "firebaseUid": "user-uid-123",
      "items": [
        {
          "productId": "WP_PROD_001",
          "name": "Aata Wheat Flour",
          "quantity": 2,
          "price": 350
        }
      ],
      "totalAmount": 899,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Data Models

### User Document
```typescript
interface User {
  uid: string;                          // Firebase UID
  email: string;                        // User email
  phone?: string;                       // Phone number
  wordpressUserId?: string;             // Legacy WordPress ID (preserved)
  petpoojaCustomerId?: string;          // POS system ID (never deleted)
  legacyPasswordHash?: null;            // Removed after migration
  firebaseUid?: string;                 // Firebase UID (added on login)
  migrationStatus: 'pending' | 'completed';
  source: 'legacy' | 'firebase';        // Data source
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Document
```typescript
interface Order {
  id: string;
  wordpressOrderId: string;             // Original WordPress order ID
  wordpressUserId: string;              // Original WordPress user ID
  firebaseUid?: string;                 // Added after user migration
  petpoojaOrderId?: string;             // POS order ID (for sync)
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Document
```typescript
interface Product {
  id: string;
  wordpressProductId: string;
  name: string;
  category: 'atta' | 'oils' | 'spices';
  description?: string;
  price: number;
  unit: string;                         // e.g., "1kg", "500g", "1ltr"
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Codes

| Code | HTTP | Message | Action |
|------|------|---------|--------|
| INVALID_CREDENTIALS | 401 | Invalid email or password | Retry with correct credentials |
| EMAIL_NOT_FOUND | 401 | User not found | Register new account or check email |
| ALREADY_MIGRATED | 400 | User already migrated | Use normal Firebase login |
| EMAIL_EXISTS | 409 | Email already registered | Use login instead |
| INVALID_TOKEN | 401 | Token expired or invalid | Request new token |
| UNAUTHORIZED | 401 | No token provided | Include Authorization header |
| WEAK_PASSWORD | 400 | Password too weak | Use min 6 character password |
| MISSING_FIELDS | 400 | Required fields missing | Check request payload |

---

## Migration Flow Diagram

```
┌─────────────────────────────────────────┐
│  User Attempts Login                    │
│  (email, password)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  POST /api/auth/legacy-login            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
   SUCCESS         ALREADY_MIGRATED
       │               │
       │               └──► Use normal login
       │
       ▼
   ✅ Firebase Auth user created
   ✅ Firestore user updated
   ✅ Orders linked
   ✅ Legacy hash removed
   ✅ Custom token returned
       │
       ▼
   User gets customToken
   Signs in with Firebase SDK
   Now fully migrated!
```

---

## Integration Examples

### React/Next.js
```typescript
// components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { legacyLogin, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await legacyLogin(email, password);
    if (result.success) {
      // User is now logged in with Firebase
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### useAuth Hook
```typescript
// hooks/useAuth.ts
import { useAuth as useFirebaseAuth } from 'reactfire';
import { useCallback, useState } from 'react';

export function useAuth() {
  const { user, auth } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const legacyLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/auth/legacy-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        // Sign in with custom token
        await auth.signInWithCustomToken(data.customToken);

        return { success: true, user: data.user };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [auth]
  );

  return { user, legacyLogin, loading, error };
}
```

---

## Rate Limiting

Current implementation has no rate limiting. For production:

```typescript
// Recommended: 5 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip,
  })
);
```

---

## Security Best Practices

✅ **DO:**
- Use HTTPS in production
- Validate all inputs server-side
- Store Firebase config on client
- Never expose Firebase private key
- Use custom tokens for immediate login after migration
- Rotate credentials regularly
- Monitor migration logs

❌ **DON'T:**
- Send password hash over HTTP
- Store Firebase credentials in code
- Expose /migration endpoints publicly
- Trust client-side validation alone
- Use custom tokens with long expiry

---

## Support

For issues or questions about the API:
1. Check migration logs in Firestore
2. Review error messages and codes
3. Verify Firebase configuration
4. Check Firestore security rules
5. Ensure valid credentials in requests
