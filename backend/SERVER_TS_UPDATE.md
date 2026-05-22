# How to Update src/server.ts for WhatsApp Routes

## Step-by-Step Instructions

### 1. Add Import Statement (at the top of your imports)

```typescript
import whatsappRoutes from './routes/whatsappRoutes';
```

### 2. Register Routes (in your express app setup)

Add this line **BEFORE** your other route registrations:

```typescript
// WhatsApp OTP Authentication Routes
app.use('/api/whatsapp', whatsappRoutes);
```

### 3. Complete Example of Updated server.ts

Here's how your `src/server.ts` should look (showing relevant sections):

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import whatsappRoutes from './routes/whatsappRoutes';  // ← ADD THIS IMPORT
// ... other imports

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ========== ROUTE REGISTRATIONS ==========

// WhatsApp OTP Authentication Routes (REGISTER FIRST)
app.use('/api/whatsapp', whatsappRoutes);  // ← ADD THIS LINE

// Your existing routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
// ... other routes

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ WhatsApp API endpoints available at /api/whatsapp`);
});

export default app;
```

## Key Points:

1. **Import Order**: Import `whatsappRoutes` with your other route imports at the top
2. **Route Registration**: Register it BEFORE other routes to ensure proper matching
3. **Path**: Routes will be available at `/api/whatsapp/*`
4. **Endpoints**:
   - `POST /api/whatsapp/send-otp`
   - `POST /api/whatsapp/verify-otp`
   - `POST /api/whatsapp/resend-otp`

## Testing the Routes

After updating server.ts, test with:

```bash
# Test Send OTP
curl -X POST http://localhost:5000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111"}'

# Test Verify OTP
curl -X POST http://localhost:5000/api/whatsapp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111", "otp": "123456"}'

# Test Resend OTP
curl -X POST http://localhost:5000/api/whatsapp/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111"}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Routes not found (404) | Ensure import and app.use() are added correctly |
| Module not found error | Run `npm install axios jsonwebtoken` if not already installed |
| TypeScript errors | Ensure whatsappRoutes.ts is in src/routes/ folder |
| 401 errors from WhatsApp | Check that WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID are correct in .env |
| Firestore errors | Verify Firebase is initialized in src/config/firebase.ts |

## Environment Variables Needed

Create `.env` file with:

```
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d
NODE_ENV=development
PORT=5000
```

**Remember**: Add `.env` to `.gitignore` to prevent credentials from being committed!
