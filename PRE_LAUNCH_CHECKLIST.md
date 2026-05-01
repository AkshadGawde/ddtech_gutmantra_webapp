# ✅ Pre-Launch Checklist

Use this checklist to verify everything is ready before going live.

## 🔧 Setup Phase

- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm v8+ installed (`npm --version`)
- [ ] Firebase project created at https://console.firebase.google.com
- [ ] Firestore database enabled
- [ ] Firebase Authentication enabled
- [ ] Service account key downloaded as `backend/firebase-applet-config.json`
- [ ] Firebase database URL copied to `.env.local` as `FIREBASE_DATABASE_URL`
- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)

## 📊 Data Preparation

- [ ] WordPress users exported to CSV with all required fields
- [ ] WordPress products exported to CSV with all required fields
- [ ] WordPress orders exported to CSV with all required fields
- [ ] CSV files placed in `backend/data/` directory
- [ ] CSV files validated with correct headers
- [ ] CSV files checked for encoding (UTF-8)
- [ ] Sample password hashes verified (bcrypt $2... or phpass $P$/$H$)
- [ ] Petpooja IDs preserved in CSV data where applicable

## 🚀 Migration Phase

- [ ] Migration script runs without errors (`npm run migrate`)
- [ ] All users imported successfully
- [ ] All products imported successfully
- [ ] All orders imported successfully
- [ ] Migration logs created in Firestore
- [ ] Verification script passes (`npm run verify`)
- [ ] No critical errors in verification report
- [ ] Data count matches expectations

## 🔐 Security Phase

- [ ] Firestore security rules updated and deployed
- [ ] Firebase Auth permissions verified
- [ ] Service account credentials are secure
- [ ] .env.local is in .gitignore
- [ ] No sensitive data in version control
- [ ] HTTPS enabled for production domain

## 🧪 Testing Phase - Legacy Login

- [ ] Legacy login endpoint responds (`POST /api/auth/legacy-login`)
- [ ] Legacy login with correct credentials succeeds
- [ ] Legacy login with wrong password fails (401)
- [ ] User data returned after legacy login
- [ ] Custom Firebase token returned
- [ ] Firestore user updated with firebaseUid
- [ ] Orders linked to firebaseUid
- [ ] Legacy password hash removed from Firestore
- [ ] User can use Firebase auth after migration

## 🧪 Testing Phase - New Registration

- [ ] Registration endpoint responds (`POST /api/auth/register`)
- [ ] Registration with valid data succeeds
- [ ] Registration with duplicate email fails (409)
- [ ] Registration with weak password fails (400)
- [ ] Firebase Auth user created
- [ ] Firestore user document created
- [ ] Custom token returned
- [ ] Phone number stored if provided

## 🧪 Testing Phase - Normal Login

- [ ] Login endpoint responds (`POST /api/auth/login`)
- [ ] Login with valid Firebase token succeeds
- [ ] Login with invalid token fails (401)
- [ ] User profile returned
- [ ] All user data accessible

## 🧪 Testing Phase - Profile Access

- [ ] Profile endpoint requires authentication
- [ ] Authenticated user can access their profile
- [ ] User cannot access other user's profile (if enforced)
- [ ] Profile data matches Firestore data
- [ ] petpoojaCustomerId preserved in profile

## 🧪 Testing Phase - Order Access

- [ ] User can retrieve their orders
- [ ] Orders contain correct items and totals
- [ ] wordpressOrderId preserved in orders
- [ ] petpoojaOrderId preserved in orders
- [ ] Order items have correct details
- [ ] Order timestamps are correct

## 📊 Integration Phase - Petpooja POS

- [ ] Petpooja can query orders by customer ID
- [ ] Petpooja can query orders by order ID
- [ ] Phone matching works for POS lookup
- [ ] POS system continues functioning
- [ ] No order data lost during migration
- [ ] New orders from POS work correctly

## 📊 Integration Phase - Frontend

- [ ] Frontend can import auth utilities
- [ ] Legacy login flow works end-to-end
- [ ] Registration flow works end-to-end
- [ ] Protected pages require authentication
- [ ] User profile displays correctly
- [ ] Order history displays correctly
- [ ] Logout clears authentication

## 📊 Integration Phase - API

