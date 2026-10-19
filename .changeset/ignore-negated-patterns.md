---
"jscodeshift": patch
---

Fix a negated pattern such as `!.jenkins/` in an `--ignore-config` file (or `--ignore-pattern`, `--gitignore`) making jscodeshift ignore every file

Patterns starting with `!` were handed to picomatch as is, and picomatch reads a leading `!` as "anything except", so a single negated line matched almost every path. A leading `!` now re-includes paths ignored by an earlier pattern, and the last pattern that matches a path decides whether it is ignored, as in `.gitignore`. Use `\!` for a pattern that starts with a literal `!`.
