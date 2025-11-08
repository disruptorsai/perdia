---
name: quick-test
description: Quick browser test of deployed site
---

# Quick Browser Test

1. Navigate to $ARGUMENTS in a browser using Playwright
2. Wait for page to fully load (networkidle)
3. Check browser console for any errors or warnings
4. Capture all console messages with their types and locations
5. Test key functionality:
   - Forms submission
   - Navigation between pages
   - API calls and responses
   - Authentication flows (if applicable)
6. Take a screenshot of the current state
7. Report findings with:
   - Total errors found
   - Total warnings found
   - List of all console messages
   - Screenshot location
   - Network failures (if any)
8. **IMPORTANT:** Do NOT make any code changes - just report status

## Output Format
Provide a detailed report including:
- **URL Tested:** The deployment URL
- **Timestamp:** When the test was run
- **Status:** PASS or FAIL
- **Errors:** Count and details
- **Warnings:** Count and details
- **Screenshot:** Path to saved screenshot
- **Recommendations:** What needs to be fixed (if any)
