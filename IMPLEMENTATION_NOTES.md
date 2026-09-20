# Implementation Notes

## 1. What I changed
<!-- Grouped by task: bugs fixed and features implemented (component + template). -->
Task 1: Fixed the diff logic so a quantity change is marked as changed, even when the unit price stays the same, also fixed the detail page’s permission checks so actions depend on both the request’s status and the current user’s permissions.

Task 2: Added the status filter to the change request list. Selecting ALL shows every request, while selecting a specific status shows only matching requests. Kept the existing loading, empty, and error states.

Task 3: Sorted the timeline from oldest to newest, made Approve and Reject depend on the request’s status and the user’s permissions, added description checks and showed descriptions in the Before and After columns, connected both buttons to the API, disabled them while waiting, showed errors and checked the request’s status after failed responses, required a rejection reason that is not empty or only spaces, made the details reload when another request is selected

Task 4: Checked that viewers can see requests but cannot approve or reject them, checked loading messages, errors, and Retry in both screens, added a message when no requests match the selected status

Task 5: Added tests for successful approval and rejection, rejection reason validation, permissions and request statuses, slow responses, repeated action attempts, errors and recovery, status filtering, timeline order, and description-only, price-only, and unchanged items.

-

## 2. Component & state model
<!-- The screens, the view-state each component exposes, and how data flows from the mock API into the
template. -->

The application has two screens: a list of change requests and a detail view for a selected request. 
The list displays each request’s title, status, and delta, and lets the user filter by status.
The detail view displays the proposed item changes, totals, history, and buttons for approving or rejecting a request. 
Both components track whether data is loading, loaded, or failed, and the list also handles an empty result.
Data comes from the provided mock API, and the current user’s permissions should determine which actions they can take.

-

## 3. Invariants I keep
<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
|---|---|

| Only users with approval permission can act on pending requests | `canApprove` and `canReject`, checked in the template and both action methods |
| Another action cannot start while one is running | `submitting` disables both buttons and is checked in both action methods |
| Rejection requires a reason that is not empty or only spaces | The `rejectControl` validator and the validation check in `reject()` |
| The timeline appears oldest first | The `timeline` getter sorts a copy of the audit entries by date |
| The list shows only matching requests unless ALL is selected | `visibleRows` filters by status, and the template renders those rows |

## 4. Testing strategy
<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->
I used pure function tests for the diff logic, covering added, removed, changed, and unchanged items, including quantity-only, price-only, and description-only changes

I used component and DOM tests for filtering, timeline order, button states, rejection validation, and approval/rejection results, so the tests check what users see and interact with, I also checked that blocked or repeated action attempts do not call the API

For slow and failed responses, I used the mock API’s latencyMs and failNext with Jest’s controlled timers to avoid real waits, I also tested recovery when the follow-up status check fails

Given the time budget, I checked initial loading, load errors, and Retry manually in both screens rather than adding separate automated tests for them, I focused on meaningful behavior instead of a coverage percentage.
-

## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->
Since LineItem includes a description, I assumed it should be shown alongside quantity and unit price in the preview, I also treated a description change as a changed item, even when the quantity and price stay the same, so users can see changes that do not affect the total cost.

I used the same approval policies for Approve and Reject, because the provided documentation does not define a separate rejection policy

I treated spaces-only text as an empty rejection reason, so a user must enter actual text before rejecting

I kept Approve visible but disabled for viewers and hid the Reject controls, matching the existing template and the provided test that expects a disabled Approve button

I used the totals and delta returned by the mock API, treating them as the source of truth rather than recalculating them in the component
-

## 6. Where I used AI
I used AI to understand how to update the HTML preview table to show item descriptions alongside quantity and unit price, and to help apply that change.I gave AI my ideas for the proposed tests and used it to help implement them and investigate test failures, I also used AI to understand Angular concepts and help with the preview display, permission checks, validation, and selection loading, I worked through the changes step by step and manually checked the UI, including slow and failed responses.


-

## 7. What I'd improve with more time
Refresh the left-hand list after approval or rejection so both screens show the same status
Prevent older responses from overwriting the selected request when switching while an API call is pending
Add automated tests for loading, load failures, Retry, and changing the selected request
Improve the page’s layout and spacing, including clearer timeline entries and more readable dates.
