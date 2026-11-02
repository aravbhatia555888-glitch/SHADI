# UX & Accessibility Audit

Date: 2026-10-26
Scope: design tokens, shared components, tab navigation, Settings, auth flow, and a source audit of authenticated screens.
Method: source inspection, computed WCAG contrast ratios, and a rendered static web export driven in headless Chrome at 390×844 and 1440×900.

This is not a claim of full WCAG conformance. Authenticated screens were not rendered because the app requires real Supabase credentials and no account was created.

## Fixed

| ID | Severity | Location | Evidence | Change |
| --- | --- | --- | --- | --- |
| F-01 | P0 | `components/Button.tsx` | Outline buttons used `#FFD700` text and border on `#FFF5E4`: **1.30:1**. AA requires 4.5:1. 13 production usages, mostly Cancel/Reset/back actions. | Outline now uses `#800000`: **10.13:1**. |
| F-02 | P0 | `components/Button.tsx` | Loading spinner used `Colors.light.background` for every variant except outline: cream on gold (1.30:1) and cream on transparent, effectively invisible. | Spinner uses the variant's readable color; primary keeps cream, all others use primary. |
| F-03 | P0 | `app/settings.tsx` | Dark Mode, Push Notifications, and Email Notifications switches only wrote to `user_app_settings`. No code read the values; `hooks/useTheme.ts` has no consumers and `services/notifications.ts` never checks the preference. | Removed the three controls. A switch that cannot change behavior is a false promise. Re-add only with real theme and notification preference plumbing. |
| F-04 | P1 | `constants/colors.ts` | Status colors used for text failed AA on the cream background: error `#F44336` **3.41:1**, success `#4CAF50` **2.57:1**, warning `#FFC107` **1.51:1**. Warning was used for 10px priority text in `app/(tabs)/checklist.tsx:824-830`. | Tokens darkened to `#B3261E` **6.05:1**, `#2E7D32` **4.74:1**, `#7A5600` **6.17:1**. Improves 103 usages across 34 files. Dark surfaces regressed and were corrected in F-30. |
| F-05 | P1 | `components/ToastContainer.tsx`, `stores/toast-store.ts` | Toasts had no accessibility role, live region, or announcement. Every toast expired after 3s, including errors. Dismiss control was a 16px icon. | Added `role="alert"`, polite live region, iOS announcement, 7s errors / 5s warnings, and 12px hit slop (48px effective target). |
| F-06 | P1 | `app/(tabs)/_layout.tsx` | `tabBarShowLabel: false` made all five primary destinations icon-only. | Labels restored at 11px/600; tab bar height 64. |
| F-07 | P1 | `components/Icon.tsx` | The wrapper passed `fill={undefined}`. Rendered SVGs had no `fill` attribute, so browsers applied the black default: verified `computedFill: rgb(0, 0, 0)` on the Mail icon, which rendered as a solid envelope. | Default changed to `fill="none"`. Explicit fills (hearts, stars) still pass through. Verified visually after rebuild. |
| F-08 | P1 | `app/auth/login.tsx` | `socialLoading` disabled the OAuth buttons but rendered no progress feedback. Apple used an emoji. | Per-button spinner, `busy` state, disabled styling, and a Lucide Apple icon. |
| F-09 | P1 | `app/auth/login.tsx`, `signup.tsx`, `forgot-password.tsx` | Login form was full-width on desktop: the email input measured **1326px** at 1440px viewport. Signup and reset had the same pattern. | Auth content constrained to a centered 440px column. Verified: login input 326px, signup input 392px at 1440px. |
| F-10 | P1 | Auth forms, Settings modal | Input boundaries used `#EEEEEE` on cream: about **1.05:1**, below the 3:1 non-text contrast requirement. Unchecked checkbox was effectively invisible. | Added `inputBorder: #8A7A6A` (**3.83:1** on cream, **3.94:1** on field fill) and applied to auth fields, social buttons, consent checkbox, and password modal. |
| F-11 | P1 | `app/auth/signup.tsx` | "Terms of Service" and "Privacy Policy" were styled as links but were nested in the consent toggle, so tapping them toggled consent instead of opening documents. | Removed misleading link styling. Consent copy is now plain text inside the checkbox row. |
| F-12 | P1 | `app/auth/forgot-password.tsx` | Empty submission silently did nothing (`if (!email.trim()) return;`). | Inline error: "Enter the email address for your account." Clears on edit and is announced. |
| F-13 | P2 | `app/settings.tsx` | Password validation and API failures were toasts far from the fields; inputs had placeholder-only labels and no autofill hints. | Inline error next to the fields, visible labels, `autoComplete`/`textContentType`, `autoFocus`, and announced errors. |
| F-14 | P2 | `app/auth/signup.tsx` | Every validation error rendered twice: once inline and once in a summary below the form. | Removed the duplicate summary. Field errors and store errors are announced once. |
| F-15 | P2 | Settings, signup | Settings back button was 32px. Signup show-password control was about 20px tall. Consent row was about 30px tall. | Back button 40px + hit slop, password controls 48px, consent row 46px. |
| F-16 | P3 | `components/home/HomeHeader.tsx` | Accepted `onSearchPress` and `onNotificationPress` but ignored them; the real actions live in the stack header. | Removed the dead props to prevent duplicate action surfaces. |
| F-17 | P3 | `app/auth/login.tsx` | Logo used module-level `Dimensions` at 40% of viewport width (576px at 1440px), and a 12-character wordmark was placed inside a circle. | `useWindowDimensions`, 160px clamp, SB monogram, wordmark below. |

