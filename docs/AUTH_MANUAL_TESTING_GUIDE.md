# Perdia Education - Manual Authentication Testing Guide

## 🎯 Quick Start (5 Minutes)

Your authentication system is **fully implemented and ready to test**! Follow this guide to verify everything works.

---

## ⚠️ IMPORTANT: Email Restrictions

Supabase has **email restrictions** by default:

- **Default Behavior:** Only team member emails can sign up
- **Why:** Prevents spam and protects your project during development
- **Solution:** You have two options:

### Option 1: Use Your Real Email (Recommended for Testing)
Use your actual email address or add team members in Supabase Dashboard.

### Option 2: Configure Custom SMTP (For Production)
Set up SendGrid, AWS SES, or another SMTP provider to allow any email domain.

---

## 📋 Step-by-Step Testing

### Step 1: Start the Development Server (1 minute)

```bash
cd /Users/disruptors/Documents/ProjectsD/perdia
npm run dev
```

**Expected Output:**
```
VITE v6.4.1  ready in 269 ms
➜  Local:   http://localhost:3000/
```

✅ **Server is running on:** http://localhost:3000

---

### Step 2: Test Signup Flow (2 minutes)

1. **Open signup page:** http://localhost:3000/signup

2. **Fill in the form:**
   - **Email:** Use your REAL email (or team member email)
   - **Password:** At least 6 characters
   - **Confirm Password:** Match the password
   - **Name:** Your name
   - **Organization:** (Optional) Your organization
   - **Terms:** Check the box

3. **Click "Create Account"**

#### Expected Behaviors:

**Scenario A: Email Confirmation Disabled (Instant Login)**
- ✅ Success message: "Account created successfully!"
- ✅ Auto-redirect to Dashboard
- ✅ You see your name in the header
- ✅ Sidebar navigation appears

**Scenario B: Email Confirmation Enabled**
- ⚠️ Message: "Please check your email to confirm your account"
- 📧 You receive a confirmation email
- 🔗 Click the link in the email
- ✅ Redirected to Dashboard after confirmation

**Scenario C: Unauthorized Email**
- ❌ Error: "Email address is invalid" or "Email not authorized"
- **Solution:** Use a team member email or configure custom SMTP

---

### Step 3: Test Login Flow (1 minute)

1. **If you were auto-logged in, first logout:**
   - Click your profile icon (top right)
   - Click "Logout"
   - You should be redirected to `/login`

2. **Open login page:** http://localhost:3000/login

3. **Enter credentials:**
   - **Email:** Same email from signup
   - **Password:** Same password

4. **Click "Sign In"**

#### Expected Result:
- ✅ Success message (or silent redirect)
- ✅ Redirected to Dashboard
- ✅ Session persisted

---

### Step 4: Test Protected Routes (1 minute)

1. **While logged in, click around:**
   - ✅ Dashboard (`/`)
   - ✅ Keywords (`/keywords`)
   - ✅ Content Library (`/content`)
   - ✅ AI Agents (`/ai-agents`)
   - ✅ All pages load without redirecting to login

2. **Open browser DevTools:**
   - Press `F12` or `Cmd+Option+I`
   - Go to **Console** tab
   - Look for errors (there should be none related to auth)

3. **Check session persistence:**
   - Refresh the page (`Cmd+R` or `F5`)
   - ✅ You should stay logged in
   - ✅ No redirect to login page

---

### Step 5: Test Logout (30 seconds)

1. **Click your profile icon (top right)**

2. **Click "Logout"**

#### Expected Result:
- ✅ Redirected to `/login`
- ✅ Session cleared

3. **Try to access a protected route:**
   - Navigate to: http://localhost:3000/dashboard
   - ✅ You should be redirected to `/login`

---

### Step 6: Test Session Security (1 minute)

1. **Open DevTools** (`F12`)

2. **Go to Application → Local Storage → http://localhost:3000**

3. **Find Supabase session data:**
   - Look for keys starting with `sb-`
   - You should see: `sb-yvvtsfgryweqfppilkvo-auth-token`

4. **Clear local storage:**
   - Right-click → "Clear"
   - Refresh the page

#### Expected Result:
- ✅ Redirected to `/login`
- ✅ No longer authenticated

---

## 🔐 Testing RLS (Row Level Security)

### What is RLS?
RLS ensures users can only see their own data. This prevents User A from accessing User B's keywords, content, etc.

### How to Test:

#### Option 1: Two Users (Best Way)

1. **Create User A:**
   - Sign up with your email: `your-email@example.com`
   - Go to Keywords page
   - Create a keyword: "Test Keyword User A"
   - Note the keyword ID in the URL or inspect the list

2. **Open Incognito/Private Window:**
   - Open a new private browser window
   - Go to: http://localhost:3000/signup
   - Sign up with a different email (team member or your alternate email)

3. **As User B:**
   - Go to Keywords page
   - ✅ You should NOT see "Test Keyword User A"
   - ✅ Create your own keyword: "Test Keyword User B"

4. **Switch back to User A window:**
   - Refresh Keywords page
   - ✅ You should NOT see "Test Keyword User B"
   - ✅ You should only see your own keywords

#### Option 2: Database Query (Admin Check)

```bash
# In project root
node scripts/test-rls.js
```

This script will:
- Create two test users
- Create data for each user
- Verify data isolation
- Clean up test data

---

## 🐛 Troubleshooting

### Issue: "Email address is invalid"

**Cause:** Supabase restricts emails to team members by default.

**Solutions:**

1. **Add yourself as team member:**
   - Go to: https://supabase.com/dashboard
   - Select Perdia project
   - Go to: Settings → Team
   - Add your email

