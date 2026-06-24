# **HomeReady AI**

## **AI-Powered Pre-Listing Home Upgrade Advisor**

**Product Requirements Document • Web Application • v1.0**

| Field | Value |
| :---- | :---- |
| Document version | 1.0 |
| Status | Draft — for internal review |
| Platform scope | Web (desktop-first, responsive) |
| Target release | Q4 2026 — MVP |
| Author | Product & Engineering |
| Classification | Confidential |

### **1\. Executive Summary**

HomeReady AI is a web-based, AI-powered advisor that helps home sellers identify the highest-ROI upgrades to make before listing their property. Given photos of a home, the platform uses a multi-agent AI pipeline to analyze gaps versus comparable sold listings, generate photorealistic before/after upgrade visualizations, rank upgrade options by return on investment within a user-specified budget, and connect sellers with vetted local contractors to execute the work.

The platform targets a market where buyer selectivity is at historic highs. Sellers who make targeted, data-driven upgrades sell faster and closer to asking price. HomeReady AI makes expert pre-listing guidance available to any seller without requiring an agent walk-through or interior designer consultation.

### **2\. Problem Statement**

Today's housing market punishes sellers who list unprepared homes. Buyers increasingly bypass properties that require work. The status quo for sellers is:

* No data-driven signal on which upgrades actually move the needle for their zip code.  
* Agent walk-throughs are subjective, inconsistent, and dependent on agent expertise.  
* Home stagers cost $1,500–$5,000 and provide no ROI quantification.  
* Contractor sourcing is fragmented; sellers waste weeks getting quotes for the wrong projects.  
* No tool generates a photorealistic visual of what the recommended upgrade will look like in their actual room.

Compass Lens (2020) pioneered AI-driven room analysis but is locked to Compass agents. Zillow Virtual Staging is buyer-facing only. Redfin \+ Thumbtack is a generic maintenance tool with no upgrade intelligence. No product today closes the full loop from photo → AI gap analysis → generated visual → contractor match.

### **3\. Goals & Success Metrics**

#### **3.1 Product Goals**

* Deliver actionable, ranked upgrade recommendations within 60 seconds of photo upload.  
* Generate photorealistic before/after visuals for each top recommendation.  
* Surface 3+ matched local contractors per recommendation category.  
* Support Google SSO for frictionless sign-in on the web app.  
* Achieve a report-to-contractor-contact conversion rate ≥ 15%.

#### **3.2 Business Goals**

* Reach 500 paid reports in the first 90 days post-launch.  
* Achieve a Net Promoter Score ≥ 45 within 6 months.  
* Close 3+ brokerage white-label agreements within 12 months of launch.

#### **3.3 Key Metrics**

| Metric | Target (90 days) | Target (12 months) |
| :---- | :---- | :---- |
| Monthly active users | 1,000 | 15,000 |
| Paid reports generated | 500 | 8,000 |
| Time-to-report (p95) | \< 90 sec | \< 60 sec |
| Report completion rate | \> 70% | \> 80% |
| Contractor click-through rate | \> 15% | \> 25% |
| Google SSO adoption | \> 60% | \> 70% |
| MoM revenue growth | \- | \> 20% |

### **4\. Non-Goals (v1 Web MVP)**

* iOS and Android native apps (Phase 2).  
* Real-time contractor booking or in-app payments to contractors (Phase 2).  
* Automated MLS listing creation or agent CRM integration (Phase 3).  
* Buyer-facing features (home search, buyer recommendations).  
* Non-US markets (Canada, UK expansion is Phase 3).  
* Voice or conversational AI interface (Phase 3).

### **5\. User Personas**

#### **5.1 Sarah — The Motivated Seller**

38, suburban homeowner in Dallas TX. Plans to list in 60 days. Has a $10,000 upgrade budget. Feels overwhelmed about which projects to prioritize. Wants data and visuals, not opinions.

#### **5.2 Marcus — The Real Estate Agent**

