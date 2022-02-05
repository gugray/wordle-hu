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

  getStats() {
    let res = {
      played: 0,
      won: 0,
      streak: 0,
      length1: 0,
      length2: 0,
      length3: 0,
      length4: 0,
      length5: 0,
      length6: 0,
      lengthX: 0,
    };
    // Parse all games for statistics
    for (const gs of this.games) {
      if (gs.isFinished()) {
        ++res.played;
        if (gs.isSolved()) {
          ++res.won;
          if (gs.finishedRows == 1) ++res.length1;
          else if (gs.finishedRows == 2) ++res.length2;
          else if (gs.finishedRows == 3) ++res.length3;
          else if (gs.finishedRows == 4) ++res.length4;
          else if (gs.finishedRows == 5) ++res.length5;
          else if (gs.finishedRows == 6) ++res.length6;
        }
        else {
          ++res.lengthX;
        }
      }
    }
    // Streak is tricky
    res.streak = this.calculateCurrentStreak();
    // Done
    return res;
  }

  calculateCurrentStreak() {
    let cg = this.currentGame();
    // If today's game was lost, no streak
    if (cg.isFinished() && !cg.isSolved()) return 0;
    let gameIx = this.games.length - 1;
    let dayIx = cg.dayIx;
    // If today's game is not yet finished, we count from yesterday
    if (!cg.isFinished()) {
      // No previous game?
      if (gameIx == 0) return 0;
      --gameIx;
      cg = this.games[gameIx];
      // Previous game wasn't yesterday?
      // Or it wasn't finished?
      // Or it was lost?
      if (cg.dayIx != dayIx - 1 || !cg.isFinished() || !cg.isSolved())
        return  0;
      // OK, we can go tracing from here
      dayIx = cg.dayIx;
    }
    // Keep counting while we're in uninterrupted winning streak
    let streak = 1;
    while (true) {
      if (gameIx == 0) break;
      --gameIx;
      cg = this.games[gameIx];
      if (cg.dayIx != dayIx - 1 || !cg.isFinished() || !cg.isSolved())
        break;
      dayIx = cg.dayIx;
      ++streak;
    }
    return streak;
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
    let gamesDataStr = JSON.stringify(this.games, (key, value) => {
      if (key == "eventTarget" || key == "slnLetterCounts") return undefined;
      return value;
    });
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
