# TeoStudio V58.10 — Visual System Upgrade

- Added page-specific visual identities for major public, account, tenant, Seller and Admin areas.
- Refined cards, navigation, surfaces, focus states and CTA hierarchy without changing existing workflows.
- Added selective 3D depth to a capped set of prominent cards on desktop mouse/pen devices only.
- Kept mobile rendering lightweight and disabled motion when the user requests reduced motion.
- Avoided WebGL/Three.js, new external runtime libraries, remote fonts and looping animations.
- Kept API/Worker build ID at V58.9; V58.10 is the frontend visual asset version only.
- No database changes or migration required.

See `VERSION_V58.10.md` for the GitHub research references, design constraints and test notes.
