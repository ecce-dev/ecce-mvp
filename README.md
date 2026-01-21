# ECCE MVP

Interactive 3D garment viewer built with Next.js, Three.js, and WordPress as a headless CMS.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Development](#development)
- [Project Architecture](#project-architecture)
- [Hosting & Infrastructure](#hosting--infrastructure)
  - [Vercel Deployment](#vercel-deployment)
  - [Cloudflare DNS](#cloudflare-dns)
  - [WordPress Hosting (Hetzner)](#wordpress-hosting-hetzner)
- [WordPress CMS](#wordpress-cms)
  - [Accessing the CMS](#accessing-the-cms)
  - [Data Structure](#data-structure)
  - [Managing Garments](#managing-garments)
  - [Cache Invalidation](#cache-invalidation)
- [Analytics (PostHog)](#analytics-posthog)
- [Tech Stack](#tech-stack)

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or yarn/pnpm)
- Access to the WordPress CMS admin panel
- PostHog account (for analytics)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# ============================================
# WORDPRESS CMS (Required)
# ============================================

# WordPress GraphQL endpoint base URL (without /graphql)
WORDPRESS_CMS_URL=https://admin.ecce.ing

# Basic Auth credentials for WordPress API access
WORDPRESS_CMS_BASIC_AUTH_USER=your_username
WORDPRESS_CMS_BASIC_AUTH_PW=your_password

# ============================================
# POSTHOG ANALYTICS (Required)
# ============================================

# Client-side tracking (public, embedded in browser)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx

# Server-side API access for HogQL queries
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxxxxxxxxxxxxxx
POSTHOG_PROJECT_ID=12345

# ============================================
# CLOUDFLARE TURNSTILE (Optional - for bot protection)
# ============================================

NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

#### Environment Variable Reference

| Variable | Type | Description |
|----------|------|-------------|
| `WORDPRESS_CMS_URL` | Required | WordPress site URL (e.g., `https://admin.ecce.ing`) |
| `WORDPRESS_CMS_BASIC_AUTH_USER` | Required | WordPress Basic Auth username |
| `WORDPRESS_CMS_BASIC_AUTH_PW` | Required | WordPress Basic Auth password |
| `NEXT_PUBLIC_POSTHOG_KEY` | Required | PostHog project API key (client-side) |
| `POSTHOG_PERSONAL_API_KEY` | Required | PostHog personal API key (server-side HogQL queries) |
| `POSTHOG_PROJECT_ID` | Required | PostHog project ID |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Optional | Cloudflare Turnstile secret key |

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ecce-mvp.git
cd ecce-mvp

# Install dependencies
npm install

# Generate GraphQL types (requires WordPress CMS to be accessible)
npm run codegen
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

#### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run codegen` | Generate GraphQL TypeScript types |
| `npm run codegen:watch` | Watch mode for GraphQL codegen |

---

## Project Architecture

```
ecce-mvp/
├── app/                          # Next.js App Router
│   ├── api/auth/                 # Authentication API routes
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── lib/
│   ├── actions/                  # Server actions
│   │   ├── apolloClient.ts       # GraphQL client setup
│   │   ├── getGarments.ts        # Garment fetching logic
│   │   ├── getGarmentAnalytics.ts # PostHog analytics queries
│   │   └── getGlobalSettings.ts  # CMS settings fetching
│   ├── analytics/                # PostHog tracking
│   │   ├── tracking.ts           # Event capture functions
│   │   └── useGarmentSessionTracking.ts # Session tracking hook
│   ├── components/               # React components
│   │   ├── r3f/                  # Three.js/React Three Fiber components
│   │   ├── ecce-elements/        # Custom UI components
│   │   └── ui/                   # Shadcn UI components
│   ├── gql/                      # GraphQL
│   │   ├── queries/              # .gql query files
│   │   └── __generated__/        # Auto-generated types
│   ├── stores/                   # Zustand state management
│   └── hooks/                    # Custom React hooks
├── docs/                         # Documentation
│   ├── analytics-engineering.md  # Technical analytics guide
│   └── analytics-product.md      # Product analytics guide
└── public/                       # Static assets
```

---

## Hosting & Infrastructure

### Vercel Deployment

The application is deployed on [Vercel](https://vercel.com) with automatic deployments from the main branch.

#### Deployment Configuration

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all environment variables from the [Environment Variables](#environment-variables) section
3. **Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Cache Invalidation via Vercel

After updating content in WordPress, you may need to invalidate the Next.js cache:

```bash
# Using Vercel CLI
vercel env pull  # Pull latest env vars
vercel --prod    # Redeploy to production
```

Or trigger a redeployment from the Vercel dashboard.

### Cloudflare DNS

Domain DNS is managed through Cloudflare for the main application domain.

#### DNS Configuration

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | Proxied (orange) |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied (orange) |

#### SSL/TLS Settings

- **SSL/TLS Mode**: Full (strict)
- **Always Use HTTPS**: Enabled
- **Minimum TLS Version**: 1.2

#### Custom Domain Setup in Vercel

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `ecce.ing`)
3. Verify DNS is pointing to Vercel
4. Enable SSL certificate

### WordPress Hosting (Hetzner)

The WordPress CMS is self-hosted on a Hetzner VPS with the WPGraphQL plugin.

#### Server Details

- **Provider**: Hetzner Cloud
- **Domain**: `admin.ecce.ing`
- **Stack**: LAMP/LEMP with WordPress
- **GraphQL Endpoint**: `https://admin.ecce.ing/graphql`

#### WordPress Plugins Required

| Plugin | Purpose |
|--------|---------|
| **WPGraphQL** | Exposes WordPress data via GraphQL API |
| **Advanced Custom Fields (ACF)** | Custom fields for garments |
| **WPGraphQL for ACF** | Exposes ACF fields in GraphQL |
| **Basic Auth** | Protects the GraphQL endpoint |

#### Server Access

```bash
# SSH access (requires authorized key)
ssh user@your-hetzner-ip
```

---

## WordPress CMS

### Accessing the CMS

1. Navigate to [https://admin.ecce.ing/wp-admin](https://admin.ecce.ing/wp-admin)
2. Log in with your WordPress credentials
3. Access garments via **Garments** in the sidebar

### Data Structure

#### Garments

Garments are a custom post type with the following ACF fields:

```graphql
type GarmentFields {
  # Basic Information
  name: String              # Display name of the garment
  designer: String          # Designer/creator name
  description: String       # Marketing description
  version: String           # Version number
  
  # Content
  provenance: String        # Historical context and origin
  construction: String      # Technical construction details
  rights: String            # Usage rights information
  
  # Media Files
  threeDFileGlb: MediaItem  # 3D GLB model file
  patternPngPreview: MediaItem  # Preview pattern image
  patternPngDownload: MediaItem # Full resolution pattern for download
  patternDescription: String    # Pattern metadata (research only)
  
  # External Links
  linkToTiktok: String      # TikTok AR filter URL
}
```

**Note**: `patternZipDownload` and `patternDescription` are private fields only visible in research mode.

#### Global Settings

Global site settings are stored in a single "Global Settings" page:

```graphql
type GlobalSettings {
  about: String         # About page content (HTML)
  contact: String       # Contact page content (HTML)
  passwordConfig: String # JSON with role passwords
}
```

##### Password Configuration Format

The `passwordConfig` field stores a JSON string:

```json
{
  "curator": "password_for_curators",
  "designer": "password_for_designers",
  "vc": "password_for_investors"
}
```

### Managing Garments

#### Adding a New Garment

1. Go to **Garments** → **Add New** in WordPress admin
2. Fill in the required fields:
   - **Title**: Used as the slug (URL-friendly identifier)
   - **Name**: Display name shown in the UI
   - **Designer**: Creator attribution
   - **Description**: Marketing copy
3. Upload media:
   - **3D File GLB**: The 3D model (GLB format, max ~50MB recommended)
   - **Pattern PNG Preview**: Thumbnail for UI
   - **Pattern PNG Download**: Full resolution pattern file
4. Add optional content:
   - **Provenance**: Historical background
   - **Construction**: Technical details
   - **Link to TikTok**: AR filter URL
5. Click **Publish**

#### Updating an Existing Garment

1. Go to **Garments** in WordPress admin
2. Click on the garment to edit
3. Make your changes
4. Click **Update**
5. **Important**: Trigger cache invalidation (see below)

#### Uploading 3D Models

GLB files should be:
- **Format**: GLB (binary glTF)
- **Size**: Under 50MB recommended for performance
- **Optimization**: Compressed textures, reduced polygon count
- **Orientation**: Y-up coordinate system

Upload via **Media** → **Add New** or directly in the garment editor.

### Cache Invalidation

The Next.js application caches garment data for 5 minutes. After updating content in WordPress:

#### Option 1: Wait for Automatic Revalidation
Cache automatically expires after 5 minutes.

#### Option 2: Redeploy on Vercel
Trigger a new deployment to clear all caches:
- Push a commit to main branch, OR
- Click "Redeploy" in Vercel dashboard

#### Option 3: On-Demand Revalidation (Future)
*Note: On-demand revalidation via webhook is planned but not yet implemented.*

---

## Analytics (PostHog)

The application uses PostHog for comprehensive analytics tracking. For detailed documentation, see:

- **[Engineering Guide](docs/analytics-engineering.md)** - Technical implementation details
- **[Product Guide](docs/analytics-product.md)** - Non-technical overview for stakeholders

### Quick Overview

#### Events Tracked

| Event | Description |
|-------|-------------|
| `garment_selected` | User clicks on a garment |
| `garment_session_ended` | User leaves a garment (includes duration) |
| `garment_action_clicked` | User clicks a CTA (description, tiktok, etc.) |
| `request_submitted` | User submits a request form |

#### Data Captured

Each event includes:
- `garment_slug` - Unique identifier
- `garment_name` - Display name
- `mode` - public or research
- `user_role` - curator, designer, vc, or null
- Geographic data (auto-captured by PostHog)

#### Interest Score

Garments receive an interest score (1-7) based on:
- **Views** (40% weight)
- **Time spent** (60% weight)

Higher scores indicate stronger engagement relative to other garments.

### PostHog Configuration

#### Client-Side Tracking

PostHog is initialized in `instrumentation-client.ts`:

```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",  // Proxied to avoid ad blockers
  ui_host: "https://us.posthog.com",
  cookieless_mode: 'on_reject'  // Respects cookie consent
});
```

#### Server-Side Queries

Analytics data is queried via HogQL in `lib/actions/getGarmentAnalytics.ts`:
- Uses `POSTHOG_PERSONAL_API_KEY` for authentication
- Results cached for 5 minutes
- Queries cover 90-day rolling window

#### Accessing Analytics in the App

1. Log in with a research password
2. Select a garment
3. Click the **Analytics** button
4. View interest score, engagement metrics, and geographic data

### PostHog Dashboard

Access the full PostHog dashboard at [us.posthog.com](https://us.posthog.com) for:
- Real-time event stream
- Custom insights and funnels
- Session recordings
- Feature flags

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **3D Rendering** | Three.js, React Three Fiber, Drei |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | Shadcn UI, Radix UI |
| **State Management** | Zustand |
| **Data Fetching** | Apollo Client, TanStack Query |
| **CMS** | WordPress + WPGraphQL |
| **Analytics** | PostHog |
| **Hosting** | Vercel (app), Hetzner (WordPress) |
| **DNS** | Cloudflare |
| **Forms** | React Hook Form, Zod |
| **Animation** | React Spring, Lottie |

---

## License

Private - All rights reserved.
