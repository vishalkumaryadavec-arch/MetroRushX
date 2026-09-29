# Metro Rush X — Advanced Original Endless Runner

Metro Rush X is an original 3D endless-runner prototype inspired by the **genre** of mobile metro runners. It does not copy Subway Surfers proprietary code, characters, logos, maps, or assets.

## Included now

- Three-lane endless running
- Mobile swipe controls + keyboard controls
- Jump, slide, lane switching
- Double jump and super-jump board abilities
- Train-top grind state / bonus scoring
- Metro, gold and freight trains
- High and low barriers
- Police chase encounters
- Coins, bank, gems and best score
- Combo multiplier and near-miss bonuses
- Magnet, shield, boost, score multiplier, jetpack and sneakers power-ups
- 10 original playable character archetypes:
  - Metro Runner
  - Street Girl
  - Robo-X
  - Night Ninja
  - Street Skater
  - Turbo Racer
  - Neon DJ
  - Urban Explorer
  - Cyber Scout
  - Metro Biker
- 8 original hoverboard types with distinct gameplay abilities
- Character/board shop and persistent ownership
- Daily reward
- Missions
- World Tour selection screen
- Settings and graphics quality control
- Sound effects and optional procedural music
- Particle effects
- Procedural city scenery
- Responsive mobile UI
- Local save data using localStorage
- GitHub Pages compatible static build

## Run locally

Because Three.js is loaded from a CDN, you can use any static web server. For example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder.
3. Open **Settings → Pages**.
4. Select the branch containing `index.html` and the root folder.
5. Save and wait for GitHub Pages to publish.

## Important production note

This repository uses procedural Three.js meshes rather than large commercial 3D asset packs, so it stays small and easy to publish. For a full commercial-quality game, replace the procedural characters/trains with your own licensed GLB/GLTF models and animation clips, add original audio, optimize textures, and use Git LFS or Releases for very large binary assets.
