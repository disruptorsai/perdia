# Perdia Onboarding - Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Install Dependencies
```bash
npm install react-confetti
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test the Onboarding

**Option A: Create New User** (Recommended)
1. Navigate to http://localhost:5173/signup
2. Create a new account
3. After signup, you'll be redirected to Dashboard
4. Onboarding wizard appears automatically! 🎉

**Option B: Trigger Manually** (For Testing)
1. Open browser DevTools Console (F12)
2. Paste and run:
   ```javascript
   localStorage.setItem('perdia_onboarding_completed', 'false');
   localStorage.setItem('perdia_onboarding_current_step', '0');
   location.reload();
   ```
3. Wizard appears on Dashboard! 🎉

---

## 🧪 Quick Test Checklist

- [ ] Wizard appears on Dashboard for new users
- [ ] Can navigate through all 5 steps
- [ ] WordPress connection form works (try skipping)
- [ ] Keyword creation works (try both example and custom)
- [ ] Article generation completes (takes 30-60 seconds)
- [ ] Confetti animation plays on completion
- [ ] Can close wizard with ESC (requires confirmation)
- [ ] Wizard data saves to Supabase

---

## 🎯 Full Wizard Flow

### Step 1: Welcome (0:30)
- View platform introduction
- See key features and stats
- Click "Let's Get Started"

### Step 2: WordPress (1:00)
- Enter WordPress URL: `https://yourdomain.com`
- Or click "I'll connect later" to skip

### Step 3: Keyword (1:30)
- Choose "Use example keyword" for fastest test
- Or click "Add my own keyword" to enter custom

### Step 4: Generate (3:30)
- Click "Generate Article"
- Watch real-time progress (30-60 seconds)
- See rotating loading tips

### Step 5: Complete (5:00)
- Confetti celebration! 🎉
- View accomplishments
- Explore "What's Next" cards
- Click "Go to Dashboard"

**Total Time: ~5-7 minutes**

---

## 🐛 Troubleshooting

### Wizard Doesn't Appear
```javascript
// Check onboarding status
console.log('Completed:', localStorage.getItem('perdia_onboarding_completed'));
console.log('Step:', localStorage.getItem('perdia_onboarding_current_step'));

// Force reset
localStorage.removeItem('perdia_onboarding_completed');
location.reload();
```

### No Confetti Animation
- Ensure `react-confetti` is installed: `npm install react-confetti`
- Fallback animation will show if not installed (still nice!)

### Article Generation Fails
- Check Supabase Edge Function is deployed
- Verify `VITE_ANTHROPIC_API_KEY` is set
- Check browser console for errors

### WordPress Connection Fails
- This is expected - just a demo form
- Click "I'll connect later" to skip
- Real WordPress auth coming in future update

---

## 🔄 Reset Onboarding Anytime

```javascript
// Complete reset
localStorage.removeItem('perdia_onboarding_completed');
localStorage.removeItem('perdia_onboarding_current_step');
localStorage.removeItem('perdia_onboarding_skipped');
localStorage.removeItem('perdia_discovery_tasks');
localStorage.removeItem('perdia_tours_completed');
location.reload();
```

---

## 📱 Test on Mobile

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access from mobile: `http://YOUR_IP:5173`
3. Test responsive design and touch interactions

---

## 🎨 Customization Quick Tips

### Change Welcome Text
Edit `src/lib/onboarding-config.js`:
```javascript
export const WELCOME_CONTENT = {
  title: 'Your Custom Title',
  subtitle: 'Your custom subtitle',
  // ...
};
```

### Modify Step Order
Edit `src/lib/onboarding-config.js`:
```javascript
export const WIZARD_STEPS = {
  WELCOME: 0,
  YOUR_STEP: 1,  // Add/reorder steps
  // ...
};
```

### Update Colors
Edit `src/lib/onboarding-config.js`:
```javascript
export const ONBOARDING_COLORS = {
  primary: 'from-your-600 to-color-700',
  // ...
};
```

---

## ✅ What's Next?

After testing the wizard:

1. **Phase 2:** Discovery Checklist (dashboard todo list)
2. **Phase 3:** Feature Tours (guided tours for each feature)
3. **Phase 4:** Help Menu (restart onboarding, launch tours)

See `ONBOARDING_IMPLEMENTATION_SUMMARY.md` for full details.

---

## 🚀 Deployment

The onboarding system works automatically in production:
- New signups will see the wizard
- No special configuration needed
- Ensure `react-confetti` is in dependencies

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

---

## 📞 Support

- **Full Documentation:** `ONBOARDING_IMPLEMENTATION_SUMMARY.md`
- **Configuration:** `src/lib/onboarding-config.js`
- **Hook API:** `src/hooks/useOnboarding.js`

---

**Happy Onboarding! 🎉**
