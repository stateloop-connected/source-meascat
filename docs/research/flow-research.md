---
title: "Meascat — Research: the film Flow (2024) and how to build an original web game inspired by it"
---

# Meascat — Research Brief

**Topic:** *Flow* (2024) and how to build an original web game inspired by it.

*3 October 2026 · Owner: Ujjwal (director) · Prepared by: Claude*

## 1. Summary

- **What *Flow* is.** *Flow* (Latvian title *Straume*) is an 85-minute animated feature by Gints Zilbalodis.
  - **The story:** a dark grey cat survives a world-swallowing flood aboard a drifting sailboat. It learns to trust a group of very different animals: a Labrador, a capybara, a ring-tailed lemur and a secretarybird.
  - **How it tells the story:** there are no words, no humans and no names. Everything is carried by movement, sound, water and light.
  - **How it was made:** a tiny team built it in the free software Blender for about €3.5 million.
  - **What it won:** the **Oscar for Best Animated Feature** (the first independent film to win it), the **Golden Globe** and more than 60 other awards.
- **What this means for Meascat.** These qualities translate well into a game:
  - wordless storytelling;
  - a small cast with distinct personalities;
  - rising water as constant gentle pressure;
  - cooperation between animals who would normally avoid each other;
  - quiet, awe-filled set pieces.
- **The one hard rule.** We cannot use the film's graphics, characters, music, title or footage; they are copyrighted. Meascat must be an **original game "inspired by" *Flow***, as Afterlife was inspired by *Cloud Gardens*. §9 sets out the rules.
- **Recommendation for building it.** A stylised low-poly **3D game in the browser**, built with three.js, comes closest to the film's look while still running smoothly on phones. Free (CC0) animated animal models give us a head start. §10 compares the options.

## 2. The film at a glance

| | |
|---|---|
| Title | *Flow* (Latvian: *Straume*) |
| Director | Gints Zilbalodis (previously *Away*, 2019, also wordless and made largely alone) |
| Production | Dream Well Studio (Latvia), Sacrebleu Productions (France), Take Five (Belgium) |
| US distributor | Janus Films / Sideshow |
| Premiere | Cannes, *Un Certain Regard*, 22 May 2024 |
| Runtime | 85 minutes |
| Budget / box office | About €3.5 M / over US$36 M worldwide |
| Major awards | Academy Award (Best Animated Feature); Oscar nomination (International Feature); Golden Globe; Annie (Independent); European Film Award; César |
| Made with | Blender, rendered with EEVEE (the fast real-time renderer); no render farm, frames took 0.5–10 s each on the director's PC |
| Team | About 15–20 people in the core Latvian studio over about 5.5 years; partners joined for animation and sound |
| Music | Gints Zilbalodis and Rihards Zaļupe; strings recorded with Sinfonietta Rīga plus percussion; album on Milan Records |

## 3. The story in beats

This is a paraphrase, for analysis only. Meascat will **not** retell it.

1. **Before the flood:** a lone cat lives in an abandoned, human-less house full of carved cat sculptures. It escapes a pack of dogs.
2. **The flood:** a stampede of deer is an omen. Water surges in; the cat climbs ever higher, up a giant cat statue, until even that disappears.
3. **The boat:** the cat leaps onto a drifting sailboat, which already carries a calm capybara. Water becomes the cat's constant fear.
4. **Gathering the crew:**
   - a Labrador who drifts between its pack and the boat;
   - a lemur who hoards shiny things, especially a mirror;
   - a secretarybird, cast out of its flock for protecting the cat, which takes the helm.
5. **The drowned city:** the boat drifts through half-sunken ruins and huge stone pillars. A giant, strange whale appears more than once, a figure of wonder.
6. **The storm and the light:** among the pillars the world seems to lose gravity. The secretarybird rises into a beam of light and is gone.
7. **The waters fall:** the flood drains away and the boat is stranded in a tree. The friends help each other. The whale is left beached.
8. **Ending:** the cat comforts the dying whale, then stands with its companions. Their reflections share one pool of water. The cat has changed from a solitary, frightened animal into a member of a found family.

## 4. The characters: what each one *does* for the story

| Character | Role in the story | Game design lesson |
|---|---|---|
| The cat (lead) | Fear of water to courage; loner to belonging | The player's arc should be **felt through play**: early on, water is dangerous; later, the player chooses to dive in to help someone |
| Labrador | Loyal and playful, torn between its pack and its new friends | A companion who **comes and goes**, so its return feels earned |
| Capybara | Calm, accepting, unbothered | A **safe anchor**, shown as a resting place on the boat |
| Ring-tailed lemur | Collector, vain, curious (the mirror) | **Collectibles** with personality: what you find becomes the lemur's treasure |
| Secretarybird | Leader, protector, sacrifice | A **mentor** who steers, then leaves: the emotional peak |
| Whale | Mystery, scale, awe | A **set-piece creature** that appears at key moments and never needs explaining |

