# Meascat v1 — Design Spec

*3 October 2026 · Status: awaiting review · Owner: Ujjwal (director) · Builder: Claude · Research: `docs/research/flow-research.pdf`*

## 1. What we're making

**Meascat** is a wordless, painterly 3D web game about a small cat who is afraid of water. When a flood swallows the world, it learns to trust a crew of very different animals.

The game is **inspired by the spirit of the film *Flow* (2024)**. It is **entirely original**: our own world, characters, story, art, music and sound, with nothing taken from the film (§12).

**v1 is a vertical slice**, 20–30 minutes long. It contains all three layers of the game:

- **Cozy Ark:** the boat home base.
- **Drift:** sailing between places.
- **Rising Water:** puzzle-escape chapters.

v1 has 3 chapters, 2 drifts, 4 companions, about 9 choices and 3 endings.

**Purpose:** fun and a portfolio piece. It is free in the browser, on phones and computers, hosted on Vercel with a public GitHub repo. Ujjwal directs; Claude builds.

## 2. Decisions

| Topic | Decision |
|---|---|
| Genre | Wordless story adventure with small choices, a route fork and 3 endings |
| Structure | The Ark hub, then Drift, then a Rising Water chapter, repeated 3 times, then an ending |
| Hero | **Meascat**: a small ginger cat with a white chest and one white sock; afraid of water at first |
| Companions | Tortoise (on the Ark from the start), Otter (chapter 1), Mountain goat (chapter 2), Heron (chapter 3) |
| Art style | **Painterly naturalism**: soft gradients, warm rim light, mist, reflective water. Chosen from mockups (A low-poly / **B painterly** / C toon) |
| Tech | **three.js + TypeScript + Vite**, Vitest, Tone.js, Vercel. This is approach A; Babylon.js and Godot were rejected for size and for the workflow |
| Length | 20–30 min to an ending |
| Devices | Phones, tablets and computers, in Chrome-based browsers and Safari (Firefox out of scope, as for Afterlife) |

## 3. Screens and flow

- **Title:** Continue (when a save exists), New journey, Settings (sound, volume, Reduce motion, camera sensitivity), Credits.
- **Opening (about 30 s):** a wordless intro. Meascat's empty lighthouse-keeper's cottage, the storm, the flood, and the leap onto the tortoise's drifting boat.
- **Game:** the Ark, Drifts and Chapters flow into one another without loading screens. The next chapter streams in during the drift.
- **Ending:** one of 3 (§6), then the **Journey screen**. It shows your choices as small pictures (no scores), the companions found and the treasures collected, with *"Other paths remain"*.
- **Saving:** automatic after each chapter and drift, in browser storage (key `meascat.save.v1`). The save survives a corrupt or missing store, as in Afterlife.

## 4. Camera, controls and HUD

**Camera:** a third-person follow camera with a soft handheld sway.
- It moves closer in tight spaces and pulls back on the boat.
- Collision keeps it out of walls.
- Reduce motion turns the sway off.

| Action | Computer | Touch |
|---|---|---|
| Move | WASD / arrows | Left virtual joystick |
| Jump / climb | Space | Jump button |
| Interact (pick up, push, call, sail) | E | Contextual button showing an icon |
| Companion ability | 1–4 or click the portrait | Tap the portrait |
| Look | Mouse drag | Right-thumb drag |
| Steer the boat | A/D, W to sail | Joystick left/right, tap the sail |

**The HUD shows only:**
- companion portraits;
- a soft water-level gauge during chapters;
- the contextual action icon.

There is **no in-game text**. Guidance comes from icons and from companions pointing or looking.

## 5. The three layers

### 5.1 Cozy Ark (2–3 min per visit)

- **The boat grows.** Each chapter adds one piece: a deck, a shelter, a lantern.
- **The tortoise lives here.** Each rescued companion gets a resting spot.
- **Optional activities:**
  - **Feed and share fish.** This counts toward kindness.
  - **Place treasures.**
  - **Rest by the tortoise.** This plays a short memory scene per companion.
- **The tiller starts the next Drift.**

### 5.2 Drift (2–3 min each, 2 in v1)

- **Steering:** steer toward a horizon glow.
- **Hazards:** drifting logs and currents. A bump rocks the boat but never sinks it.
- **One wonder moment per drift:** a giant gentle sea creature, a sunken street of lamp posts, a flock overhead.
- **One kindness choice per drift:** a stranded animal you can steer to and help.
- **Route fork in Drift 2:** the **drowned forest** or the **old lighthouse**. Each has its own wonder moment and a small scene; both lead to chapter 3.

