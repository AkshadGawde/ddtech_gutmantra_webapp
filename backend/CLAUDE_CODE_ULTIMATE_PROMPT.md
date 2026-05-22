# 🚀 CLAUDE CODE ULTIMATE PROMPT - Copy & Paste This Entire Text

---

## Complete WhatsApp Business API OTP Authentication Setup

I need to implement a complete WhatsApp Business API OTP authentication system for my GutMantra food ordering backend. This replaces Firebase OTP with Meta WhatsApp Business Cloud API.

### PROJECT CONTEXT:
- **Project**: GutMantra food ordering platform
- **Backend**: Express.js with TypeScript
- **Database**: Firebase Firestore
- **Frontend**: React.js
- **Current User Structure in Firestore**:
  - Collection: `users`
  - Fields: id, phone (currently null), firstName, lastName, email, address, createdAt, updatedAt, migrationStatus, wordpressUserId
- **WhatsApp Credentials Ready**:
  - Phone ID: 1108455795690267
  - Business Account ID: 1495438322369061
  - Template Name: gutmantra_otp
  - Access Token: (will be provided in .env)

---

## IMPLEMENTATION REQUIREMENTS:

### PART 1: CREATE UTILITY FILES

#### File 1: Create `src/utils/otpUtils.ts`

```typescript
import crypto from 'crypto';

/**
 * Validates phone number format
 * Accepts: +91XXXXXXXXXX or 91XXXXXXXXXX or 9XXXXXXXXXX
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
  let normalizedPhone = phone.replace(/[^0-9+]/g, '');
  
  if (normalizedPhone.startsWith('91')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (normalizedPhone.startsWith('+')) {
    // Already has +
  } else if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+91' + normalizedPhone.slice(1);
  } else {
    normalizedPhone = '+91' + normalizedPhone;
  }
  
  return /^\+91[6-9]\d{9}$/.test(normalizedPhone);
};

/**
 * Normalizes phone number to +91XXXXXXXXXX format
 */
export const normalizePhoneNumber = (phone: string): string => {
  let normalized = phone.replace(/[^0-9+]/g, '');

  if (normalized.startsWith('91')) {
    return '+' + normalized;
  } else if (normalized.startsWith('+')) {
    return normalized;
  } else if (normalized.startsWith('0')) {
    return '+91' + normalized.slice(1);
  } else {
    return '+91' + normalized;
  }
};

/**
 * Generates a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hashes OTP for secure storage
 */
export const hashOTP = (otp: string): string => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
};

/**
 * Verifies hashed OTP
 */
export const verifyHashedOTP = (plainOTP: string, hashedOTP: string): boolean => {
  const hash = hashOTP(plainOTP);
  return hash === hashedOTP;
};

/**
 * Formats phone number for WhatsApp API (removes +)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  return phone.replace('+', '');
};

/**
 * Validates OTP format (6 digits)
 */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
```

---

#### File 2: Create `src/utils/jwtUtils.ts`

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  phone: string;
  iat: number;
}

/**
 * Generates JWT token
 */
