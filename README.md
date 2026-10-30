# Lofi Studio

**Live: [lofi-studio-one.vercel.app](https://lofi-studio-one.vercel.app)** · cozy beats for tiny pixel worlds

A lo-fi music studio that runs entirely in your browser. You pick a vibe and it plays, styled as a pixel-art castle.

Open `index.html` in a browser. There's nothing to install. Audio is generated live with [Tone.js](https://tonejs.github.io/).

## How it works

The whole studio fits on one screen, on a phone or a desktop: the scene, a panel of tabs, and the player. Nothing scrolls.

1. **Vibe.** Tap a vibe card, or type something like *"rainy night, soft piano, 72 bpm in A minor"* and hit BREW.
2. **Shape.** Set speed, bounce (swing), vintage (tape dust and wobble) and space (reverb), and fine-tune the key, chords, groove and keys instrument.
3. **Mix.** Turn keys, bass, drums, melody, pad, vinyl crackle and rain on or off, and set each one's volume.

**Sounds** takes your own audio files, and **Albums** has seven finished albums.

**On a phone** it's simpler. The scene is the vibe picker: swipe it (or tap its arrows) and the next vibe plays, each in a place of its own. Under the scene, **CUSTOM** and **ALBUMS** switch modes. Custom is your own track, with the Vibe, Shape, Mix and Sounds tabs. Albums takes over the scene, the panel and the player: swipe from album to album, tap a track, and ⏭ skips ahead. Switching back to Custom brings your own track back.

Every vibe has its own band and groove:

| Vibe | Style | Sound |
|---|---|---|
| Late Night Study | boom bap | Rhodes, dusty drums |
| Rainy Window | half-time | felt piano arpeggios, deep sub bass |
| Coffee Shop Jazz | jazz trio | brushes and ride cymbal, walking bass |
| Sunday Morning | sunny bounce | strummed guitar, claps and shaker |
| Neo-Soul Groove | neo-soul | Wurlitzer, lazy snare, synth bass and lead |
| Sleepy Ambient | ambient | no drums, swells and music box |
| Old Tape Memories | bossa nova | organ, rim clave, shaker |
| Bittersweet | waltz (3/4) | felt piano on beats 2 and 3 |

**TRY ANOTHER** keeps the vibe and makes a new song in it: a new melody, and the style's other options for the groove, the way the keys and bass play, and the lead (vibraphone, flute, music box, guitar or synth). **RECORD** saves what you hear as a `.webm` file.

**LED MODE** (top corner) keeps every light steady, so nothing flashes with the beat. It's on from the start if your system is set to reduce motion, and the browser remembers your choice.

## Albums

There are seven finished albums, browsed in a swipeable carousel where the highlighted cover plays its scene live. Each album is set in its own animated hi-bit pixel scene, and its cover art is cropped from that scene (you can download it as a 1200×1200 PNG):

| Album | Scene |
|---|---|
| Lanterns in the Rain | cozy home office, rain on the window |
| Sunday at the Observatory | park bench below the observatory |
| Sleepwalker's Keep | dock on a moonlit lake |
| Corner Booth Sessions | coffee shop booth by the window |
| Seeds & Sunlight | garden on a sunny morning |
| Campfire Under Pines | camping by a fire in the forest |
| Low Tide Postcards | walking the beach at sunset |

The scenes are alive. Trees, grass and flowers sway in the breeze, harder when it rains. Birds fly in to perch, peck and fly off again, and the park's pigeons scatter when the dog walker comes by. Rain splashes on the ground and rings the water.

A guy and a girl in hoodies (headphones on) take turns across the scenes; the guy walks the castle on the Create tab. The **Character** switch under the scene picks Auto (take turns), Guy or Girl for every scene and cover, and the browser remembers your choice.

Each track is a fixed recipe and seed, so it plays the same song every time. Albums play one full arrangement per track, then move to the next track.

## Your own sounds

Drop audio files onto the page to use them as melody or beat loops (stretched to fit the tempo), vocal chops that follow the chords, background textures, or replacement kick, snare and hi-hat sounds.

## Make it your own

The code is yours to build on, under the [MIT license](LICENSE): change it, ship it, even sell it. Just keep the `LICENSE` file with your copy.

1. Click **Use this template** for a fresh repo of your own, or **Fork** if you'd like to suggest changes back here.
2. Open `index.html` in a browser. It's one file with no build step, so edit and refresh.
3. Put it on any static host, like Vercel, Netlify or GitHub Pages.

A copy still points to this one, so before you share yours, please give it its own name and change these:

- **Name:** search `index.html` for `Lofi` and `LOFI`. The splash screen's logo is drawn in pixels (`.sp-logo`), so replace that too.
- **Address:** search for `lofi-studio-one.vercel.app`. That's the page address and the link-preview image.
- **Credits:** search for `Chris Rader`, `rader-ai` and `happyrader`. That covers the header credit, the page details and the About box (name, photo and links).
- **Images:** replace `og.png` (the link preview), `favicon.svg`, `favicon-32.png` and `apple-touch-icon.png`.

## Credits

Made by [Chris Rader](https://happyrader.com) ([@rader-ai](https://github.com/rader-ai)). Sound by [Tone.js](https://tonejs.github.io/); fonts are Press Start 2P and VT323.

## License

[MIT](LICENSE). Tone.js (MIT) and the fonts (SIL Open Font License) have their own licenses and load from public CDNs.
