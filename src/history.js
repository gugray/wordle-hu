import {differenceInDays, addDays} from "date-fns";
import {Gamestate} from "./gamestate.js";
import {Words} from "./words.js";

const firstDay = new Date(2022, 0, 6, 4, 0, 0);

function dayIndex() {
  return Math.floor(differenceInDays(new Date(), firstDay));
}

class History {

  constructor(words) {

    /** @type {Words} */
    this.words = words;

    /** @type {Array<Gamestate>} */
    this.games = [];

    let gamesDataStr = localStorage.getItem("games");
    if (gamesDataStr != null) {
      let gamesData = JSON.parse(gamesDataStr);
      for (const gs of gamesData) {
        Object.setPrototypeOf(gs, Gamestate.prototype);
        gs.init();
        this.games.push(gs);
      }
    }
  }

  hasPlayed() {
    for (const gs of this.games) {
      for (const word of gs.rows) {
        if (word.length > 0) return true;
      }
    }
    return false;
  }

  currentGame() {
    let dayIx = dayIndex();
    for (const gs of this.games) {
      if (gs.dayIx == dayIx) return gs;
    }
    let gs = new Gamestate(dayIx, this.words.getPuzzleWord(dayIx));
    this.games.push(gs);
    this.save();
    return gs;
  }

  save() {
    let gamesDataStr = JSON.stringify(this.games);
    localStorage.setItem("games", gamesDataStr);
  }

  nextGameDate() {
    let now = new Date();
    if (now.getHours() < 4) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0);
    }
    else {
      let date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0);
      return addDays(date, 1);
    }
  }

}

export {History};
