# Daily word guessing game in Hungarian

This is an adaptation of Josh Wardle's original game, Wordle, into Hungarian.

### How to build and develop

Install packages using Yarn, then run build.js as below. Build process
tested on Node v16.

```
yarn
node build.js --prod       ; Builds minified version
node build.js --watch      ; Builds with source map and launches with LiveReload
```

There is no framework and (almost) no dependencies in the built version. There is no
backend component; nothing about the gameplay is logged.
The `public` folder contains everything to publish as a static site.

When built with `--watch`, a narrow suite of unit tests can be executed by typing
`test();` in the console. These are mostly related to the coloring of letters based
on the game state.

### Hungarian word list

The underlying 5-letter words have been compiled from multiple sources:

- The output of `bin/szavak.sh` in László Németh's [magyarispell](https://github.com/laszlonemeth/magyarispell).
- 5-letter headwords from [szotar.com](https://szotar.com/szokereso/hossz/5-betus).
- A mysterious text file with five-letter words from the internets (source forgotten)

The list has been manually revised and curated to remove noise, proper names and conjugated forms.
The quizzes also omit slang, obvious borrowings, non-standard and vulgar words.