- [ ] CORS configured correctly
- [ ] API headers properly set
- [ ] Request validation working
- [ ] Error responses formatted correctly
- [ ] Status codes appropriate
- [ ] Rate limiting implemented (if planned)

## 🔍 Quality Assurance

- [ ] No console errors or warnings
- [ ] No TypeScript compilation errors
- [ ] No linting errors
- [ ] No security warnings from dependencies
- [ ] No performance issues identified
- [ ] Database queries efficient
- [ ] API response times acceptable
- [ ] No memory leaks observed

## 📈 Monitoring Setup

- [ ] Migration logs queryable and readable
- [ ] Error tracking configured
- [ ] User activity can be monitored
- [ ] Performance metrics baseline established
- [ ] Alert threshold configured
- [ ] Debug logging enabled (development only)

## 🌐 Deployment Phase

- [ ] Environment variables configured on server
- [ ] Firebase credentials securely stored
- [ ] Database backups configured
- [ ] Rollback plan documented
- [ ] Error handling for edge cases
- [ ] Rate limiting configured
- [ ] HTTPS certificate valid
- [ ] Domain DNS configured

## 👥 Team Phase

- [ ] Support team trained on new system
- [ ] User communication plan prepared
- [ ] Known issues documented
- [ ] Troubleshooting guide distributed
- [ ] Escalation procedures documented
- [ ] POS team notified of changes
- [ ] Backup procedures documented

## 🔄 Go-Live Phase (Day of Launch)

- [ ] Database backed up
- [ ] Legacy WordPress system still accessible (for fallback)
- [ ] Monitoring dashboard ready
- [ ] Support team on standby
- [ ] All team members notified of start time
- [ ] Health check endpoint verified
- [ ] Legacy login working
- [ ] New registration working
- [ ] Petpooja integration verified
- [ ] First users successfully migrated
- [ ] No errors in logs

## ✅ Post-Launch Phase (Day 1-7)

- [ ] Monitor for any user issues
- [ ] Check migration logs for errors
- [ ] Verify all orders migrated correctly
- [ ] Test with sample of legacy users
- [ ] Monitor performance metrics
- [ ] Check error tracking for issues
- [ ] Verify Petpooja orders still working
- [ ] Get user feedback
- [ ] Address any bugs immediately

## 🎯 Final Verification

- [ ] All checklist items marked complete
- [ ] No outstanding issues
- [ ] Documentation is accurate
- [ ] Team is confident in system
- [ ] Rollback plan ready (but not needed!)
- [ ] Celebrate successful migration! 🎉

---

## Quick Verification Commands

```bash
# Check Firebase Admin initialization
npm run dev
# Check for "✅ Firebase Admin SDK initialized"

# Run migration (with sample data)
npm run migrate data/users.csv data/products.csv data/orders.csv

# Verify data integrity
npm run verify
# Check for "✅ All checks passed!"

# Test legacy login
curl -X POST http://localhost:3000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"password"}'
# Should return success with customToken

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","phone":"+919876543210"}'
# Should return success with customToken
```

---

## If Something Goes Wrong

1. **Check logs first**: `npm run verify` gives detailed report
2. **Check Firestore**: Verify collections and data
3. **Check Firebase Auth**: Verify auth users created
4. **Check console**: Look for error messages
5. **Review CSV format**: Ensure headers and data match specification
6. **Check service account**: Verify credentials are valid
7. **Verify database URL**: Ensure FIREBASE_DATABASE_URL is correct
8. **Test connectivity**: Run `npm run dev` to start server

See **MIGRATION_GUIDE.md** → Troubleshooting for detailed help.

---

## Success Indicators ✅

You know you're successful when:

✅ All checklist items are complete  
✅ `npm run verify` shows no critical errors  
✅ Legacy login works with real user credentials  
✅ New registration creates users in Firebase Auth  
✅ Orders are properly linked to users  
✅ Petpooja POS continues working  
✅ Frontend can login and logout successfully  
✅ User profile data displays correctly  
✅ No errors in console or logs  
✅ First batch of users successfully migrated  

---

## Support Resources

- **QUICK_START.md** - Step-by-step setup
- **MIGRATION_GUIDE.md** - Complete reference
- **API_DOCUMENTATION.md** - API details
- **backend/README.md** - Backend internals
- **IMPLEMENTATION_SUMMARY.md** - Overview of all files

---

**Ready to launch? Go for it! 🚀**
