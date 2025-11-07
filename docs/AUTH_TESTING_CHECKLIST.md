# Perdia Authentication Testing Checklist

**Quick Reference:** Print this and check off as you test

---

## Pre-Testing Setup

- [ ] Supabase Auth configured (email confirmation DISABLED for MVP)
- [ ] `.env.local` has correct Supabase credentials
- [ ] Dev server running (`npm run dev`)
- [ ] Browser at http://localhost:5173

---

## Test 1: New User Signup

**URL:** http://localhost:5173/signup

- [ ] Page loads without errors
- [ ] Form has: Name, Email, Organization, Password, Confirm Password, Terms
- [ ] Enter test data:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `password123`
  - Confirm: `password123`
  - Organization: `Test Org` (optional)
  - ✅ Agree to terms
- [ ] Click "Create Account"
- [ ] Loading spinner shows
- [ ] Auto-redirects to dashboard
- [ ] Dashboard loads successfully
- [ ] User logged in (can navigate to protected routes)

**Verify in Supabase:**
- [ ] Go to Supabase Dashboard > Authentication > Users
- [ ] See new user: `test@example.com`
- [ ] User status: Confirmed (green dot)

---

## Test 2: Signup Validation

**URL:** http://localhost:5173/signup

Test each validation error:

- [ ] Empty name → "Name is required"
- [ ] Invalid email → "Email is invalid"
- [ ] Password < 6 chars → "Password must be at least 6 characters"
- [ ] Passwords don't match → "Passwords do not match"
- [ ] Terms unchecked → "You must agree to terms"
- [ ] Duplicate email → "This email is already registered"

---

## Test 3: Logout

- [ ] Navigate to http://localhost:5173/profile
- [ ] Click "Sign Out" (or run in console):
  ```javascript
  localStorage.removeItem('perdia-auth');
  window.location.reload();
  ```
- [ ] Redirected to `/login`
- [ ] Cannot access protected routes

---

## Test 4: Existing User Login

**URL:** http://localhost:5173/login

- [ ] Page loads without errors
- [ ] Form has: Email, Password
- [ ] NO dev mode bypass button visible
- [ ] Enter credentials:
  - Email: `test@example.com`
  - Password: `password123`
- [ ] Click "Sign In"
- [ ] Loading spinner shows
- [ ] Redirected to dashboard
- [ ] Dashboard loads successfully

---

## Test 5: Login Validation

**URL:** http://localhost:5173/login

- [ ] Wrong password → "Invalid login credentials"
- [ ] Non-existent email → "Invalid login credentials"
- [ ] Empty fields → HTML5 validation (required)

---

## Test 6: Protected Routes (Logged OUT)

While logged out, try accessing:

- [ ] http://localhost:5173/ → Redirects to /login
- [ ] http://localhost:5173/keywords → Redirects to /login
- [ ] http://localhost:5173/content → Redirects to /login
- [ ] http://localhost:5173/ai-agents → Redirects to /login

---

## Test 7: Protected Routes (Logged IN)

While logged in, can access:

- [ ] http://localhost:5173/ → Dashboard loads
- [ ] http://localhost:5173/keywords → Keywords page loads
- [ ] http://localhost:5173/content → Content page loads
- [ ] http://localhost:5173/ai-agents → AI Agents page loads

---

## Test 8: Session Persistence

- [ ] **Refresh page (F5)** → User stays logged in
- [ ] **Close browser completely** → Reopen → User still logged in
- [ ] **Check localStorage:**
  - F12 > Application > Local Storage
  - See `perdia-auth` key with data

---

## Test 9: Row Level Security (RLS)

**Create User A:**
- [ ] Signup: `alice@example.com` / `password123`
- [ ] Go to Keywords page
- [ ] Create keyword: "alice keyword"
- [ ] Verify keyword appears

**Create User B:**
- [ ] Logout
- [ ] Signup: `bob@example.com` / `password123`
- [ ] Go to Keywords page
- [ ] Should see ZERO keywords (not Alice's)
- [ ] Create keyword: "bob keyword"
- [ ] Should see only "bob keyword"

**Switch back to Alice:**
- [ ] Logout
- [ ] Login as `alice@example.com`
- [ ] Go to Keywords page
- [ ] Should see only "alice keyword" (NOT Bob's)

**Result:** ✅ RLS working - users isolated

---

## Test 10: Navigation Links

- [ ] On `/login` → Click "Sign up" link → Goes to `/signup`
- [ ] On `/signup` → Click "Sign in" link → Goes to `/login`

---

## Test 11: Error Handling

- [ ] Network offline → Helpful error message
- [ ] Invalid Supabase credentials → Clear error
- [ ] Supabase project down → Graceful degradation

---

## Test 12: UI/UX

- [ ] Forms look clean and professional
- [ ] Icons show for each input field
- [ ] Password visibility toggle works (eye icon)
- [ ] Loading spinners prevent double-submission
- [ ] Success/error messages clearly visible
- [ ] Responsive on mobile (optional)

---

## Common Issues Checklist

If tests fail, check:

- [ ] `.env.local` has correct `VITE_SUPABASE_URL`
- [ ] `.env.local` has correct `VITE_SUPABASE_ANON_KEY`
- [ ] Supabase email confirmation is DISABLED
- [ ] Migration was applied (`npm run db:migrate`)
- [ ] Dev server restarted after code changes
- [ ] Browser cache cleared
- [ ] Browser console shows no errors (F12)

---

## Success Criteria

**All tests pass when:**

✅ Signup creates user and auto-logs in
✅ Login works with valid credentials
✅ Logout clears session
✅ Protected routes require authentication
✅ Session persists across refresh/restart
✅ RLS isolates user data
✅ Error messages are clear and helpful
✅ UI is clean and professional

---

## Quick Test Commands

**Check if auth is working:**
```javascript
// Browser console (F12)
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

**Check localStorage:**
```javascript
// Browser console
console.log(localStorage.getItem('perdia-auth'));
```

**Manual logout:**
```javascript
// Browser console
localStorage.removeItem('perdia-auth');
window.location.reload();
```

**Check Supabase connection:**
```javascript
// Browser console
const { data, error } = await supabase.from('keywords').select('count');
console.log('Connection test:', { data, error });
```

---

## Time Estimates

- **Pre-setup:** 5 minutes
- **Tests 1-5 (Signup/Login):** 10 minutes
- **Tests 6-8 (Routes/Session):** 5 minutes
- **Test 9 (RLS):** 10 minutes
- **Tests 10-12 (Links/Errors/UI):** 5 minutes

**Total:** ~35 minutes for complete testing

---

**Print this checklist and test systematically!** ✅