## Fixed — authenticated screens (source audit)

| ID | Severity | Location | Evidence | Change |
| --- | --- | --- | --- | --- |
| F-18 | P0 | `components/ChecklistItem.tsx`, `app/(tabs)/checklist.tsx` | Toggling a task flipped local state, discarded the `{ success, error }` result, and never rolled back. `accessibilityState.checked` read the stale prop. Failed saves looked completed until reload. | Toggle awaits the save, rolls back on failure, shows an error toast, blocks double taps, and exposes the local checked state to assistive tech. Regression test added. |
| F-19 | P0 | `app/budget.tsx` | With zero budget categories the Category section was empty and Add Expense could never enable; `addBudgetCategory` existed in the store but had no UI. New accounts could not record any expense. | Added a category-creation flow, empty-state CTA, and automatic routing to category creation when none exist. |
| F-20 | P0 | `app/(tabs)/messages.tsx` | "Block Vendor" promised only to hide messages but also deleted the server conversation (cascading messages), with no unblock path. "Report Vendor" made no request yet toasted "Report submitted". | Blocking is now reversible "Hide Conversation" with a hidden-conversation toggle and no deletion. Reporting opens a prefilled support email. Delete failures surface, and the confirm copy states permanence. |
| F-21 | P1 | `app/budget.tsx`, `components/BudgetItem.tsx` | `parseFloat("1,500")` stored ₹1; the disabled primary button looked enabled and had no `accessibilityState`; budget cards advertised a button role and did nothing. | Comma-safe numeric parsing with validation, visible disabled state, and budget cards are now non-interactive summaries. |
| F-22 | P1 | `app/bookings.tsx` | A failed load (store `error` ignored) rendered "No Bookings Yet" with no retry. Confirmed and Pending badges measured ~3.6:1 and ~3.1:1. | Error state with Retry before the empty state; badges now ~5.2:1 and ~4.9:1; cancel control is labelled and 44px tall. |
| F-23 | P1 | `app/favorites.tsx` | A failed load rendered "No Favorite Vendors Yet" with no retry; copy told users to tap a heart that vendor cards do not render. | Loading and error/retry states added; copy now says to open a vendor and use its heart; view-toggle target is 44px. |
| F-24 | P1 | `app/vendor/[id].tsx`, `app/booking/[vendorId].tsx` | Both screens rendered "Vendor not found" while vendors were still loading, and on fetch failure. Booking's dead end had no back control. | Loading spinner, retryable error, and Go Back added before concluding not-found. |
| F-25 | P1 | `app/vendor/[id].tsx`, `app/booking/[vendorId].tsx` | "Select Package" discarded the chosen package; the booking form always started with no package selected. | `packageId` is passed through and preselected on the booking form. |
| F-26 | P1 | `app/(tabs)/vendors.tsx` | Missing `maxPrice` defaulted to `Infinity`, so "₹5L+" and other bands matched vendors outside the range. | Vendor ranges are parsed from both bounds; vendors without usable prices are excluded rather than matching everything. |
| F-27 | P1 | `app/(tabs)/vendors.tsx` | Search, category, and favorites-only were absent from the active-filter count and from Reset Filters. | All active filters are counted and cleared; search/category state is now visible through the filter badge. |
| F-28 | P1 | `components/VendorCard.tsx`, `app/compare-vendors.tsx` | `VendorCard` dropped its `accessibilityLabel` and had no selected state. Rating text was gold on near-white (**1.30:1**). Compare cards did nothing when tapped; the back button was unlabelled and 32px; boolean cells were silent. | Label and `selected` state pass through; rating text is `#2C2C2C`; compare cards navigate; back is labelled and 44px; boolean cells announce "Yes"/"No". |
| F-29 | P1 | `app/(tabs)/profile.tsx` | Log Out fired immediately. The edit modal re-seeded from the store on every refresh, discarding typed input; fields had placeholder-only labels and no date validation. | Log out confirms first. The form seeds only when opened, has visible labels and autofill hints, validates `YYYY-MM-DD` inline, and preserves input. |
| F-30 | P1 | `app/(tabs)/checklist.tsx` | After F-04, hero pills and dots on the navy header used the darkened tokens: about **2.5:1**. Pill text was 10px. | Added `errorOnDark`, `warningOnDark`, and `successOnDark` tokens (**8.7:1**, **11.5:1**, **11.8:1**) and raised pill text to 12px. |
| F-31 | P2 | Checklist, budget, messages | None consumed the store `error`; failed loads looked like empty data. Checklist Reset did not apply; budget "Apply" committed nothing. | Loading/error/retry states added. Checklist Reset applies and closes. Budget's commit button is now "Done", matching live filters. |
| F-32 | P2 | `components/home/WeddingProgress.tsx` | Tasks bar used an invented denominator of 20 and filled as tasks remained; budget widths were unclamped; over-budget showed a negative "Remaining". | Uses total task count and completion, clamps all widths, and labels over-budget explicitly. |
| F-33 | P2 | `components/home/RecentActivity.tsx`, `app/(tabs)/profile.tsx` | Recent Activity vanished entirely with no tasks. Profile quick actions used `(width - 40) / 4`, overflowing four-up rows on phones and stretching to 350px tiles on desktop. | Empty state with a next step; quick actions use flexible width with a 120px cap and 64px floor. |

