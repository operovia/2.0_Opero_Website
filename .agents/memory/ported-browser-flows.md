---
name: Ported browser flows
description: Migration checks for server-action flows moved behind separate API paths
---

When moving a browser flow from same-path server actions to separate API routes, verify that cookies set by the API will be sent to both the submission and later read endpoints. Also verify uploaded files use storage shared by production replicas and survive a server restart.

**Why:** A migration can compile and render correctly while a narrow cookie path silently disables repeat-response protection, or instance-local uploads disappear after a restart.

**How to apply:** For future route migrations in this project, exercise submit → reload → repeat with a real cookie jar, and upload → fetch → restart → fetch when media paths or storage drivers change.