2. **Configure Custom SMTP:**
   - Go to: Authentication → Settings → Email
   - Add SendGrid, AWS SES, or other SMTP provider
   - This allows any email domain

### Issue: "Please check your email to confirm"

**Cause:** Email confirmation is enabled.

**Solutions:**

1. **For MVP/Testing - Disable confirmation:**
   - Go to: https://supabase.com/dashboard
   - Select Perdia project
   - Go to: Authentication → Settings → Email Auth
   - Disable "Confirm email"
   - Save changes

2. **For Production - Keep enabled:**
   - Configure custom SMTP
   - Users receive confirmation emails
   - More secure, but requires email setup

### Issue: Can't receive confirmation emails

**Cause:** Default Supabase email service is limited.

**Solution:**
- Configure custom SMTP provider (SendGrid recommended)
- Go to: Authentication → Settings → SMTP Settings

### Issue: "Multiple GoTrueClient instances" warning

**Cause:** Creating multiple Supabase clients.

**Solution:**
- ✅ Already fixed in `src/lib/supabase-client.js`
- Always import from: `@/lib/supabase-client`
- Never call `createClient()` directly

### Issue: Logged out after page refresh

**Cause:** Session not persisting.

**Check:**
1. Open DevTools → Application → Cookies
2. Look for: `sb-yvvtsfgryweqfppilkvo-auth-token`
3. If missing, check browser settings (cookies enabled?)

### Issue: Can see other users' data

**Cause:** RLS policies not working.

**Solution:**
```bash
# Verify RLS policies exist
npm run db:migrate

# Check Supabase Dashboard
# Go to: Database → Policies
# Verify policies exist for all tables
```

---

## ✅ Success Checklist

Before considering authentication complete, verify:

- [ ] Can sign up with valid email
- [ ] Auto-login after signup (or email confirmation works)
- [ ] Can login with credentials
- [ ] Session persists across page refresh
- [ ] Protected routes require authentication
- [ ] Can logout successfully
- [ ] Redirected to login when accessing protected routes while logged out
- [ ] Multiple users can exist without seeing each other's data (RLS)
- [ ] No console errors related to authentication
- [ ] User metadata (name, org) saved correctly

---

## 🔧 Configuration Checklist

### Required Configuration (In Supabase Dashboard)

1. **Site URL:**
   - Go to: Authentication → Settings → Site URL
   - Add: `http://localhost:3000`

2. **Redirect URLs:**
   - Go to: Authentication → Settings → Redirect URLs
   - Add: `http://localhost:3000/**`

3. **Email Confirmation (Choose One):**
   - **For MVP/Testing:** Disable "Confirm email"
   - **For Production:** Keep enabled + configure SMTP

### Optional Configuration

4. **Rate Limiting:**
   - Default: 30 signups per hour
   - Adjust in: Authentication → Settings → Rate Limits

5. **Password Requirements:**
   - Minimum 6 characters (default)
   - Adjust in: Authentication → Settings → Password Settings

6. **Session Timeout:**
   - Default: 1 hour
   - Adjust in: Authentication → Settings → Session Settings

---

## 📊 Expected Test Results

### If Everything Works:

```
✅ Environment configured correctly
✅ Supabase connection successful
✅ Signup creates user
✅ Auto-login after signup (or email confirmation)
✅ Login works with credentials
✅ Session persists across refresh
✅ Protected routes require auth
✅ Logout clears session
✅ RLS isolates user data
✅ No console errors
```

### If Email Confirmation Enabled:

```
✅ Signup creates user
⚠️  Email confirmation required
📧 Confirmation email sent
✅ Click link in email
✅ Redirected to app
✅ Logged in successfully
```

### If Unauthorized Email:

```
❌ Email address is invalid

Next Steps:
1. Add email to team members
2. OR configure custom SMTP
3. OR use a team member email
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass:

1. **Production Configuration:**
   - Set up custom SMTP (SendGrid, AWS SES)
   - Enable email confirmation
   - Configure production redirect URLs
   - Set up password reset page
   - Add user profile editing

2. **Optional Enhancements:**
   - OAuth providers (Google, GitHub)
   - Magic link authentication
   - Multi-factor authentication (MFA)
   - Password strength requirements
   - Account deletion flow

### If Tests Fail:

1. **Review error messages carefully**
2. **Check Supabase Dashboard → Authentication → Logs**
3. **Verify environment variables in `.env.local`**
4. **Review troubleshooting section above**
5. **Check documentation:** `docs/AUTH_SETUP_INSTRUCTIONS.md`

---

## 📚 Additional Resources

### Documentation
- **Quick Start:** `docs/AUTH_QUICK_START.md`
- **Full Setup Guide:** `docs/AUTH_SETUP_INSTRUCTIONS.md`
- **Testing Checklist:** `docs/AUTH_TESTING_CHECKLIST.md`
- **Implementation Summary:** `docs/AUTH_IMPLEMENTATION_SUMMARY.md`

### Code Files
- **Signup Page:** `src/pages/Signup.jsx`
- **Login Page:** `src/pages/Login.jsx`
- **Auth Client:** `src/lib/supabase-client.js`
- **Router:** `src/pages/Pages.jsx`

### External Resources
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 🎉 You're Done!

Once all checklist items are verified, your authentication system is **production-ready**!

**Estimated Total Testing Time:** 10-15 minutes

**Questions or Issues?**
- Check: `docs/AUTH_SETUP_INSTRUCTIONS.md` (troubleshooting section)
- Review: Supabase Dashboard → Authentication → Logs
- Verify: Environment variables in `.env.local`

---

**Last Updated:** 2025-01-07
**Status:** ✅ Implementation Complete - Ready for Testing