45, handles 40+ transactions/year. Wants a tool to hand to every new listing client as part of his "listing consultation kit." Values the PDF report for client meetings. Needs white-label capability.

#### **5.3 Priya — The Budget-Conscious FSBO Seller**

52, selling without an agent. Budget is $3,000. Needs to know exactly what to spend it on and who to hire. Price-sensitive; needs a clear per-report paywall.

### **6\. User Stories**

#### **6.1 Authentication**

* **US-AUTH-01:** As a new user, I can sign in with my Google account in one click so I don't have to create a separate password.  
* **US-AUTH-02:** As a returning user, I am automatically signed in if I have an active Google session (One Tap).  
* **US-AUTH-03:** As a user, I can sign up with email \+ password if I prefer not to use Google.  
* **US-AUTH-04:** As a user, I can reset my password via a secure email link.  
* **US-AUTH-05:** As a user, I can view and manage my active sessions and sign out of all devices.  
* **US-AUTH-06:** As an agent user, I can invite team members to my brokerage workspace.

#### **6.2 Property Submission**

* **US-PROP-01:** As a seller, I can enter my home address and have it auto-enriched with property data (year built, beds/baths, sqft).  
* **US-PROP-02:** As a seller, I can upload up to 20 photos of my home, with drag-and-drop support.  
* **US-PROP-03:** As a seller, I can assign room labels to each photo (kitchen, bathroom, living room, etc.).  
* **US-PROP-04:** As a seller, I can specify my total upgrade budget ($1,000–$50,000+).  
* **US-PROP-05:** As a seller, I can specify my listing timeline (within 30 / 60 / 90 / 180 days).

#### **6.3 AI Analysis & Recommendations**

* **US-REC-01:** As a seller, I receive a ranked list of upgrade recommendations with estimated cost ranges and ROI within 90 seconds of submission.  
* **US-REC-02:** As a seller, I can see each recommendation explained in plain language with the market rationale.  
* **US-REC-03:** As a seller, I can view AI-generated before/after images for each top recommendation.  
* **US-REC-04:** As a seller, I can change my budget and see the recommendation list instantly re-ranked.  
* **US-REC-05:** As a seller, I can mark recommendations as "accepted", "skipped", or "ask a contractor".

#### **6.4 Contractor Matching**

* **US-CON-01:** As a seller, for each accepted recommendation I see 3 matched local contractors with ratings, review count, and typical price range.  
* **US-CON-02:** As a seller, I can request a quote from a contractor directly from the app.  
* **US-CON-03:** As a seller, I can filter contractors by distance, rating, and availability.

#### **6.5 Reports & Sharing**

* **US-RPT-01:** As a seller, I can download a branded PDF report of all recommendations to share with my agent or family.  
* **US-RPT-02:** As an agent, I can share a white-labeled report with my client's name and my brokerage branding.  
* **US-RPT-03:** As a seller, I can share a read-only link to my report without requiring the recipient to log in.

### **7\. Functional Requirements**

#### **7.1 Authentication & Identity — Google SSO**

**7.1.1 Google Sign-In (Primary Auth Flow)**

* Implement "Sign In with Google" using the Google Identity Services (GIS) JavaScript SDK. The flow must use the Authorization Code flow with PKCE to ensure tokens are never exposed in the browser URL bar.  
* Display the Google Sign-In button on the landing page, login page, and signup page using the official GIS renderButton() API.  
* Implement Google One Tap for returning users: auto-prompt appears within 2 seconds of page load for users with an active Google session.  
* On successful Google auth, the backend exchanges the authorization code for an ID token \+ access token via server-side call to Google's token endpoint.  
* Extract user identity from the ID token: sub (Google user ID), email, name, picture URL.  
* On first login: create a new user record with role \= "seller". On subsequent logins: return existing user.  
* Issue an app-level JWT (access token, 15-minute expiry) and a refresh token (7-day expiry, httpOnly cookie, Secure, SameSite=Strict).  
* Refresh token rotation: each refresh issues a new refresh token and invalidates the old one.  
* Store refresh tokens in Redis with TTL \= 7 days. Redis key: refresh:{user\_id}:{token\_hash}.

