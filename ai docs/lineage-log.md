# Lineage Log

## 2026-06-24

- Captured the original spatial chat product brief in `ai docs/product-brief.md`.
- Captured the approved React MVP implementation plan in `ai docs/implementation-plan.md`.
- Chose a Supabase-ready data boundary with mock seeded data for the first implementation.
- Chose React Three Fiber for the initial neighborhood scene, limited to chat navigation, identity, unread state, and presence.
- Shifted the visual direction toward an original bright life-sim plaza style inspired by the requested Tomodachi Life feel, without copying proprietary assets.
- Replaced the preset-only avatar setup with an editable avatar builder and added ongoing avatar editing to Home.
- Expanded the spatial layer into an original metaverse-style prototype with walking 3D characters, zoomable house interiors, and room invites that render other residents inside the house.
- Added real GLB model props from Khronos glTF Sample Assets, plus physical materials, tone mapping, reflective floors, bloom, depth of field, and improved lighting for a higher-quality 3D presentation.
- Added a generated local GLB asset library through `scripts/build-assets.mjs`, replacing most raw JSX primitive character/house/interior geometry with reusable game-style model kits loaded through `useGLTF`.
- Reworked avatar editing into a tabbed life-sim-style configuration surface with sliders for head, face, hair, eyes, mouth, body, and glasses. Slider values now drive both the 2D avatar preview and the in-world 3D GLB character.
- Reset the visual priority around the avatar builder: added a reusable `AvatarModel3D` rig, a live 3D studio preview inside the avatar editor, and expanded the generated character GLB with separate hair, brow, face, glasses, and expression parts.
- Removed blur-heavy depth of field, bloom, vignette, and reflective floor blur from the spatial scene so the avatar and houses render crisply in browser screenshots.
- Rebuilt the avatar asset proportions after browser review: larger rounded head, smaller body, flatter face features, cleaner hair cap/fringe placement, reduced material gloss, and corrected spiky hair so the builder reads closer to an original Tomodachi-like life-sim character.
