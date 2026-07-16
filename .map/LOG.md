# MAP-22 log

- Task 01 (connect background receiver): codex, 0 strikes, PASS. Commit 6e755c9.
- Task 02 (popup Sign in): codex, 0 strikes, PASS. Commit c327e1a.
- Task 04 (read selection): codex + 1 orchestrator fix (enterReadingMode dropped collectBlocks -> restored). PASS. Commit c4318f7.
- Task 03 (web connect action): BLOCKED on a design decision - keys are hashed, so the full key only exists at registration/rotation, not on /account.
