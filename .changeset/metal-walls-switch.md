---
"jscodeshift": minor
---

Add iterator implementation to Collections

ES6 iterators support the new for..of syntax. Since a Collection wraps an Array, we can lean on ECMAScript's new iterator delegation.
