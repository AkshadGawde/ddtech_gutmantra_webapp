# 🎯 Quick Start - Claude Code in VS Code

## 3 Simple Steps:

### Step 1️⃣: Copy the Prompt
Open this file:
```
CLAUDE_CODE_ULTIMATE_PROMPT.md
```
Copy **EVERYTHING** between the first "---" and the last "---" markers (the entire text)

### Step 2️⃣: Open Claude Code in VS Code
1. Press: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: `claude`
3. Select: `Claude Code: Open Claude Code`

**OR**: Click the Claude icon in left sidebar

### Step 3️⃣: Paste & Submit
1. The Claude Code panel opens
2. Paste the entire prompt you copied
3. Click "Submit" button (or press Ctrl+Enter)
4. Wait for it to finish (2-5 minutes)

---

## ✅ That's It!

Claude Code will automatically:
- ✅ Create `src/utils/otpUtils.ts`
- ✅ Create `src/utils/jwtUtils.ts`
- ✅ Create `src/routes/whatsappRoutes.ts`
- ✅ Create `.env.example`
- ✅ Update `src/server.ts`
- ✅ Update `.gitignore`

---

## 📋 After Claude Code Finishes:

### Manual Step 1: Create .env File
```bash
# In backend directory
cp .env.example .env

# Edit .env and add your WhatsApp token:
# WHATSAPP_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_HERE
```

### Manual Step 2: Install Dependencies
```bash
npm install axios jsonwebtoken
```

### Manual Step 3: Start Backend
```bash
npm run dev
```

**Expected output:**
```
✓ Server running on http://localhost:5000
✓ WhatsApp API endpoints available at /api/whatsapp
```

### Manual Step 4: Test
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

---

## ⚠️ Important:

1. **Copy the ENTIRE prompt** from `CLAUDE_CODE_ULTIMATE_PROMPT.md`
2. **Paste into Claude Code panel** (not into a file)
3. **Wait for completion** (don't interrupt)
4. **Then manually create .env file** (Claude Code can't do this)
5. **Install dependencies** with npm
6. **Start the server** to verify

---

## 🚨 If Something Goes Wrong:

### Error: "Module not found"
```bash
npm install axios jsonwebtoken
```

### Error: "Cannot find whatsappRoutes"
Check that Claude Code created `src/routes/whatsappRoutes.ts` file

### Error: "Cannot find firebase"
Ensure `src/config/firebase.ts` exists with Firebase initialized

### Server won't start
Check for TypeScript errors:
```bash
npm run build
```

---

## 📞 File Reference:

The prompt includes complete code for:

1. **otpUtils.ts** - Phone validation, OTP generation
2. **jwtUtils.ts** - JWT token generation/verification
3. **whatsappRoutes.ts** - All 3 endpoints
4. **.env.example** - Credentials template
5. **server.ts updates** - Route registration
6. **.gitignore updates** - Hide .env

---

## 🎉 You're Done!

Once Claude Code finishes:
1. Your backend is ready to use
2. All files are created
3. Just need to add .env credentials
4. Install npm packages
5. Test the endpoints

**Time required**: 30 minutes total (including manual steps)

---

## Next Steps:

After Claude Code setup:
1. Wait for WhatsApp template approval (24-48 hours)
2. Read `README_WHATSAPP_OTP.md` for overview
3. Follow `TESTING_GUIDE.md` to test endpoints
4. Deploy to production when ready

---

**Ready? Open `CLAUDE_CODE_ULTIMATE_PROMPT.md` now!** 👇
