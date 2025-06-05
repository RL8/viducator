# ⚡ Quick Deploy Reference

**Status**: 🚀 Ready for GitHub + Vercel deployment

## 🔥 TL;DR - Deploy in 5 Minutes

### 1. GitHub Setup (30 seconds)
```bash
git remote add origin https://github.com/YOUR_USERNAME/viducator.git
git branch -M main
git push -u origin main
```

### 2. Vercel Deploy (2 minutes)
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. New Project → Import `viducator` repo
3. Deploy (auto-detects Vue.js settings)

### 3. Add Environment Variables (1 minute)
In Vercel Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Test Your App (1 minute)
Visit your Vercel URL and test the video workflow!

## 🔗 Essential Links
- **Build Test**: `npm run build` (should work locally)
- **Live Preview**: `npm run dev` (test locally first)
- **GitHub**: Create repo at github.com/new
- **Vercel**: Deploy at vercel.com/new
- **Supabase**: Get credentials at app.supabase.com

## ✅ Success Checklist
- [ ] Local build works: `npm run build` ✅
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful  
- [ ] Environment variables added
- [ ] App loads at public URL
- [ ] Video workflow functional

## 🆘 Quick Fixes
- **Build fails**: Check `npm run type-check`
- **App crashes**: Verify Vercel env vars
- **DB not working**: Check Supabase URL + key
- **Still stuck**: See full `DEPLOYMENT.md` guide

---
*Your AI video generator will be live and accessible to anyone in ~5 minutes!* 