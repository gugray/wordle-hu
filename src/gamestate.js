

const LetterState = {
  UnusedLetter: 0,
  WrongLetter: 1,
  WrongPlace: 2,
  RightPlace:3,
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
    document.addEventListener("gamestateChanged", handler);
  }

  removeLetter(letter) {
    if (this.isFinished()) throw "cannot remove letter in finished game";
    let word = this.rows[this.finishedRows];
    if (word.length == 0) throw "row is already empty";
    this.rows[this.finishedRows] = word.substr(0, word.length - 1);
    document.dispatchEvent(new Event("gamestateChanged"));
  }

  commitWord() {
    if (this.isFinished()) throw "cannot commit word in finished game";
    let word = this.rows[this.finishedRows];
    if (word.length != 5) throw "cannot commit word that does not have 5 characters";
    ++this.finishedRows;
    if (this.rows.length < totalRowCount) this.rows.push("");
    document.dispatchEvent(new Event("gamestateChanged"));
  }

  addLetter(letter) {
    if (this.isFinished()) throw "cannot add letter to finished game";
    if (this.rows[this.finishedRows].length == 5) throw "row is already full";
    this.rows[this.finishedRows] += letter;
    document.dispatchEvent(new Event("gamestateChanged"));
  }

  getActiveWord() {
    if (this.isFinished()) return null;
    return this.rows[this.finishedRows];
  }

  getMarkedLetters() {
    let res = new Map();
    for (let i = 0; i < this.finishedRows; ++i) {
      let word = this.rows[i];
      for (let j = 0; j < word.length; ++j) {
        let letter = word[j];
        if (this.solution.indexOf(letter) == -1) res.set(letter, LetterState.WrongLetter);
        else {
          let ls = j == this.solution.indexOf(letter) ? LetterState.RightPlace : LetterState.WrongPlace;
          if (!res.has(letter) || res.get(letter) == LetterState.WrongPlace)
            res.set(letter, ls);
        }
      }
    }
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
        for (let i = 0; i < this.solution.length; ++i)
          if (this.solution[i] == guessLetter)
            ++countInSolution;
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
        if (wrongCountInGuessBefore + totalCorrectInGuess >= countInSolution) letterState = LetterState.WrongLetter;
        else letterState = LetterState.WrongPlace;
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
        if (!first) res += " ";
        first = false;
        if (li.state == LetterState.WrongLetter) res += darkMode ? "⬛" : "⬜";
        else if (li.state == LetterState.WrongPlace) res += contrastColors ? "🟦" : "🟥";
        else if (li.state == LetterState.RightPlace) res += contrastColors ? "🟧" : "🟩";
      }
    }
    return res;
  }
}

export { LetterState, LetterInfo, Gamestate };
