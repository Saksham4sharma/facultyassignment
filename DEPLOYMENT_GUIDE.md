# Deployment Guide for Vercel

## Prerequisites
1. Create a Vercel account at https://vercel.com/signup
2. Install Vercel CLI (optional, but recommended):
   ```bash
   npm install -g vercel
   ```

## Method 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Push to GitHub
1. Create a new repository on GitHub: https://github.com/new
2. Initialize git in your project (if not already done):
   ```bash
   cd "c:\Users\HP\OneDrive\Desktop\teacher assignment"
   git init
   git add .
   git commit -m "Initial commit - Exam timetable management system"
   ```

3. Connect to GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "Import Git Repository"
4. Choose your GitHub repository
5. Vercel will auto-detect Next.js settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

6. Click "Deploy"
7. Wait 2-3 minutes for deployment to complete
8. Your app will be live at: `https://your-project-name.vercel.app`

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd "c:\Users\HP\OneDrive\Desktop\teacher assignment"
vercel login
vercel
```

Follow the prompts:
- **Set up and deploy**: Y
- **Which scope**: Select your account
- **Link to existing project**: N
- **What's your project's name**: (Enter a name or press Enter)
- **In which directory is your code located**: ./
- **Want to override the settings**: N

The CLI will:
1. Build your project
2. Deploy to Vercel
3. Provide you with a live URL

### Step 3: Production Deployment
After the initial deployment, run:
```bash
vercel --prod
```

## Method 3: Deploy via Vercel GitHub Integration

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import" next to your GitHub repository
4. Configure project:
   - Leave all settings as default (Vercel auto-detects Next.js)
   - Click "Deploy"

## Environment Variables (If Needed)
If your app requires environment variables:

1. In Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add your variables

2. Via CLI:
   ```bash
   vercel env add VARIABLE_NAME
   ```

## Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Automatic Deployments
Once connected to GitHub:
- Every push to `main` branch = Production deployment
- Every push to other branches = Preview deployment

## Troubleshooting

### Build Errors
If deployment fails:
1. Check the build logs in Vercel dashboard
2. Test locally first:
   ```bash
   npm run build
   npm start
   ```
3. Fix any errors and push again

### Common Issues
- **Module not found**: Run `npm install` and commit `package-lock.json`
- **Build timeout**: Optimize your build or upgrade Vercel plan
- **Memory limit**: Reduce bundle size or upgrade plan

## Post-Deployment
Your app will be available at:
- **Vercel URL**: `https://your-project-name.vercel.app`
- **Custom Domain**: (if configured)

## Redeployment
To redeploy after changes:
1. **Via GitHub**: Just push your changes
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Via CLI**:
   ```bash
   vercel --prod
   ```

## Monitoring
- View analytics: https://vercel.com/dashboard
- Check logs: Project → Deployments → Click deployment → View Logs
- Monitor performance: Project → Analytics

## Support
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Community: https://github.com/vercel/next.js/discussions

---

**Quick Deploy Command:**
```bash
vercel --prod
```

**Your app is now live! 🎉**
