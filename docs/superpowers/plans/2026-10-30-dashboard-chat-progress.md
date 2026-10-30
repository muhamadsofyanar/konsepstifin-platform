# Progress — dashboard chat 0.10.26

Task 1 complete: actual SQL tests and repeated migration passed.
Task 2 complete: API, UI, navigation and unread badge passed targeted tests.
Task 3 complete: build/typecheck passed; full suite failures reproduced on baseline and documented.
Execution used an isolated copy of the source archive, not a git checkout; no external repository mutation or deployment occurred.
Design decision: read-through cursor acknowledges messages up to the latest loaded ID only when the newest section is visible; earlier history is considered read. More recent, unfetched messages remain unread.
Final independent review: fixed unread badge absence and scrolled-history receipt; regression tests fail on old behavior and pass on corrected implementation. No remaining important access/transaction finding reported.
Deferred minor: two hook dependency lint warnings; functions read current refs and Conversation is keyed by memberId.
