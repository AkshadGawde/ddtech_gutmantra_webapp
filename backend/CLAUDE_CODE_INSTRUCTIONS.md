# How to Use Claude Code for WhatsApp OTP Setup

## Overview

Claude Code is a CLI tool in VS Code that lets you delegate coding tasks to Claude. Instead of manually creating all the files, you can use a single prompt to have Claude set everything up for you.

---

## Step 1: Install Claude Code Extension

### In VS Code:
1. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
2. Search for "Claude"
3. Install "Claude Code" extension
4. Reload VS Code

### Verify Installation:
- You should see a Claude icon in the left sidebar
- Or use Command Palette (Ctrl+Shift+P) and search for "Claude"

---

## Step 2: Open Your Backend Project

```bash
# In terminal, navigate to backend directory
cd /Users/akshadgawde/Desktop/Developer/gut/backend

# Open in VS Code
code .
```

---

## Step 3: Copy the Complete Prompt

The comprehensive prompt is here:
**File**: `/Users/akshadgawde/Desktop/Developer/gut/backend/WHATSAPP_OTP_SETUP_PROMPT.md`

Copy the entire content between the `---` markers.

---

## Step 4: Open Claude Code in VS Code

### Method 1: Using Command Palette
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: "Claude Code"
3. Select: "Claude: Open Claude Code"

### Method 2: Using Sidebar
1. Click Claude icon in left sidebar
2. Click "Open Claude Code" button

### Method 3: Keyboard Shortcut
- Look for the keyboard shortcut in your VS Code settings
- Typically: `Ctrl+Option+C` or similar

---

## Step 5: Paste the Prompt

1. A Claude Code panel will open
2. Paste the entire prompt from WHATSAPP_OTP_SETUP_PROMPT.md
3. Click "Submit" or press Enter

---

## Step 6: Let Claude Code Work

Claude Code will:
1. Analyze your current project structure
2. Create/update all necessary files
3. Install dependencies
4. Make changes to existing files
5. Provide a summary of what was created

**This will take 2-5 minutes depending on complexity.**

---

## Step 7: Review Changes

After Claude Code completes:

1. **Check File Tree** (Left sidebar)
   - Look for newly created files:
     - `src/utils/otpUtils.ts` ✓
     - `src/utils/jwtUtils.ts` ✓
     - `src/routes/whatsappRoutes.ts` ✓
     - `.env.example` ✓

2. **Review Changes to Existing Files**
   - `src/server.ts` should have whatsappRoutes import and registration
   - Look for the changes in the file
   - Verify they're correct

3. **Check for Errors**
   - Look in VS Code terminal for any errors
   - Should see something like: "✓ All files created successfully"

---

## Step 8: Manual Post-Setup Steps

After Claude Code completes, you need to do these manually:

### 1. Create `.env` File

Create a new file: `src/backend/.env`

```
WHATSAPP_PHONE_ID=1108455795690267
WHATSAPP_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_HERE
WHATSAPP_BUSINESS_ACCOUNT_ID=1495438322369061
WHATSAPP_TEMPLATE_NAME=gutmantra_otp
JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRY=7d
NODE_ENV=development
PORT=5000
```

**Replace**: `YOUR_ACTUAL_TOKEN_HERE` with your real WhatsApp access token from Meta Developer Console.

### 2. Update `.gitignore`

Add to `.gitignore` (if not already there):
```
.env
.env.local
.env.*.local
```

### 3. Install Dependencies

```bash
# In backend directory
npm install axios jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### 4. Create Frontend Files

Open frontend directory in another VS Code window:

```bash
cd /Users/akshadgawde/Desktop/Developer/gut/frontend
code .
```

Then create:
- `src/pages/LoginPage.tsx` - Copy from provided file
- `src/pages/LoginPage.css` - Copy from provided file

Or use Claude Code in the frontend project with the frontend-specific prompt.

---

## Step 9: Start the Backend

```bash
# In backend directory
npm run dev

# Expected output:
# ✓ Server running on http://localhost:5000
# ✓ WhatsApp API endpoints available at /api/whatsapp
```

---

## Step 10: Test the Setup

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

### Test 2: Send OTP
```bash
curl -X POST http://localhost:5000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919028107111"}'
```

**Expected**: 
```json
{
  "success": true,
  "message": "OTP sent to your WhatsApp"
}
```

If you get 401 error, it means:
- WhatsApp template is not yet approved (wait 24-48 hours)
- OR access token is invalid

---

## If Something Goes Wrong

### Claude Code Didn't Create Files

1. Check if there were error messages in the output
2. Try again with simplified prompt
3. Create files manually using the provided code snippets

### TypeScript Errors

```bash
# Clear and rebuild
rm -rf dist
npm run build

