# ECCE Analytics Documentation

This directory contains documentation for the ECCE analytics system.

## Documentation Index

| Document | Audience | Description |
|----------|----------|-------------|
| **[Product Guide](analytics-product.md)** | Product, Design, Stakeholders | Non-technical overview of what we track and why |
| **[Engineering Guide](analytics-engineering.md)** | Engineers | Technical implementation, code examples, API reference |

## Quick Reference

### Events

| Event | Trigger | Key Properties |
|-------|---------|----------------|
| `garment_selected` | User clicks garment | slug, name, mode, user_role |
| `garment_session_ended` | User leaves garment | slug, name, mode, user_role, duration_seconds |
| `garment_action_clicked` | User clicks CTA | slug, name, mode, user_role, action_type |
| `request_submitted` | Form submission | message |

### Action Types

- `description` - Opened description dialog
- `tiktok` - Clicked TikTok link
- `provenance` - Opened provenance info (research only)
- `construction` - Opened construction details (research only)
- `analytics` - Viewed analytics (research only)
- `export` - Downloaded pattern (research only)

### User Roles

- `curator` - Museum/gallery curators
- `designer` - Fashion designers
- `vc` - Venture capital/investors
- `null` - Anonymous public visitors

### Interest Score

1-7 scale based on:
- Views (40% weight)
- Time spent (60% weight)

Relative to all garments in the collection.

## Key Files

```
lib/
├── analytics/
│   ├── index.ts                      # Public exports
│   ├── tracking.ts                   # Event capture functions
│   └── useGarmentSessionTracking.ts  # Auto-tracking hook
│
├── actions/
│   └── getGarmentAnalytics.ts        # Server-side HogQL queries
│
└── components/
    ├── AnalyticsUI.tsx               # Analytics display components
    └── UIElementsShared.tsx          # TrackedDialogTrigger
```

## Environment Variables

```env
# Client-side (browser)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx

# Server-side (HogQL queries)
POSTHOG_PERSONAL_API_KEY=phx_xxx
POSTHOG_PROJECT_ID=12345
```
