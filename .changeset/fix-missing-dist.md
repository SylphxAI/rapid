---
"@sylphx/zen": patch
---

Fix missing dist files in npm package

**Issue**: v3.1.0 was published without compiled dist/ files due to CI build not running properly.

**Fix**: Updated release workflow to build packages directly instead of using turbo.

**Note**: If you installed v3.1.0, please upgrade to v3.1.1.
