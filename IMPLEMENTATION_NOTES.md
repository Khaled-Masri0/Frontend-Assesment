# Implementation Notes

## 1. What I changed
<!-- Grouped by task: bugs fixed and features implemented (component + template). -->
Task 1: Fixed the diff logic so a quantity change is marked as changed, even when the unit price stays the same, also fixed the detail page’s permission checks so actions depend on both the request’s status and the current user’s permissions.
Task 2: Added the status filter to the change request list. Selecting ALL shows every request, while selecting a specific status shows only matching requests. Kept the existing loading, empty, and error states.

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

## 4. Testing strategy
<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

-

## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI
-

## 7. What I'd improve with more time
-
