# tests

Developer tools only. The page never loads anything in this folder.

- `fixtures/` holds three fictional press releases. The companies, people and figures are made up. Never add a real press release here.
- `baseline.js` scores each fixture with the page's own scoring code, run in Node. It records the grade, score, headline metric, every per-check score, every finding, the top five fixes with their rewrites, and the exact copy, export and share text.
- `baseline.json` is the stored result.

Check that a change has not moved any score:

    node tests/baseline.js

Record a new baseline only after a deliberate scoring change:

    node tests/baseline.js --update

Needs Node 18 or later. No packages to install.
