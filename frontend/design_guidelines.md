# Anime Streaming Platform Design Guidelines

## Design Approach
**Reference-Based Approach** drawing inspiration from Netflix, Crunchyroll, and Disney+ streaming platforms. The design prioritizes visual content discovery with immersive imagery and streamlined navigation for binge-watching experiences.

## Typography System

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Hero Titles: text-4xl to text-6xl, font-bold (anime titles, featured content)
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles: text-lg, font-semibold
- Body Text: text-base, font-normal
- Metadata: text-sm, font-medium (episode counts, release years, ratings)
- Captions: text-xs, font-normal (genre tags, timestamps)

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: m-2, m-4, m-6, m-8
- Vertical spacing: py-8, py-12, py-16 for sections

**Container Strategy:**
- Max-width: max-w-7xl for content areas
- Full-width hero sections with inner constraints
- Grid layouts: grid-cols-2 md:grid-cols-4 lg:grid-cols-6 for anime cards

## Core Components

### Navigation Header
- Sticky top navigation (h-16) with logo left, nav links center, user avatar right
- Search bar integrated into header
- Use Heroicons for search, profile, notifications
- Backdrop blur effect: backdrop-blur-md with subtle transparency

### Anime Card Component
- Aspect ratio 2:3 (poster format) using aspect-[2/3]
- Hover state: scale transform (hover:scale-105) with transition
- Overlay gradient on hover revealing title and quick actions
- Include: thumbnail image, title, episode count badge, genre tags

### Video Player Page
- Full-width video player (16:9 aspect ratio)
- Player controls: custom UI with play/pause, timeline, volume, fullscreen
- Below player: Episode selector grid (grid-cols-3 md:grid-cols-5)
- Right sidebar: Anime details, related episodes, recommendations

### Dashboard Layout
- Hero carousel at top (h-[70vh]) with featured anime, auto-rotating
- Horizontal scrolling rows for categories ("Continue Watching", "Trending", "New Releases")
- Each row displays 6-8 cards on desktop, scroll behavior on mobile

### Authentication Pages
- Centered card layout (max-w-md) on minimal background
- Split-screen optional: left side with anime artwork collage, right side form
- Social login buttons with icons (Google, GitHub, etc. via Replit Auth)
- Form inputs: rounded-lg, focus ring styling

## Images Strategy

**Required Images:**

1. **Hero Section (Dashboard):**
   - Large banner format (1920x800px minimum)
   - Featured anime artwork with gradient overlay
   - Multiple rotating banners for carousel
   - CTA buttons with backdrop-blur-md backgrounds

2. **Anime Card Thumbnails:**
   - Vertical poster format (600x900px)
   - Grid display throughout dashboard
   - Hover reveals additional metadata overlay

3. **Authentication Background:**
   - Subtle anime-themed collage or single hero image
   - Low opacity (opacity-20 to opacity-30) to not distract from form

4. **Episode Thumbnails:**
   - Horizontal format (16:9 ratio, 480x270px)
   - Episode selector grid on watch page

5. **User Avatars:**
   - Circular (rounded-full) profile images
   - Default placeholder if not set

**Placeholder Strategy:** Use gradient backgrounds with anime genre colors as placeholders during development, clearly marked for replacement.

## Interaction Patterns

**Hover States:**
- Cards: Subtle lift (hover:shadow-xl) and scale
- Buttons: Slight brightness shift, no aggressive animations
- Navigation: Underline animation (decoration transitions)

**Scroll Behavior:**
- Horizontal scroll rows with smooth momentum scrolling
- Fade indicators at row edges showing more content
- Sticky navigation remains visible while scrolling

**Video Controls:**
- Show on hover/tap, auto-hide after 3 seconds of inactivity
- Progress bar always visible at bottom
- Keyboard shortcuts supported (space, arrows, f)

## Mobile Responsiveness

- Stack horizontal rows to vertical scrolling on mobile
- Reduce grid columns: 2 on mobile, 4 on tablet, 6 on desktop
- Collapsible navigation menu (hamburger) below md breakpoint
- Video player adapts to full-width on all screens
- Touch-friendly tap targets (minimum h-12 w-12)