### 5.3 Rising Water chapters (5–7 min each, 3 in v1)

**Goal:** reach the chapter's beacon on high ground before the water reaches you. The trapped companion is freed on the way and joins the crew.

**Water** rises in **stages**:

- A new stage begins when a puzzle step is solved. If the player lingers longer than 90 s in one stage, the water slowly creeps up.
- **Falling in:** Meascat paddles back to the last ledge checkpoint, with a scared splash. There are no lives and no game over.

| Chapter | New friend | Ability | Puzzles |
|---|---|---|---|
| 1 · Flooded village | **Otter** | Swims and dives: ferries Meascat, fetches items from underwater | Crossing gaps; diving for a key |
| 2 · Quarry cliffs | **Mountain goat** | Climbs walls; butts open doors and crates | Otter fetches, goat breaks through; ledge routes |
| 3 · Bell tower | **Heron** | Scouts the safe path; lifts light objects onto ledges | All three abilities, plus the tortoise as a floating stepping-stone; the final climb |

**Courage arc:** in chapter 1 Meascat cannot swim. In chapter 3, Meascat **chooses to jump into the water** to save a friend. That one moment is the cat's first swim, and swimming stays available afterwards.

**Climax:** the bell tower. The water rises one last time. Ringing the bell calls the waters back, and the ending follows.

## 6. Story, choices and endings

