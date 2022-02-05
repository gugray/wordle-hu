

const LetterState = {
  UnusedLetter: "unused",
  WrongLetter: "bad",
  WrongPlace: "wrongPlace",
  RightPlace: "good",
};

class LetterInfo {
  constructor(letter, state) {
    this.letter = letter;
    this.state = state;
  }
}

const totalRowCount = 6;

class Gamestate {

  /**
   * @param dayIx {Number} Day index (this is the nth daily puzzle).
   * @param solution {String} The puzzle's solution.
   */
  constructor(dayIx, solution) {

    /** @type {Number} */
    this.dayIx = dayIx;

    /** @type {String} */
    this.solution = solution;

    /** @type {Array<String>} */
    this.rows = [""];

    /** @type {Number} */
    this.finishedRows = 0;

    this.init();
  }

  init() {
    /**
     * Used to dispatch gamestateChanged events
     * @type {EventTarget}
     */
    this.eventTarget = new EventTarget();

    /**
     * For each letter in solution, its occurrence count.
     * @type {Map<String, Number>}
     */
    this.slnLetterCounts = new Map();
    for (let i = 0; i < this.solution.length; ++i) {
      let letter = this.solution[i];
      let count = 0;
      if (this.slnLetterCounts.has(letter))
        count = this.slnLetterCounts.get(letter);
      count++;
      this.slnLetterCounts.set(letter, count);
    }
  }

  isSolved() {
    if (this.finishedRows == 0) return  false;
    let word = this.rows[this.finishedRows - 1];
    return word == this.solution;
  }

  isFinished() {
    if (this.finishedRows == this.rows.length) return true;
    if (this.isSolved()) return true;
    return false;
  }

  onGamestateChanged(handler) {
    this.eventTarget.addEventListener("gamestateChanged", handler);
  }

  removeLetter(letter) {
    if (this.isFinished()) throw "cannot remove letter in finished game";
    let word = this.rows[this.finishedRows];
    if (word.length == 0) throw "row is already empty";
    this.rows[this.finishedRows] = word.substr(0, word.length - 1);
    this.eventTarget.dispatchEvent(new Event("gamestateChanged"));
  }

  commitWord() {
    if (this.isFinished()) throw "cannot commit word in finished game";
    let word = this.rows[this.finishedRows];
    if (word.length != 5) throw "cannot commit word that does not have 5 characters";
    ++this.finishedRows;
    if (this.rows.length < totalRowCount) this.rows.push("");
    this.eventTarget.dispatchEvent(new Event("gamestateChanged"));
  }

  addLetter(letter) {
    if (this.isFinished()) throw "cannot add letter to finished game";
    if (this.rows[this.finishedRows].length == 5) throw "row is already full";
    this.rows[this.finishedRows] += letter;
    this.eventTarget.dispatchEvent(new Event("gamestateChanged"));
  }

  getActiveWord() {
    if (this.isFinished()) return null;
    return this.rows[this.finishedRows];
  }

  /**
   * @returns {Map<string, LetterState>} A map with all the letters on the keyboard that are no grey (unused).
   */
  getMarkedLetters() {

    // For each letter played so far, gather a list of correct indexes in solution
    /** @type {Map<String, LetterStat>} */
    let letterStats = new Map();
    for (let i = 0; i < this.finishedRows; ++i) {
      let word = this.rows[i];
      for (let j = 0; j < word.length; ++j) {
        let letter = word[j];
        let kbdLetterInfo;
        if (letterStats.has(letter)) kbdLetterInfo = letterStats.get(letter);
        else {
          kbdLetterInfo = new LetterStat();
          letterStats.set(letter, kbdLetterInfo);
        }
        if (this.solution[j] == word[j]) kbdLetterInfo.addRightIx(j);
      }
    }

    // For each letter played, decide on its keyboard state
    /** @type {Map<string, LetterState>} */
    let res = new Map();
    letterStats.forEach((stat, letter) => {
      // Not in solution: wrong letter
      if (!this.slnLetterCounts.has(letter))
        res.set(letter, LetterState.WrongLetter);
      // Haven't found all the right places yet: wrong place
      else if (stat.rightIxs.length < this.slnLetterCounts.get(letter))
        res.set(letter, LetterState.WrongPlace);
      // All the right places found: good letter!
      else res.set(letter, LetterState.RightPlace);
    });
    return res;
  }

  getFinishedRow(ix) {
    let word = this.rows[ix];
    let res = [];
    for (let pos = 0; pos < word.length; ++pos) {
      let guessLetter = word[pos];
      let letterState = LetterState.WrongLetter;
      if (this.solution[pos] == guessLetter) letterState = LetterState.RightPlace;
      else if (this.solution.indexOf(guessLetter) != -1) {
        // Total occurrences of this letter in solution
        let countInSolution = 0;
        if (this.slnLetterCounts.has(guessLetter))
          countInSolution = this.slnLetterCounts.get(guessLetter);
        // Correct in guess, anywhere
        let totalCorrectInGuess = 0;
        // Wrong count in guess before this position
        let wrongCountInGuessBefore = 0;
        for (let i = 0; i < this.solution.length; ++i) {
          if (i < pos && word[i] == guessLetter && this.solution[i] != guessLetter)
            ++wrongCountInGuessBefore;
          if (word[i] == guessLetter && word[i] == this.solution[i])
            ++totalCorrectInGuess;
        }
        // Based on these, the letter state to show here
        if (wrongCountInGuessBefore + totalCorrectInGuess >= countInSolution)
          letterState = LetterState.WrongLetter;
        else
          letterState = LetterState.WrongPlace;
      }
      res.push(new LetterInfo(guessLetter, letterState));
    }
    return res;
  }

  getShareText(darkMode, contrastColors) {
    let rowInfos = [];
    for (let i = 0; i < this.finishedRows; ++i) {
      rowInfos.push(this.getFinishedRow(i));
    }
    let res = "";
    for (const ri of rowInfos) {
      if (res.length > 0) res += "\n";
      let first = true;
      for (const li of ri) {
        if (!first) res += " "; // Hair-width space
        first = false;
        if (li.state == LetterState.WrongLetter) res += darkMode ? "⬛" : "⬜";
        else if (li.state == LetterState.WrongPlace) res += contrastColors ? "🟦" : "🟥";
        else if (li.state == LetterState.RightPlace) res += contrastColors ? "🟧" : "🟩";
      }
    }
    return res;
  }
}

/**
 * For a single played letter, records indexes where it was played at the right place in the solution.
 */
class LetterStat {
  constructor() {
    /**
     * Sorted array of correct indexes
     * @type {Array<Number>}
     */
    this.rightIxs = [];
  }

  /**
   * Adds a correct index to the array, if not there yet.
   * @param ix Newly observed correct index
   */
  addRightIx(ix) {
    if (this.rightIxs.includes(ix)) return;
    this.rightIxs.push(ix);
    this.rightIxs.sort((a, b) => a - b);
  }
}

export { LetterState, LetterInfo, Gamestate };