# Or just check for errors
npm run type-check
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm node_modules package-lock.json
npm install
npm install axios jsonwebtoken
```

### Firebase Not Initialized

Ensure `src/config/firebase.ts` exists:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // your config here
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

## Advanced: Custom Modifications

After Claude Code creates the files, you can modify them:

### Add Custom Phone Formats
Edit `src/utils/otpUtils.ts`:
```typescript
export const validatePhoneNumber = (phone: string): boolean => {
  // Add your custom validation logic
};
```

### Change OTP Length
Edit `src/utils/otpUtils.ts`:
```typescript
export const generateOTP = (): string => {
  // Change 100000 + 900000 for different lengths
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

### Adjust Timeouts
Edit `src/routes/whatsappRoutes.ts`:
```typescript
const expiryTime = 10 * 60 * 1000; // Change 10 to desired minutes
```

---

## Tips & Tricks

### Tip 1: Keep Files Open
After Claude Code creates files, keep them open in editor tabs for quick reference.

### Tip 2: Use VS Code Search
- Press `Ctrl+F` to find all occurrences of "TODO" in generated code
- This shows optional customizations

### Tip 3: Check Dependencies
```bash
npm list axios jsonwebtoken
# Verify versions are recent
```

### Tip 4: Format Code
After generation, format the code:
```bash
npm run format
# or
npx prettier --write "src/**/*.ts"
```

### Tip 5: Run Type Check
```bash
npm run type-check
# Catch TypeScript errors early
```

---

## Troubleshooting Claude Code

| Issue | Solution |
|-------|----------|
| Command not found | Ensure extension is installed and reloaded |
| API quota exceeded | Wait a few minutes or use simpler prompt |
| File conflicts | Resolve by accepting/rejecting Claude's changes |
| Large prompt | Split into multiple smaller prompts |
| Timeout | Try again with simpler, more focused prompt |

---

## Using Claude Code for Frontend

### Frontend Setup Prompt

```
I need to create a WhatsApp OTP login page for my React frontend.

Requirements:
1. Create src/pages/LoginPage.tsx with:
   - Two-stage flow: phone entry → OTP entry
   - Phone validation (+91XXXXXXXXXX format)
   - OTP timer (2 minutes countdown)
   - Resend button with 30-second rate limiting
   - Auto-login after OTP verification
   - Token stored in localStorage

2. Create src/pages/LoginPage.css with:
   - Responsive mobile-first design
   - WhatsApp theme colors (green accents)
   - Loading states and animations
   - Error and success messages

3. Update App.tsx or Routes file:
   - Add route for /login
   - Make LoginPage the default/landing page

4. Environment variables:
   - REACT_APP_API_URL for backend endpoint

API Endpoints:
- POST /api/whatsapp/send-otp (body: {phone})
- POST /api/whatsapp/verify-otp (body: {phone, otp})
- POST /api/whatsapp/resend-otp (body: {phone})

Current user structure from Firestore:
- id, phone, firstName, lastName, email, address, createdAt, updatedAt

On successful login:
- Store token in localStorage with key "authToken"
- Store user data in localStorage with key "userData"
- Redirect to /dashboard

Error handling:
- Show user-friendly error messages
- Handle network timeouts
- Show attempt counter when available
- Handle "Too many attempts" scenario
```

---

## Alternative: Manual File Creation

If Claude Code doesn't work for you, manually create files:

1. **otpUtils.ts**: Copy from `/Users/akshadgawde/Desktop/Developer/gut/backend/src/utils/otpUtils.ts`
2. **jwtUtils.ts**: Copy from `/Users/akshadgawde/Desktop/Developer/gut/backend/src/utils/jwtUtils.ts`
3. **whatsappRoutes.ts**: Copy from `/Users/akshadgawde/Desktop/Developer/gut/backend/src/routes/whatsappRoutes.ts`
4. **LoginPage.tsx**: Copy from `/Users/akshadgawde/Desktop/Developer/gut/frontend/src/pages/LoginPage.tsx`
5. **LoginPage.css**: Copy from `/Users/akshadgawde/Desktop/Developer/gut/frontend/src/pages/LoginPage.css`

Then manually update:
- `src/server.ts` - Add whatsappRoutes import and registration
- Create `.env` file with credentials
- Update `.gitignore`

---

## Next Steps After Setup

1. ✓ Wait for WhatsApp template approval (24-48 hours)
2. ✓ Test API endpoints with curl/Postman
3. ✓ Test frontend login flow
4. ✓ Verify JWT token generation
5. ✓ Check Firestore data storage
6. ✓ Deploy to production

---

## Getting Help

If you need help:

1. Check error messages in VS Code terminal
2. Review the TESTING_GUIDE.md for debugging
3. Check Firebase Console for data issues
4. Verify WhatsApp settings in Meta Developer Console
5. Use `console.log()` to debug API responses

---

**Happy coding! 🚀**
