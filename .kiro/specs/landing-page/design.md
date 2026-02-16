# Design Document: Landing Page

## Overview

This design document outlines the implementation of a landing page for the PayMeJor BTC lending platform. The landing page will serve as the entry point for new visitors, featuring interactive visual effects (ClickSpark), clear value proposition messaging, and seamless navigation to the main application.

The implementation will leverage Next.js App Router capabilities to create a new route structure where the landing page is at the root ("/") and the main application moves to "/app". This approach maintains clean separation of concerns while preserving all existing functionality.

## Architecture

### Route Structure

The application will adopt the following route structure:

```
/                    → Landing page (new)
/app                 → Main application (current page.tsx content)
/app?tab=dashboard   → Dashboard tab
/app?tab=deposit     → Deposit tab
/app?tab=borrow      → Borrow tab
/app?tab=positions   → Positions tab
/app?tab=exit        → Exit tab
```

### Component Hierarchy

```
app/
├── layout.tsx (root layout - unchanged)
├── page.tsx (new landing page)
└── app/
    └── page.tsx (moved from root page.tsx)
```

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS with existing theme system
- **Visual Effects**: @react-bits/ClickSpark-TS-CSS
- **Icons**: lucide-react (existing)

## Components and Interfaces

### 1. Landing Page Component (`app/page.tsx`)

The main landing page component that replaces the current root page.

**Props**: None (root page component)

**Structure**:
```typescript
export default function LandingPage() {
  // Component implementation
}
```

**Responsibilities**:
- Render hero section with headline and description
- Display key features/benefits
- Provide CTA button to navigate to /app
- Integrate ClickSpark effect
- Support theme switching (dark/light mode)

### 2. ClickSpark Integration

The ClickSpark component will be added as a dependency and integrated into the landing page.

**Installation**:
```bash
pnpm add @react-bits/clickspark-ts-css
```

**Configuration**:
```typescript
<ClickSpark
  sparkColor="#ffffff"
  sparkSize={13}
  sparkRadius={17}
  sparkCount={6}
  duration={400}
  easing="ease-out"
  extraScale={1}
/>
```

### 3. Hero Section

A prominent section at the top of the landing page.

**Content Elements**:
- Main headline emphasizing BTC lending value proposition
- Subheadline explaining the platform
- Primary CTA button ("Launch App" or "Get Started")
- Optional: Background gradient or visual element

### 4. Features Section

A section highlighting key platform features.

**Content Elements**:
- 3-4 feature cards with icons
- Brief descriptions of each feature
- Consistent with existing design system

### 5. Application Page (`app/app/page.tsx`)

The existing application interface moved to a new route.

**Changes**:
- File moved from `app/page.tsx` to `app/app/page.tsx`
- No functional changes to the component
- All existing functionality preserved

## Data Models

No new data models are required. The landing page is a static presentation layer with client-side navigation.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, most requirements for the landing page are specific UI integration examples rather than universal properties. The landing page is primarily a presentation layer with static content and navigation, which is best validated through example-based tests.

### Example-Based Tests

The following specific examples should be tested:

**Example 1: Root route renders landing page**
The root URL ("/") should render the LandingPage component, not the app dashboard.
**Validates: Requirements 1.1**

**Example 2: CTA button presence**
The landing page should contain a call-to-action button or link that navigates to "/app".
**Validates: Requirements 1.2, 4.1**

**Example 3: CTA navigation behavior**
Clicking the CTA button should navigate the user to the "/app" route.
**Validates: Requirements 1.3**

**Example 4: ClickSpark component integration**
The landing page should render the ClickSpark component with the specified configuration props.
**Validates: Requirements 2.1, 2.3**

**Example 5: Hero section content**
The landing page should render a hero section containing a headline and description.
**Validates: Requirements 3.1**

**Example 6: Features section content**
The landing page should render a features section displaying platform benefits.
**Validates: Requirements 3.2**

**Example 7: Theme system integration**
The landing page should integrate with the existing ThemeProvider and support dark/light mode.
**Validates: Requirements 3.4**

**Example 8: App page route accessibility**
The "/app" route should render the main application page component.
**Validates: Requirements 4.2**

**Example 9: Direct app route navigation**
Direct navigation to "/app?tab=deposit" should render the app page with the correct tab.
**Validates: Requirements 4.4**

## Error Handling

### Navigation Errors

- If navigation to "/app" fails, the system should handle the error gracefully
- Invalid tab parameters in "/app?tab=invalid" should default to the dashboard tab (existing behavior)

### Component Loading Errors

- If ClickSpark fails to load, the landing page should still render without the effect
- Use React error boundaries if needed to prevent component failures from breaking the page

### Theme System Errors

- If theme context is unavailable, default to dark theme (existing behavior)

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples and component integration:

1. **Route rendering tests**: Verify "/" renders LandingPage and "/app" renders the app
2. **Component presence tests**: Verify CTA button, hero section, and features section exist
3. **Navigation tests**: Verify CTA click triggers navigation to "/app"
4. **Props tests**: Verify ClickSpark receives correct configuration props
5. **Theme integration tests**: Verify landing page works with ThemeProvider

### Property-Based Tests

No property-based tests are required for this feature. The landing page is a static presentation layer with specific UI elements and navigation behavior, which is best validated through example-based tests.

### Integration Tests

1. **End-to-end navigation flow**: Test complete user journey from landing page to app
2. **Theme switching**: Verify theme changes apply to landing page
3. **Direct URL access**: Test accessing "/app" directly bypasses landing page

### Testing Framework

- **Framework**: Jest with React Testing Library (if not already configured)
- **Test location**: `app/__tests__/landing-page.test.tsx`
- **Coverage target**: All critical user paths and component integrations