## 5. Visual language

- **Naturalism over realism:**
  - painterly, softly lit 3D;
  - stylised fur and feathers;
  - very expressive animal animation (no motion capture).
- **Water is a character.** It is calm, then terrifying, then glassy and reflective. Custom water and fluid simulation carried much of the film.
- **Camera:**
  - long, flowing takes and a "handheld" virtual camera, layered with Animation Layers;
  - the viewer moves *with* the cat, never cutting away;
  - this carries straight over to a third-person game camera.
- **Places without people:** abandoned houses, carved cat statues, sunken cities and stone pillars. Human absence is a quiet mystery.
- **Constraint as style.** Zilbalodis deliberately designed for what was "easy to animate": four main characters and few locations. We should design the same way, and it suits web performance too.

## 6. Sound and music

- **Real animal sounds**, with one famous exception: the capybara's grunts are a **baby camel**, because real capybara squeaks didn't fit its personality.
- **Score:** soaring strings and plucky percussion. It's hand-made, not synthetic-sounding, with long stretches of silence and water.
- **For Meascat:**
  - make sound a first-class storyteller: creaking wood, lapping water, purrs, distant whale song;
  - make the music adaptive, as in Afterlife: calm on the boat, tense when water rises.

## 7. Themes

- **Cooperation across differences:** survival needs trust between species that would normally avoid each other.
- **Climate catastrophe and change:** a flooded, post-human world, never lectured, only shown.
- **Facing fear.** For the cat, that fear is water.
- **Loss, transcendence and acceptance:** the secretarybird, the whale.
- **Found family:** the shared reflection.

## 8. Comparable games

These show how *Flow*'s qualities have worked in games.

| Game | What to learn |
|---|---|
| **Stray** (2022) | Playing a cat in a world without humans; environmental, near-wordless storytelling; cat verbs (jump, meow, knock things over) are pure joy |
| **Journey** (2012) | Wordless emotion through movement, light and music; a short arc (about 2 h) with a transcendent climax |
| **Abzû** (2016) | Water as wonder; giant creatures as set pieces |
| **Little Kitty, Big City** (2024) | Cosy cat comedy; small goals; collecting things |
| **Gris** (2018) | Colour and music as emotion; gentle platforming |
| **Limbo / Inside** | Wordless puzzle storytelling; rising danger as pacing |

**Patterns to borrow:**
- **Verbs over words:** the story is told through what the player can do.
- **Companions with simple, readable needs.**
- **Short, complete arcs.**
- **One "awe moment" per chapter.**

## 9. Legal and IP guardrails (non-negotiable)

**What we must NOT use** (all © the producers):
- any frames, stills, posters or screenshots;
- character models or the cat's exact look;
- the film's music or sound;
- the title "Flow" or its logo;
- the film's specific scenes recreated shot for shot;
- the film's exact cast as a set: the cat, Labrador, capybara, lemur and secretarybird together.

Fan games sit in a legal grey area, and rights-holders can and do issue takedowns. A takedown would also harm Meascat as a portfolio piece.

**What we CAN do** (as with Afterlife and *Cloud Gardens*):
- an **original world, story, characters and art** that share the *spirit*: wordless, animals, water, cooperation, awe;
- species and ideas themselves aren't owned: a cat hero, a flood, a boat. Our cast and designs must still be our own;
- **original assets only:** code-drawn or CC0 models and textures, our own generated music, and recorded or CC0 sound effects;
- a credit line naming the inspiration, such as *"Inspired by the spirit of* Flow *(2024) by Gints Zilbalodis. Not affiliated."*

The game's name, **Meascat**, is already original.

## 10. Building it for the web

| Approach | Look | Pros | Cons |
|---|---|---|---|
| **A. 3D low-poly, three.js** *(recommended)* | Closest to the film: a third-person cat, real 3D water, a moving camera | Matches the "flowing camera" feel; CC0 animated animals exist (e.g. Quaternius packs with cat, dog and eagle, CC0, GLB format); a stylised water shader is well documented for the web | Bigger build; 3D camera and controls are harder; needs care for phone performance (quality levels) |
| B. 2.5D isometric (Phaser, as in Afterlife) | A diorama, like a tilted board | Reuses Afterlife know-how; very light | Loses the immersive, flowing camera that defines *Flow* |
| C. 2D side-view, painterly | Like *Gris* or *Limbo* | Easiest to make beautiful; great on phones | Less "being there"; the water is flatter |