## Open

- 22 hardcoded hex colors remain in 7 screens: `bookings.tsx` (5), `inspiration/[articleId].tsx` (5), `profile.tsx` (4), `checklist.tsx` (3), `notifications.tsx` (2), `booking-confirmation.tsx` (2), `help.tsx` (1). Some are legitimate overlays; the rest should become tokens.
- 103 status-color usages across 34 files need per-screen review for meaning conveyed by color alone.
- Several forms outside the audited set still use `Colors.light.border` for field boundaries. Apply `inputBorder` systematically.
- Checklist and budget expose no delete affordance even though `deleteChecklistItem` and `deleteBudgetExpense` exist in the store. AI checklist import also reports only successes and has no undo.
- The profile screen renders the same five navigation items twice: inline and in the header menu.
- Recent Activity task rows navigate to the checklist list, not the selected task.
- Store `loading` is global rather than per-slice, so a retry spinner can cover unrelated operations.
- The Settings password modal is not wrapped in keyboard-avoiding or scrollable content; with the keyboard open on a short screen, the submit button can be obscured.
- No dark theme exists. The control was removed rather than left non-functional.
- Native iOS and Android rendering, gestures, and device-specific safe areas were not tested in this pass.
- Authenticated screens (home, vendors, checklist, budget, messages, profile, booking, payments) were source-audited but not rendered.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass with `--max-warnings 0`.
- `npm run test:run` — 32 suites, 334 tests pass, including the new ChecklistItem rollback regression test.
- `npm run build-web` — exit 0.
- Rendered login at 390×844: no horizontal overflow (`documentScrollWidth = 390`), no elements beyond viewport, 7 focusable controls, all with accessible names, visible default focus rings.
- Rendered signup at 390×844 and 1440×900: no horizontal overflow; 9 focusable controls including a `checkbox` role; form centered at 440px on desktop.
- Rendered reset password at 390×844: no horizontal overflow.
- Rendered login at 1440×900: no horizontal overflow; form centered, input width 326px.
- Icon fix verified in the rendered build (outline envelope and lock).
- Authenticated screens and native iOS/Android remain unverified in a rendered environment.
