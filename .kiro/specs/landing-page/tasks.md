# Implementation Plan: Landing Page

## Overview

This implementation plan outlines the steps to add a landing page to the PayMeJor application. The approach involves restructuring routes so the landing page is at "/" and the main app moves to "/app", installing the ClickSpark visual effect library, and creating a new landing page component with hero and features sections.

## Tasks

- [x] 1. Install ClickSpark dependency
  - Run `pnpm add @react-bits/clickspark-ts-css` to add the visual effects library
  - _Requirements: 2.1, 2.3_

- [-] 2. Restructure application routes
  - [x] 2.1 Create new app directory structure
    - Create `app/app/` directory for the main application
    - Move `app/page.tsx` to `app/app/page.tsx`
    - Update any relative imports in the moved file if needed
    - _Requirements: 1.1, 4.2_
  
  - [ ]* 2.2 Write test for app route accessibility
    - Verify "/app" route renders the main application component
    - _Requirements: 4.2, 4.4_

- [x] 3. Create landing page component
  - [x] 3.1 Create new landing page at root
    - Create new `app/page.tsx` with landing page component
    - Implement hero section with headline and description
    - Implement features section with 3-4 feature cards
    - Add CTA button that navigates to "/app"
    - Integrate ClickSpark component with specified props (white color, 13px size, 17px radius, 6 sparks, 400ms duration, ease-out easing)
    - Use existing UI components (Button, Card) from shadcn/ui
    - Ensure responsive layout with Tailwind CSS
    - _Requirements: 1.1, 1.2, 2.1, 2.3, 3.1, 3.2, 3.4_
  
  - [ ]* 3.2 Write tests for landing page component
    - Test root    - Test root route renders landing page
 route renders landing page
    - Test CTA button presence and navigation
    - Test ClickSpark integration with correct props
    - Test hero and features sections render
    - Test theme system integration
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 3.1, 3.2, 3.4_

- [x] 4. Update navigation and links
  - [x] 4.1 Update any internal links or redirects
    - Check for any hardcoded links to "/" that should now point to "/app"
    - Verify navbar and other navigation components work correctly
    - Test direct navigation to "/app?tab=deposit" and other tab routes
    - _Requirements: 4.1, 4.4_
  
  - [ ]* 4.2 Write integration tests for navigation flow
    - Test complete user journey from landing page to app
    - Test direct URL access to app routes
    - _Requirements: 1.3, 4.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The ClickSpark component is a third-party library that handles its own animation logic
- Existing application functionality should remain unchanged after moving to "/app"
- The landing page uses the existing theme system and design tokens
- No new data models or API integrations are required