**7.1.2 Email/Password Fallback**

* Users who do not want to use Google can register with email \+ password.  
* Passwords hashed with bcrypt (cost factor 12).  
* Email verification required before account activation.  
* Password reset via 6-character OTP sent to email, valid for 15 minutes.  
* Account linking: if a user registers email/password and later signs in with Google using the same email, the accounts are automatically merged.

**7.1.3 Session & Security**

* All authenticated API calls carry Authorization: Bearer {jwt}.  
* JWT validation on every request: signature, expiry, issuer, audience.  
* Force logout: invalidate all refresh tokens for a user (security events: password change, suspicious login, manual revoke).  
* Login rate limiting: max 10 attempts per IP per 15 minutes; after threshold, require CAPTCHA (reCAPTCHA v3).  
* Session activity log: store last 10 login events (timestamp, IP, device, auth method) for the user to review.

**7.1.4 Role-Based Access Control (RBAC)**

| Role | Capabilities | Who |
| :---- | :---- | :---- |
| seller | Submit properties, view own reports, manage subscription | Individual homeowners |
| agent | All seller capabilities \+ create client workspaces \+ white-label reports | Real estate agents |
| brokerage\_admin | All agent capabilities \+ manage team seats \+ billing | Brokerage office admins |
| super\_admin | Full platform access \+ user management \+ system config | Internal staff |

#### **7.2 Onboarding Flow**

* A 3-step onboarding wizard shown once per new account, skippable after step 1\.  
* Step 1 — Welcome: confirm name (pre-filled from Google), set role (I'm a seller / I'm an agent).  
* Step 2 — Your first property: lightweight address entry to start the analysis flow immediately.  
* Step 3 — Report preferences: preferred upgrade categories (kitchen, bathrooms, curb appeal, flooring, paint, staging, HVAC, landscaping).

#### **7.3 Property Submission Wizard**

A multi-step form persisted in the backend (users can abandon and resume from any device).

* Step 1 — Address: Google Places Autocomplete for address entry. On selection, ATTOM API auto-fills: year built, beds, baths, sqft, last sale price, tax value.  
* Step 2 — Photos: drag-and-drop or file picker. Max 20 photos, 15MB each. Accepted: JPEG, PNG, HEIC. Client-side compression to ≤2MB using browser-image-compression. Room label picker per photo (Kitchen, Primary Bathroom, Guest Bathroom, Living Room, Dining Room, Master Bedroom, Bedroom, Basement, Garage, Exterior Front, Exterior Back, Other). Upload to S3 via pre-signed URL with progress indicator.  
* Step 3 — Budget & timeline: budget slider ($1K to $100K+). Timeline selector. Optional: notes for the AI ("We already replaced the HVAC last year").  
* Step 4 — Review & submit: summary of inputs, estimated processing time. Submit triggers async agent pipeline.

#### **7.4 AI Agent Pipeline**

**7.4.1 Agent 1 — Intake & Property Context Agent**

* Input: address, property attributes, uploaded photo metadata, budget, timeline, user notes.  
* Actions: fetch 6-month sold comps within 0.5 miles (RESO Web API via Bridge Interactive or Trestle). Compute median features of sold comps (% with granite countertops, % with hardwood, % with updated bathrooms, median days on market, list-to-sale ratio).  
* Output: structured JSON property\_context object passed to subsequent agents.

**7.4.2 Agent 2 — Computer Vision / Room Analysis Agent**

* Model: GPT-4o Vision (primary), Gemini 2.0 Flash (fallback if GPT-4o rate limit).  
* Per uploaded photo: identify room type (override user label if confident), detect condition signals (dated fixtures, paint condition, flooring type and condition, lighting quality, clutter level, staging quality, visible damage), detect feature presence (granite/quartz/laminate countertop, hardwood/laminate/carpet flooring, subway/ceramic/outdated tile, stainless/dated appliances, updated/dated vanity).  
* Output: structured JSON per photo with detected conditions, features, and confidence scores.