export const generateToken = (userId: string, phone: string): string => {
  return jwt.sign(
    {
      userId,
      phone,
      iat: Date.now(),
    },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
};

/**
 * Verifies JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Extracts token from Authorization header
 * Expects: "Bearer <token>"
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  req.user = payload;
  next();
};

/**
 * Middleware to optionally verify JWT (doesn't fail if no token)
 */
export const optionalAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
```

---

### PART 2: CREATE WHATSAPP ROUTES FILE

#### File 3: Create `src/routes/whatsappRoutes.ts`

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import { validatePhoneNumber, generateOTP, hashOTP } from '../utils/otpUtils';

const router = express.Router();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'gutmantra_otp';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface OTPRequest {
  phone: string;
}

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

interface OTPData {
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  hashedOTP?: string;
}

/**
 * POST /api/whatsapp/send-otp
 * Generates OTP and sends it via WhatsApp template message
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as OTPRequest;

    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Use format: +91XXXXXXXXXX',
      });
    }

    const otp = generateOTP();
    const now = Date.now();
    const expiryTime = 10 * 60 * 1000; // 10 minutes

    const otpData: OTPData = {
      otp,
      createdAt: now,
      expiresAt: now + expiryTime,
      attempts: 0,
      verified: false,
      hashedOTP: hashOTP(otp),
    };

    const otpDocRef = db.collection('otpVerifications').doc(phone);
    await otpDocRef.set(otpData, { merge: true });

    try {
      const messagePayload = {
        messaging_product: 'whatsapp',
        to: phone.replace('+', ''),
        type: 'template',
        template: {
          name: WHATSAPP_TEMPLATE_NAME,
          language: {
            code: 'en_US',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
              ],
            },
          ],
        },
      };

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp OTP sent successfully:', response.data);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your WhatsApp',
        messageId: response.data.messages[0].id,
      });
    } catch (whatsappError: any) {
      console.error('WhatsApp API Error:', whatsappError.response?.data || whatsappError.message);

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via WhatsApp. Please try again.',
        error: process.env.NODE_ENV === 'development'
          ? whatsappError.response?.data?.error?.message
          : undefined,
      });
    }
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/whatsapp/verify-otp
 * Verifies the OTP and logs user in (creates JWT token)
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body as VerifyOTPRequest;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits',
      });
    }

    const otpDocRef = db.collection('otpVerifications').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this phone number. Please request a new one.',
      });
    }

    const otpData = otpDoc.data() as OTPData;

    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP already used. Please request a new one.',
      });
    }

    if (Date.now() > otpData.expiresAt) {
      await otpDocRef.delete();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.',
      });
    }

    if (otpData.attempts >= 5) {
      await otpDocRef.delete();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    if (otpData.otp !== otp) {
      await otpDocRef.update({
        attempts: otpData.attempts + 1,
      });

      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please try again.',
        attemptsRemaining: 5 - (otpData.attempts + 1),
      });
    }

    await otpDocRef.update({
      verified: true,
      verifiedAt: Date.now(),
    });

    const userRef = db.collection('users');
    const userSnapshot = await userRef.where('phone', '==', phone).get();

    let userId: string;
    let isNewUser = false;

    if (userSnapshot.empty) {
      isNewUser = true;
      const newUserRef = userRef.doc();
      userId = newUserRef.id;

      const newUser = {
        id: userId,
        phone,
        email: null,
        firstName: null,
        lastName: null,
        address: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        migrationStatus: 'new_whatsapp_signup',
        wordpressUserId: null,
      };

      await newUserRef.set(newUser);
    } else {
      userId = userSnapshot.docs[0].id;
    }

    const token = jwt.sign(
      {
        userId,
        phone,
        iat: Date.now(),
      },
      JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || '7d',
      }
    );

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      isNewUser,
      token,
      user: {
        id: userId,
        phone,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        email: userData?.email,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/whatsapp/resend-otp
 * Resends OTP if the user didn't receive it
 */
router.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as OTPRequest;

    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
      });
    }

    const otpDocRef = db.collection('otpVerifications').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (otpDoc.exists) {
      const otpData = otpDoc.data() as OTPData;
      const timeSinceCreation = Date.now() - otpData.createdAt;

      if (timeSinceCreation < 30 * 1000) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting another OTP',
          retryAfter: Math.ceil((30 * 1000 - timeSinceCreation) / 1000),
        });
      }
    }

    await otpDocRef.delete();

    const newOtp = generateOTP();
    const now = Date.now();
    const expiryTime = 10 * 60 * 1000;

    const otpData: OTPData = {
      otp: newOtp,
      createdAt: now,
      expiresAt: now + expiryTime,
      attempts: 0,
      verified: false,
      hashedOTP: hashOTP(newOtp),
    };

    await otpDocRef.set(otpData);

    const messagePayload = {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: WHATSAPP_TEMPLATE_NAME,
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: newOtp,
              },
            ],
          },
        ],
      },
    };

    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'New OTP sent to your WhatsApp',
    });
  } catch (error: any) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
```

---

### PART 3: CREATE CONFIGURATION FILES

#### File 4: Create `.env.example`

```
# WhatsApp Business API Configuration
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Server Configuration
PORT=5000
NODE_ENV=development
```

---

### PART 4: UPDATE EXISTING FILES

#### File 5: Update `src/server.ts`

At the top with other imports, add:
```typescript
import whatsappRoutes from './routes/whatsappRoutes';
```

Then in your express app setup (before other routes), add:
```typescript
// WhatsApp OTP Authentication Routes
app.use('/api/whatsapp', whatsappRoutes);
```

**Example of where to place it:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import whatsappRoutes from './routes/whatsappRoutes';  // ← ADD HERE
// ... other imports

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Routes
app.use('/api/whatsapp', whatsappRoutes);  // ← ADD HERE (before other routes)
app.use('/api/products', productRoutes);   // your other routes
app.use('/api/orders', orderRoutes);
// ... rest of your code
```

#### File 6: Update `.gitignore`

Make sure these lines exist (add if missing):
```
.env
.env.local
.env.*.local
```

---

### PART 5: DEPENDENCIES

Ensure these are installed via npm:
```bash
npm install axios jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

## VERIFICATION CHECKLIST:

After creating all files, verify:

1. ✅ All TypeScript files created without syntax errors
2. ✅ Imports are correct and resolvable
3. ✅ `src/config/firebase.ts` exists and exports `db`
4. ✅ `.env` is added to `.gitignore`
5. ✅ `server.ts` has whatsappRoutes import and registration
6. ✅ All exports are correct (default exports for router)
7. ✅ No console errors when running `npm run build`

---

## POST-CREATION INSTRUCTIONS:

1. **Create actual `.env` file** (never commit this):
   ```bash
   cp .env.example .env
   # Edit .env with actual WhatsApp credentials
   ```

2. **Install dependencies**:
   ```bash
   npm install axios jsonwebtoken
   ```

3. **Test backend**:
   ```bash
   npm run dev
   # Should see: ✓ Server running on http://localhost:5000
   ```

4. **Test health endpoint**:
   ```bash
   curl http://localhost:5000/api/health
   ```

5. **Wait for WhatsApp template approval** (24-48 hours)

6. **Test send-otp endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/whatsapp/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919028107111"}'
   ```

---

## IMPORTANT NOTES:

⚠️ **CRITICAL**: 
- WhatsApp template "gutmantra_otp" MUST be APPROVED before testing (wait 24-48 hours)
- Check approval status in Meta Developer Console
- Only test when template status shows "APPROVED" in green
- Never commit .env file to git
- Use strong JWT_SECRET in production
- All OTP data is stored in Firestore otpVerifications collection
- User data is auto-created/updated in users collection on first login

---

## EXPECTED PROJECT STRUCTURE AFTER COMPLETION:

```
backend/
├── src/
│   ├── routes/
│   │   ├── whatsappRoutes.ts          ← NEW
│   │   └── ... (other routes)
│   ├── utils/
│   │   ├── otpUtils.ts                ← NEW
│   │   ├── jwtUtils.ts                ← NEW
│   │   └── ... (other utils)
│   ├── config/
│   │   └── firebase.ts                (already exists)
│   └── server.ts                      ← UPDATED
├── .env                               ← CREATE MANUALLY
├── .env.example                       ← NEW
├── .gitignore                         ← UPDATED
└── ... (other files)
```

---

## SUCCESS CRITERIA:

You'll know this worked when:
- ✅ No TypeScript compilation errors
- ✅ Server starts without errors
- ✅ /api/health endpoint responds
- ✅ /api/whatsapp/send-otp endpoint exists
- ✅ /api/whatsapp/verify-otp endpoint exists
- ✅ /api/whatsapp/resend-otp endpoint exists
- ✅ All files follow existing code patterns
- ✅ Imports/exports are correct
- ✅ .env is in .gitignore

---

## THAT'S IT!

All files will be created and configured. After this:
1. Create `.env` manually
2. Install dependencies
3. Wait for WhatsApp template approval
4. Test the endpoints
5. Deploy to production

**Total Implementation Time**: 30 minutes (excluding WhatsApp approval wait)

