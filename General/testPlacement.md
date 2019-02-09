# Test Placement

## Put unit tests next to implementation

We recommend placing unit tests directly next to implementation files.

---
* 📁src
  * 📁components
    * 📁MyComponent
      * 📁\_\_snapshots__
        * MyComponent.test.js.snap
      * index.js
      * index.test.js
  * 📁utilities
    * 📁MyUtility
      * index.js
      * index.test.js
    * MyOtherUtility.js
    * MyOtherUtility.test.js
---

### Pros
1. Easily see which files have unit tests when looking at filetree, while working and during code review.
2. While coding, least effort to find test relative to implementation.

### Cons
1. May need to create more sub-folders.