**7.4.3 Agent 3 — Market Gap Analysis Agent**

* Cross-references vision output vs. comp features. E.g., if 78% of sold comps have hardwood and the subject property has carpet, "hardwood flooring" surfaces as a high-priority gap.  
* Weights gaps by: (a) frequency in comps, (b) estimated buyer preference score (from fine-tuned preference model), (c) upgrade cost feasibility.  
* Output: ranked gap list with gap\_id, category, severity (critical/high/medium/low), comp\_frequency, rationale.

**7.4.4 Agent 4 — ROI & Budget Recommendation Agent**

* Maps each gap to upgrade categories and fetches cost ranges from RSMeans / Remodeling Cost vs. Value data (stored in internal DB, refreshed annually).  
* Computes estimated sale-price uplift using a regression model trained on local MLS sales data (zip-code level, updated monthly via BigQuery ML).  
* Filters and ranks within user budget. Outputs: top recommendations with estimated\_cost\_low, estimated\_cost\_high, estimated\_uplift, roi\_score, priority\_rank.

**7.4.5 Agent 5 — Image Render Agent**

* For the top 3 ranked recommendations: generates photorealistic before/after images using DALL-E 3 or Replicate (SDXL). Input: original room photo \+ upgrade description. Output: generated\_image\_url stored in S3.  
* Watermarks generated images with HomeReady AI logo.  
* Stores generation\_prompt, model\_version, seed for reproducibility and audit.

**7.4.6 Pipeline Orchestration**

* Celery \+ Redis task queue. Each agent is a Celery task chained in sequence.  
* Server-Sent Events (SSE) endpoint: GET /api/reports/{report\_id}/status streams real-time progress (agent\_name, status: pending/running/done/failed, completion\_pct) to the frontend.  
* Total p95 target: ≤ 90 seconds end-to-end for 10 photos.  
* On agent failure: retry up to 3 times with exponential backoff. If all retries fail, mark report as error, notify user via email, offer refund or re-run.

#### **7.5 Recommendations Dashboard**

The main output screen. Components:

* Summary bar: property address, comp market summary, overall readiness score (0–100), estimated uplift at full budget.  
* Budget optimizer: interactive slider to re-rank recommendations in real time. Adjusting budget recalculates which items fit and re-orders the list (client-side calculation, no API call).  
* Recommendation cards (ranked): for each item — priority badge, upgrade category, estimated cost range, estimated sale uplift, ROI score, market rationale, status toggle (accepted / skipped / to review).  
* Before/After image viewer: full-screen swipe comparison for each recommendation with generated AI image.  
* Upgrade plan summary: accepted items totaled against budget, remaining budget displayed.

#### **7.6 Contractor Matching**

* Triggered when a user marks a recommendation as "accepted" or clicks "Find Contractors".  
* Contractor service queries Thumbtack partnership API (or Angi API) with: zip\_code, project\_category, budget\_range.  
* Display: 3 contractors per category with — business name, rating (stars \+ count), typical project range, distance, "Request Quote" CTA.  
* "Request Quote" CTA: opens Thumbtack deep-link pre-filled with project details, or triggers an in-app lead form that emails the contractor.  
* Track contractor clicks as conversion events in PostHog.

#### **7.7 Reports & PDF Export**

* PDF generation via Puppeteer (headless Chromium) rendering an HTML report template.  
* Report contents: property summary, market comp analysis, all recommendations with costs and ROI, before/after images, accepted contractor shortlist, HomeReady AI branding.  
* Agent white-label: brokerage\_admin can upload logo \+ set brand colors. PDF header/footer uses brokerage branding instead of HomeReady AI default.  
* Shareable link: GET /reports/{report\_id}/share — returns a signed, time-limited (30-day) read-only URL. No login required to view.  
* PDF stored in S3. Download link generated via pre-signed URL.

#### **7.8 Billing & Subscriptions**

Three tiers, managed via Stripe Billing:

| Tier | Price | Reports/month | Key inclusions |
| :---- | :---- | :---- | :---- |
| Pay-per-report | $39/report | Any (pay each) | Full analysis, before/after images, contractor match, PDF export |
| Seller Pro | $49/month | 3 reports | All pay-per-report features \+ saved history \+ priority processing |
| Agent/Brokerage | $149/month | 20 reports | All Pro features \+ white-label PDF \+ team seats (up to 5\) \+ API access |

* Stripe Customer Portal for self-serve plan upgrades, downgrades, and cancellation.  
* Usage metering: track reports\_generated per billing cycle via Stripe usage records.  
* Overage for Seller Pro: $15/additional report. Overage for Agent: $10/additional report.  
* Free tier: 1 report (no images, no PDF) to allow pre-conversion evaluation.

#### **7.9 Notification System**

* SendGrid for transactional email. Firebase Cloud Messaging for push (Phase 2).  
* Welcome email (Google SSO first login).  
* Report ready email (with deep link and PDF attachment).  
* Report error email (with instructions to retry or contact support).  
* Subscription confirmation, renewal, and payment failure emails.  
* Contractor quote received email.  
* Weekly digest (opt-in): market update for the user's zip code.

#### **7.10 Admin Portal**

Internal tool (Retool or custom React app at admin.homereadyai.com).

* User management: search, view, impersonate, ban, export.  
* Report management: view all reports, agent queue, error logs, manual re-run.  
* Billing: view revenue, MRR, churn, failed payments; issue refunds.  
* AI monitoring: cost per report, agent success/failure rates, model latency.  
* Feature flags: toggle feature flags per user, role, or globally.

### **8\. Non-Functional Requirements**

#### **8.1 Performance**

| Metric | Target |
| :---- | :---- |
| Time to Interactive (TTI) | \< 2.5 seconds (Core Web Vitals "Good") |
| Largest Contentful Paint (LCP) | \< 2.5 seconds |
| AI report generation (p50) | \< 60 seconds |
| AI report generation (p95) | \< 90 seconds |
| PDF generation | \< 10 seconds |
| API response (non-AI) | \< 200ms (p99) |
| Photo upload throughput | 5 concurrent uploads, each ≤ 15MB |

#### **8.2 Security**

* All traffic over HTTPS/TLS 1.3. HSTS with max-age=31536000, includeSubDomains.  
* Content Security Policy (CSP): strict policy blocking inline scripts, restricting external sources to allow-listed domains only.  
* CORS: origin whitelist — homereadyai.com, \*.homereadyai.com. No wildcard in production.  
* Security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.  
* All PII (email, address, photos) encrypted at rest (AES-256 via GCP KMS / AWS KMS).  
* Photos auto-deleted 90 days after report generation unless user opts to retain.  
* OWASP Top 10 compliance: input validation, parameterized queries, rate limiting, CSRF tokens.  
* Dependency scanning: Snyk integrated in CI/CD pipeline.  
* SAST: Semgrep on every pull request.  
* Penetration test: annually via third-party vendor.  
* Secrets: zero secrets in code or environment files. All via GCP Secret Manager / AWS Secrets Manager.

#### **8.3 Availability & Scalability**

* SLA: 99.5% uptime (excludes planned maintenance).  
* Horizontal auto-scaling: Kubernetes HPA based on CPU (target 70%) and queue depth.  
* Database: PostgreSQL with read replicas for reporting queries. Connection pooling via PgBouncer.  
* CDN: Cloud CDN or CloudFront in front of all static assets and image delivery. Cache-Control headers set appropriately.  
* Graceful degradation: if AI agents are degraded, accept submissions and queue for processing; notify user of delay.

#### **8.4 Compliance**

* GDPR: right to deletion (DELETE /api/users/me removes all PII, anonymizes reports), right to data export (GET /api/users/me/export returns JSON), cookie consent via Osano.  
* CCPA: do-not-sell opt-out link in footer; honored in analytics pipeline.  
* MLS data: d...