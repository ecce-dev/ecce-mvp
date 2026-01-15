# ECCE Analytics - Product Guide

A non-technical overview of the analytics system for product managers, designers, and stakeholders.

---

## What We Track

The ECCE platform tracks how users interact with garments to help understand engagement and interest levels.

### User Actions Tracked

| Action | Description | Available In |
|--------|-------------|--------------|
| **Garment View** | When someone clicks on a garment to see it in detail | Public & Research |
| **Time Spent** | How long someone looks at each garment | Public & Research |
| **Description Click** | When someone opens the description dialog | Public & Research |
| **TikTok Click** | When someone clicks "Try via TikTok" | Public & Research |
| **Provenance Click** | When someone opens provenance info | Research only |
| **Construction Click** | When someone opens construction details | Research only |
| **Analytics Click** | When a researcher views analytics | Research only |
| **Export Click** | When someone exports a pattern | Research only |

### User Types Identified

When users log in with a password, we track which type of user they are:

- **Curator** - Museum/gallery curators
- **Designer** - Fashion designers
- **VC** - Venture capital/investors
- **Anonymous** - Public visitors (not logged in)

### Geographic Data

PostHog automatically captures the country of each visitor, allowing us to see:
- Which countries show the most interest
- Geographic distribution of engagement
- Top 3 countries per garment

---

## The Interest Score

Each garment gets an **Interest Score** from 1-7, displayed as a color-coded meter in the Analytics dialog.

### How It's Calculated

The score combines two factors:

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| **Views** | 40% | How many people clicked on the garment |
| **Time Spent** | 60% | Total time people spent viewing it |

Time is weighted higher because spending more time indicates deeper engagement.

### Interest Levels

| Level | Label | Color | Meaning |
|-------|-------|-------|---------|
| 1 | Very Low | Red | Minimal interest |
| 2 | Low | Orange | Below average interest |
| 3 | Low-Medium | Yellow | Slightly below average |
| 4 | Medium | Lime | Average interest |
| 5 | Medium-High | Light Green | Above average |
| 6 | High | Green | Strong interest |
| 7 | Very High | Dark Green | Exceptional interest |

### Relative Scoring

Scores are **relative to other garments** in the collection:
- The garment with the most engagement = highest score
- Other garments are scored proportionally
- A "Medium" score means average compared to other garments

---

## Where to See Analytics

### In the App (Research Mode)

1. Log in with a research password
2. Click on any garment
3. Click the "Analytics" button
4. See the analytics dialog with:
   - Interest meter (1-7 scale)
   - Total views and interactions
   - Time spent (total and average)
   - Top 3 countries
   - Action breakdown

### In PostHog Dashboard

Access PostHog at [us.posthog.com](https://us.posthog.com) to see:
- Real-time event stream
- Custom insights and dashboards
- Detailed breakdowns by any property
- Historical trends

---

## Key Metrics Explained

### Views
Total number of times the garment was clicked/selected by users.

### Interactions
Total clicks on action buttons (Description, TikTok, Provenance, etc.).

### Total Time
Combined time all users spent viewing the garment.

### Average Time
Average viewing duration per session (Total Time ÷ Views).

### Top Countries
The 3 countries with the most engagement for this garment.

---

## Common Questions

### How fresh is the data?
Data in the Analytics dialog is cached for **5 minutes** to ensure fast loading. PostHog's dashboard shows real-time data.

### How far back does data go?
The analytics display shows data from the **last 90 days**. Historical data is preserved in PostHog.

### Can I see data for all garments at once?
Currently, analytics are shown per-garment. For collection-wide insights, use the PostHog dashboard.

### How do I know if tracking is working?
In PostHog, go to "Live Events" to see events coming in real-time as users interact with the site.

### What about privacy?
- No personal information is collected
- Geographic data is country-level only (no city/address)
- Users can reject cookies, which disables tracking
- Data is stored securely in PostHog

---

## Suggested PostHog Insights

Create these insights in PostHog for ongoing monitoring:

### 1. Weekly Engagement Trend
- See how overall engagement changes week over week
- Event: `garment_selected`, grouped by week

### 2. Most Popular Garments
- Rank garments by total views
- Event: `garment_selected`, breakdown by `garment_name`

### 3. User Type Distribution
- See the mix of curators, designers, VCs, and public visitors
- Event: `garment_selected`, breakdown by `user_role`

### 4. Geographic Heatmap
- Visualize where interest is coming from
- Event: `garment_selected`, breakdown by `$geoip_country_name`

### 5. Action Funnel
- See conversion from view → interaction
- Funnel: `garment_selected` → `garment_action_clicked`

---

## Glossary

| Term | Definition |
|------|------------|
| **Event** | A tracked user action (view, click, etc.) |
| **Session** | The time between selecting and deselecting a garment |
| **Interest Score** | Normalized engagement metric (1-7 scale) |
| **Breakdown** | Splitting data by a property (e.g., by country) |
| **PostHog** | The analytics platform we use |
| **HogQL** | PostHog's query language for custom analysis |
