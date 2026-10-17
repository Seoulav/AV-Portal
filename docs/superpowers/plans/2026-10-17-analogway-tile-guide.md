# W-20261017-006 implementation plan

1. Add a pure tile adapter for 4K60 columns, rows, and mixing layers. Convert the grid into adjacent groups of at most four outputs, then call the existing Analog Way evaluator without changing its rules. Keep the resource estimate distinct from final seamless-wall confirmation.
2. Test grid conversion, invalid input, the nine reference configurations, and the specified 4/6/16-panel verdicts against the current evaluator and product JSON parity checks.
3. Add the calculated quick-reference table to the Analog Way hub and an immediately updating tile input mode to the shared design guide, with presets and a visible grid.
4. Check 1280/760/390px rendering and interactions, full tests, Pages verification, and derived artifacts. Commit and open a PR for Work's independent review; do not merge before that review.
