# tests

Developer tools only. The page never loads anything in this folder.

- `fixtures/` holds five fictional press releases. The companies, people and figures are made up. Never add a real press release here.
- `fixtures/office-move.txt` locks in the passive voice exclusion list. "We are delighted to announce…" and "The company is headquartered in Leeds." must not be flagged; "The plan was approved last week." and "The device is designed to cut energy use." must be.
- `fixtures/grocer-depot.txt` locks in the empty-quote test. Four quotes must not be flagged: one gives a reason ("because"), one a number ("140"), one a next step ("will launch") and one a spelled-out number ("eight weeks"). "We're thrilled to bring this innovative solution to our valued customers." must be flagged.
- `baseline.js` scores each fixture with the page's own scoring code, run in Node. It records the grade, score, headline metric, every per-check score, every finding, the top five fixes with their rewrites, and the exact copy, export and share text.
- `baseline.json` is the stored result.

Check that a change has not moved any score:

    node tests/baseline.js

Record a new baseline only after a deliberate scoring change:

    node tests/baseline.js --update

Needs Node 18 or later. No packages to install.
