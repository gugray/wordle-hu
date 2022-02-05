import "./test.js"
import {Gamestate, LetterState} from "./gamestate.js";

let guesses1 = [
  { word: "csibe", wrongLetter: "csie", wrongPlace: "b", good: ""},
  { word: "opera", wrongLetter: "csieopr", wrongPlace: "ba", good: ""},
  { word: "rumba", wrongLetter: "csieopru", wrongPlace: "ba", good: "m"},
  { word: "tarot", wrongLetter: "csieoprut", wrongPlace: "b", good: "ma"},
  { word: "burok", wrongLetter: "csieoprutk", wrongPlace: "", good: "mab"},
  { word: "bamba", wrongLetter: "csieoprutk", wrongPlace: "", good: "mab"},
];

let guesses2 = [
  { word: "tarot", wrongLetter: "tro", wrongPlace: "a", good: ""},
  { word: "burok", wrongLetter: "trouk", wrongPlace: "ab", good: ""},
  { word: "csibe", wrongLetter: "troukcsie", wrongPlace: "a", good: "b"},
  { word: "opera", wrongLetter: "troukcsieop", wrongPlace: "", good: "ab"},
  { word: "rumba", wrongLetter: "troukcsieop", wrongPlace: "", good: "abm"},
  { word: "bamba", wrongLetter: "troukcsieop", wrongPlace: "", good: "abm"},
];

function isMarkingRight(t, markedLetters, expectedWrongLetter, expectedWrongPlace, expectedGood) {
  let expectedWrongLetterSet = strToSet(expectedWrongLetter);
  let expectedWrongPlaceSet = strToSet(expectedWrongPlace);
  let expectedGoodSet = strToSet(expectedGood);
  let wrongLetterSet = new Set();
  let wrongPlaceSet = new Set();
  let goodSet = new Set();
  markedLetters.forEach((state, letter) => {
    if (state == LetterState.WrongLetter) wrongLetterSet.add(letter);
    else if (state == LetterState.WrongPlace) wrongPlaceSet.add(letter);
    else if (state == LetterState.RightPlace) goodSet.add(letter);
  });
  if (!eqSet(expectedWrongLetterSet, wrongLetterSet))
    t.error("Expected wrong letters '" + expectedWrongLetter + "', got '" + [...wrongLetterSet] + "'");
  if (!eqSet(expectedWrongPlaceSet, wrongPlaceSet))
    t.error("Expected wrong place '" + expectedWrongPlace + "', got '" + [...wrongPlaceSet] + "'");
  if (!eqSet(expectedGoodSet, goodSet))
    t.error("Expected good '" + expectedGood + "', got '" + [...goodSet] + "'");
}

function strToSet(str) {
  let res = new Set();
  for (let i = 0; i < str.length; ++i) res.add(str[i]);
  return res;
}

function eqSet(as, bs) {
  if (as.size !== bs.size) return false;
  for (var a of as) if (!bs.has(a)) return false;
  return true;
}

function genTestMarkedLetters(solution, guesses) {
  function testMarkedLetters(t) {
    let gs = new Gamestate(0, solution);
    for (const guess of guesses) {
      for (let i = 0; i < guess.word.length; ++i)
        gs.addLetter(guess.word[i]);
      gs.commitWord();
      let mls = gs.getMarkedLetters();
      isMarkingRight(t, mls, guess.wrongLetter, guess. wrongPlace, guess.good);
    }
  }
  return testMarkedLetters;
}

window.tests.push(genTestMarkedLetters("bamba", guesses1));
window.tests.push(genTestMarkedLetters("bamba", guesses2));