- **Story:** told without words.
  - **Rescues:** each companion's rescue is a small mimed scene (the otter in a net, the goat on a crumbling ledge, the heron with a tangled wing).
  - **The human world:** traces of it (carved animal toys, children's drawings) hint at the past.
  - **The flood:** never explained.

- **Choices (about 9 in v1).** None is ever labelled good or bad, and the game never pauses to ask. They happen through play.

| # | Where | Choice | Affects |
|---|---|---|---|
| 1 | Chapter 1 | Free a trapped bird, or leave it | kindness |
| 2 | Ark | Share fish with the tortoise, or keep it | kindness |
| 3 | Drift 1 | Help a stranded animal, or stay on course | kindness |
| 4 | Chapter 2 | Let the goat lead at a cliff, or climb alone | trust |
| 5 | Chapter 2 | Stop to carry a lost duckling, or hurry on | kindness |
| 6 | Drift 2 | **Forest or lighthouse** (route fork) | path |
| 7 | Ark | Share the last fish when food is low | kindness |
| 8 | Chapter 3 | Follow the heron's scouted path, or your own | trust |
| 9 | Chapter 3 | Jump into the water to save a friend, or wait for the otter | trust and courage |

- **Ending rule (pure, unit-tested).** Kindness `k` counts from 0 to 5 (choices 1, 2, 3, 5 and 7) and trust `t` from 0 to 3 (choices 4, 8 and 9).

| Ending | Condition | What happens |
|---|---|---|
| **Together** | k ≥ 4 and t ≥ 2 | Everyone on the Ark at dawn, with the animals you helped swimming alongside. The bell calls the water back to a green valley |
| **Alone at sea** | k ≤ 1 and t ≤ 1 | The friends drift off to their own homes. Meascat sails on alone toward a new light: bittersweet, never punishing |
| **Home** | otherwise | The water recedes. The friends rest on the hill, and Meascat looks out to sea, with a hint of more to come |

## 7. Art direction

All art is made in code or comes from CC0 models restyled by us; nothing comes from the film.

**Sky and light:**
- a gradient sky;
- a warm key light, with rim light on fur;
- exponential mist that hides the far distance (this is also a performance aid).

**Water:** a custom shader with:
- vertex waves;
- foam at intersections, using the depth buffer;
- sky-tinted reflection;
- a soft glow.

The rising water is the same plane, moved up.

**Materials:**
- a painted colour ramp ("brush" steps) with slight grain;
- no glossy plastic look.

**Characters:**
- **Source:** CC0 animated models (for example Quaternius animals) where they exist, restyled with our shader and palette.
- **Fallback:** if no CC0 model exists for an animal, we build a simple stylised model in code with basic animations (idle, walk, act).
- **Meascat's look:** ginger, with a white chest and one white sock.

**Places:** built from code-made shapes plus CC0 props (for example Kenney), using one palette per chapter. The colour story runs from a grey-blue storm (chapter 1), to warm afternoon (chapter 2), to golden dusk and dawn (chapter 3 and the endings).

## 8. Sound

- **Music:** generated live with Tone.js, using soft strings and plucked tones. It is calm on the Ark and in Drifts, and adds a pulse as the water rises. Mute and volume work as in Afterlife.
- **Effects:** CC0 animal sounds and recorded or CC0 water, wood and wind sounds, with deliberate silences.

## 9. Architecture

The code is split into these parts:

- `src/core/`: **pure logic, with no three.js.**
  - the movement rules (kinematic controller maths, jump arcs, ledge grabs on simple colliders);
  - the water-stage machine;
  - the puzzle state for each chapter;
  - the choices, kindness and trust tally, and `endingFor`;
  - save and load.

  All of it is unit-tested.
- `src/content/`: **data.** Chapter definitions (colliders, checkpoints, puzzle steps, stage heights), drift scripts, choices and companion abilities.
- `src/render/`: **three.js.**
  - the scene graph, painterly materials, water shader, sky and mist;
  - the follow camera;
  - characters (model loading, animation mixing), set pieces, and the quality levels.
- `src/audio/`: Tone.js music and effects.
- `src/ui/`: the DOM HUD, title, settings, Journey screen and touch controls.
- `src/app/`: the flow between layers, chapter streaming, and saving.

**Physics:** our own light kinematic controller. It uses capsule-against-box and heightfield collisions, a buoyancy bob for the boat, and simple carry and attach for companions. No physics engine is used in v1; a small library can be added later if a chapter needs it.

## 10. Performance

- **Quality levels:** low, medium and high, chosen automatically from device and frame time. Phones get less mist, less water detail and no real-time shadows.
- **Pixel ratio:** capped at 2.
- **Download size:** the initial download stays at or under **3 MB gzip**. Each chapter streams as an additional bundle of at most 2 MB.
- **Frame rate:** **60 fps on desktop and at least 45 fps on a mid-range phone** (measured as in Afterlife: CPU throttled 4× in a phone viewport).

## 11. Testing and quality

- **TDD:** core logic is written test-first.
- **Solvability bots:** for each chapter, a scripted bot completes it with every companion combination and route.
- **Ending reachability:** a test enumerates choice combinations and asserts that all 3 endings are reachable.
- **Browser QA:** the Afterlife `tools/qa/` suite, adapted. It covers the device matrix in Chromium and WebKit, performance, loading, monkey tests, and a final pre-launch PDF report.
- **Review:** each milestone has a fresh independent review before merging.

## 12. Legal and IP rules

- **Never use** any of these from the film:
  - frames or stills;
  - character designs;
  - music or sound;
  - the title or logo;
  - recreated scenes;
  - the film's exact cast as a set (cat, Labrador, capybara, lemur, secretarybird).
- **Our cast and story are our own.** Meascat is a ginger cat, and the crew is a tortoise, otter, goat and heron.
- **Credit line** (title screen, credits and README): *"Inspired by the spirit of* Flow *(2024) by Gints Zilbalodis. Not affiliated with or endorsed by its makers."*
- **Third-party assets:** only CC0 or our own. Licence files are kept in `assets/LICENSES/`.

## 13. Build milestones

Each milestone gets its own implementation plan and ends with something playable.

| Milestone | Delivers |
|---|---|
| **M1 · Foundations** | Project setup; painterly sky, mist and water; Meascat moving and jumping on a test island; the follow camera; touch controls; quality levels; the test and QA harness |
| **M2 · Chapter 1** | Rising Water stages, checkpoints, the otter and its abilities, the flooded village, the solvability bot |
| **M3 · Ark + Drift** | The Ark hub, steering, Drift 1 with a wonder moment, the kindness choice, saving, the opening intro |
| **M4 · Chapters 2–3 + endings** | The goat and heron, the tortoise stepping-stone, the route fork, all choices, the courage moment, the bell climax, 3 endings, the Journey screen |
| **M5 · Polish + launch** | Music and sound, art pass, performance, the full QA campaign and PDF report, Vercel launch |

## 14. Out of scope for v1

- Chapters beyond 3 and more companions;
- multiplayer;
- accounts and cloud saves;
- languages (the game is wordless);
- controller and gamepad support (possible later);
- Firefox.

## 15. Open questions

None. The design was approved section by section in chat on 3 Oct 2026.
