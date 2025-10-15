# SEO Setup for MySked.ca

## Google Search Console Issue: "Page with redirect"

### Problem
Google Search Console detected that some pages have redirects, preventing them from being indexed. This is common with Single Page Applications (SPAs) like React apps.

### Solutions Implemented

#### 1. **robots.txt** (✅ Added)
- Located at: `/public/robots.txt`
- Allows public pages (`/terms`, `/privacy`, `/install`)
- Blocks authenticated pages from crawling
- References sitemap location

#### 2. **sitemap.xml** (✅ Added)
- Located at: `/public/sitemap.xml`
- Lists all public pages that should be indexed:
  - Home page (/)
  - Terms (/terms)
  - Privacy (/privacy)
  - Install instructions (/install)
- Update `<lastmod>` dates when you make changes

#### 3. **Improved Vercel Configuration** (✅ Updated)
- File: `vercel.json`
- Changed from generic rewrites to specific pattern matching
- Excludes static assets from rewrites
- Added `X-Robots-Tag: index, follow` header

#### 4. **Enhanced SEO Meta Tags** (✅ Updated)
- Added canonical URLs
- Added robots meta tag
- Added keywords meta tag
- Enhanced Open Graph tags
- Added Twitter Card tags

---

## Next Steps: Google Search Console Actions

### 1. **Submit Sitemap**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (mysked.ca)
3. Navigate to: **Sitemaps** (in left sidebar)
4. Enter: `https://mysked.ca/sitemap.xml`
5. Click **Submit**

### 2. **Force Google to Update Your Listing (IMPORTANT!)**
Google is currently showing OLD cached data. To force an update:

1. Go to **URL Inspection** tool in Search Console
2. Enter: `https://mysked.ca/`
3. Click **Request Indexing**
4. Wait 24-72 hours for Google to re-crawl

**Why the old data?**
- Google cached your page with title: "Jwt - MySked: Sign in"
- We've now updated to: "MySked - Workforce Management & Scheduling Platform"
- Google needs to re-crawl to see the new title

### 3. **Request Re-Indexing for Other Pages**
1. Go to **URL Inspection** tool
2. Enter each important URL:
   - `https://mysked.ca/terms`
   - `https://mysked.ca/privacy`
   - `https://mysked.ca/install`
3. Click **Request Indexing** for each

### 4. **Fix Redirect Issues**
Since the pages are now properly configured:
1. Go to **Index > Pages** report
2. Click on "Page with redirect" issue
3. Review affected URLs
4. If they're authenticated pages (dashboard, schedules, etc.), this is **expected behavior** - these should NOT be indexed
5. For public pages, the fixes above should resolve the issue within 7-14 days

### 5. **Monitor Progress**
- Check Search Console weekly
- Look for improvements in "Pages" report
- Verify that public pages are being indexed

---

## Important Notes

### Pages That SHOULD Be Indexed:
- `/` (Home/Login page)
- `/terms` (Terms of Service)
- `/privacy` (Privacy Policy)
- `/install` (PWA Installation)

### Pages That Should NOT Be Indexed:
- `/dashboard/*` (Authenticated area)
- `/schedules/*` (Worker schedule pages)
- `/works/*` (Job management)
- `/management/*` (Admin pages)
- `/auth/*` (Login/signup flows)

These are blocked in `robots.txt` and will show as "Page with redirect" or "Blocked by robots.txt" - **this is correct and intentional**.

---

## Maintenance

### When Adding New Public Pages:
1. Update `public/sitemap.xml` with new URL
2. Update `public/robots.txt` if needed
3. Submit updated sitemap to Google Search Console

### When Updating Content:
1. Update `<lastmod>` date in `sitemap.xml`
2. Request re-indexing via Search Console

---

## Verification

After deploying these changes:

1. **Test robots.txt**: Visit `https://mysked.ca/robots.txt`
2. **Test sitemap.xml**: Visit `https://mysked.ca/sitemap.xml`
3. **Test meta tags**: View page source on your site
4. **Google's Rich Results Test**: https://search.google.com/test/rich-results
5. **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly

---

## Expected Timeline

- **Immediate**: robots.txt and sitemap are accessible
- **1-3 days**: Google starts crawling with new configuration
- **7-14 days**: Public pages should be indexed
- **2-4 weeks**: Full indexing and ranking improvements

---

## Contact Support

If issues persist after 2 weeks:
1. Check Search Console for specific errors
2. Verify Vercel deployment is successful
3. Ensure DNS is properly configured
4. Use Google's URL Inspection tool for detailed feedback