**Technical notes for approach A:**
- **Water:** a stylised toon-water shader (vertex waves plus foam lines at objects, using the depth buffer). Rising water is just raising the water plane, which is cheap and dramatic.
- **Characters:** the cat and dog come from CC0 animated packs. The other companions use CC0 bases where they exist, or simple stylised low-poly models made in code. Our cast will differ from the film's anyway.
- **Performance on phones:**
  - low / medium / high quality profiles;
  - cap the pixel ratio at 2 (as Afterlife does);
  - instanced foliage and ruins;
  - a small draw distance with fog. Fog also suits the misty, flooded mood.
- **Controls:** keyboard and mouse on desktop; a virtual joystick plus tap-to-act on phones. Short, chapter-based levels keep load times small.
- **Audio:** Tone.js for an adaptive score (we know it from Afterlife); CC0 or recorded animal and water sounds.

## 11. Possible game directions (to choose from next)

1. **Drift (adventure).** Steer a small boat through a flooding world, chapter by chapter. Rescue animal companions, each with an ability that opens the way (the climber reaches ledges, the swimmer dives, the flyer scouts). Wordless and story-driven, with one awe moment per chapter.
2. **Rising Water (puzzle escape).** Short levels where the water rises; the cat and its companions must cooperate to reach high ground. Fear of water turns into skill: later levels make you swim.
3. **Cozy Ark (calm management).** Keep a growing boat-home afloat and the animals happy as the seasons change, closer to Afterlife's calm tone.

Direction 1 is closest to *Flow*'s heart. Direction 2 fits the web best, because short levels suit phones.

## 12. Open questions for Ujjwal

- **Purpose:** fun and portfolio again, or something more (to sell, or for a game jam)?
- **Story depth:** a strict "story with choices" (branching endings), or a single wordless arc like the film?
- **Length:** about 20–30 minutes (3–5 chapters) for a first release?
- **Lead character:** a cat, as in the film's spirit, or our own twist? For example, "Meascat" could be an original meerkat-cat creature.

## Sources

- [Wikipedia — Flow (2024 film)](https://en.wikipedia.org/wiki/Flow_(2024_film))
- [Blender.org — Making Flow: interview with Gints Zilbalodis](https://www.blender.org/?p=93732)
- [Creative Bloq — How Blender helped make Flow](https://creativebloq.com/entertainment/movies-tv-shows/how-blender-helped-gints-zilbalodis-make-oscar-nominated-flow)
- [80.lv — How the animation for Flow was created](https://80.lv/articles/see-how-animation-for-the-award-winning-movie-flow-was-created/)
- [Reverse Shot — Interview with Gints Zilbalodis](https://reverseshot.org/interviews/entry/3284/flow_gints)
- [Film Music Reporter — Flow soundtrack](https://filmmusicreporter.com/2024/11/01/flow-soundtrack-album-released/)
- [Cinemacats — Flow (2024), sound design notes](https://cinemacats.com/flow-2024/)
- [Baltic Times — Flow box office](https://www.baltictimes.com/zilbalodis__animated_feature__flow__glosses_over_eur_33_million_worldwide)
- [Animation Magazine — Flow budget and awards](https://animationmagazine.net/?p=3263656)
- [Zippy Frames — Golden Globe](https://www.zippyframes.com/news/awards/flow-wins-at-golden-globes)
- [Sportskeeda — Ending explained](https://www.sportskeeda.com/us/movies/flow-movie-ending-explained-what-happens-cat-whale)
- [SF Encyclopedia — Flow](https://sf-encyclopedia.com/entry/flow)
- [Gamegeeker — Stray review (wordless storytelling)](https://gamegeeker.com/de/games/stray/review)
- [Unity forums — games set in a film's universe and copyright](https://discussions.unity.com/t/are-games-set-in-a-film-movie-tv-franchises-universe-copyright-infringement/519206)
- [OpenGameArt — Quaternius CC0 animated animals](https://opengameart.org/content/animated-animales-low-poly)
- [Tuts+ — Creating toon water for the web](https://code.tutsplus.com/creating-toon-water-for-the-web-part-1--cms-30447t)
- [three.js forum — CapCôtier (stylised water, mobile quality profiles)](https://discourse.threejs.org/t/capcotier-a-3d-game-to-learn-the-coastal-boat-license-r3f-synthesized-audio/93050)
