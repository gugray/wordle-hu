import {LetterState, LetterInfo, Gamestate} from "./gamestate.js";
import {History} from "./history.js";
import {Warning} from "./warning.js";
import {Keyboard} from "./keyboard.js";
import {Grid} from  "./grid.js";
import {Words} from "./words.js";
import confetti from "canvas-confetti";

let theWords;
let theHistory;
let theApp;

document.addEventListener('DOMContentLoaded', () => {
  theWords = new Words();
  theHistory = new History(theWords);
  theApp = new App(false);
});

// Counter on new day: "quiz ready"?

const T = {
  title: "Szó reggelt! Napi szófejtő.",
  tooFewLetters: "Kevés betű",
  unknownWord: "Ismeretlen szó\n(Vagy ragozott alak? Tulajdonnév?)",
  congrats: "Ez az!",
  puzzleSuccess: "A ${day}. napi rejtvényt megfejtetted!",
  puzzleFail: "A ${day}. napi rejtvény kifogott rajtad.",
  shareClipboard: "Az eredmény a vágólapon!",
  shareText: "Szó reggelt!\n{day}. napi fejtés: 6/{guesses}\n\n",
}

class App {
  constructor(testing) {
    this.gamestate = null;
    if (testing) this.initForTest();
    else this.initFromHistory();

    this.warning = new Warning(document.getElementsByTagName("aside")[0]);
    this.keyboard = new Keyboard(document.getElementById("keyboard"), this.gamestate);
    this.grid = new Grid(document.getElementById("grid"), this.gamestate);
    this.keyboard.onLetter(e => this.onLetter(e));
    this.keyboard.onBack(e => this.onBack());
    this.keyboard.onEnter(e => this.onEnter());
    this.gamestate.onGamestateChanged(() => this.onGamestateChanged());

    this.initPopup();
    this.initShare();

    if (this.gamestate.isFinished()) this.showStatus();
    else if (!theHistory.hasPlayed()) this.showInfo();
  }

  initPopup() {
    let elmPopup = document.getElementsByTagName("article")[0];
    document.getElementById("showInfo").addEventListener("click", () => {
      this.showInfo();
    });
    document.getElementById("showStatus").addEventListener("click", () => {
      if (!this.gamestate.isFinished()) return;
      this.showStatus();
    });
    if (this.gamestate.isFinished()) {
      document.getElementById("showStatus").classList.add("visible");
    }
    elmPopup.addEventListener("click", (e) => {
      if (e.target.tagName != "BUTTON" || !e.target.classList.contains("close")) return;
      let elmSections = elmPopup.querySelectorAll("section");
      elmSections.forEach(elm => elm.classList.remove("visible"));
      elmPopup.classList.remove("visible");
      if (this.countdownIntervalId) {
        clearInterval(this.countdownIntervalId);
        this.countdownIntervalId = null;
      }
    });
  }

  initShare() {
    document.getElementById("shareGeneral").addEventListener("click", () => {
      let msg = T.shareText;
      msg = msg.replace("{day}", this.gamestate.dayIx);
      if (this.gamestate.isSolved())
        msg = msg.replace("{guesses}", this.gamestate.finishedRows);
      else msg = msg.replace("{guesses}", "X");
      msg += this.gamestate.getShareText();
      if (navigator.share) {
        navigator.share({
          title: T.title,
          text: msg,
        }).then(() => {}).catch();
      } else {
        navigator.clipboard.writeText(msg);
        this.warning.show(T.shareClipboard);
      }
    });
  }

  showInfo() {

    let elmPopup = document.getElementsByTagName("article")[0];

    // Update version from hash in script URL
    let infoStr = "dbdb";
    let elmAppScript = document.getElementById("app-js");
    let reHash = new RegExp("\\?v=(.{4})");
    let m = reHash.exec(elmAppScript.src);
    if (m) infoStr = m[1];
    infoStr = "#" + this.gamestate.dayIx + " " + infoStr;
    elmPopup.querySelector("#info").innerText = infoStr;

    elmPopup.querySelector("#infoPopup").classList.add("visible");
    elmPopup.classList.add("visible");
  }

  showStatus() {
    let elmPopup = document.getElementsByTagName("article")[0];

    let elmStatusMsg = document.getElementById("statusMsg");
    let elmTimeLeft = document.getElementById("timeLeft");
    let dayIx = this.gamestate.dayIx;
    let msg = this.gamestate.isSolved()
      ? T.puzzleSuccess.replace("${day}", dayIx)
      : T.puzzleFail.replace("${day}", dayIx)
    elmStatusMsg.innerText = msg;
    elmPopup.querySelector("#statusPopup").classList.add("visible");
    elmPopup.classList.add("visible");

    elmPopup.querySelector("#sharePreview").innerHTML =
      "<span>" + this.gamestate.getShareText() + "</span>";

    let nextDate = theHistory.nextGameDate();
    updateCounter();
    this.countdownIntervalId = setInterval(updateCounter, 50);

    function updateCounter() {
      let dateNow = new Date();
      let seconds = Math.floor((nextDate - (dateNow)) / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);
      let days = Math.floor(hours / 24);
      hours = hours - (days * 24);
      minutes = minutes - (days * 24 * 60) - (hours * 60);
      seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
      hours = String(hours).padStart(2, "0");
      minutes = String(minutes).padStart(2, "0");
      seconds = String(seconds).padStart(2, "0");
      elmTimeLeft.innerText = `${hours}​:${minutes}​:${seconds}`;
    }
  }

  onGamestateChanged() {
    this.keyboard.updateView();
    this.grid.updateView();
    theHistory.save();
  }

  onEnter() {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length < 5) {
      this.warning.show(T.tooFewLetters);
      return;
    }
    if (!theWords.isAcceptableWord(activeWord)) {
      this.warning.show(T.unknownWord);
      return;
    }
    this.gamestate.commitWord();
    if (!this.gamestate.isFinished()) return;
    // Game just finished now
    if (this.gamestate.isSolved()) {
      this.warning.show(T.congrats);
      setTimeout(doConfetti, 600);
    } else {
      this.warning.show(this.gamestate.solution.toUpperCase());
    }
    setTimeout(() => {
      document.getElementById("showStatus").classList.add("visible");
      this.showStatus();
    }, 2000);
  }

  onBack() {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length == 0) return;
    this.gamestate.removeLetter();
  }

  onLetter(e) {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length >= 5) return;
    this.gamestate.addLetter(e.detail);
  }

  initForTest() {
    let dayIx = theHistory.dayIndex();
    this.gamestate = new Gamestate(dayIx, theWords.getPuzzleWord(dayIx));
    // this.gamestate.rows[0] = "karéj";
    // this.gamestate.rows.push("habar");
    // this.gamestate.rows.push("lehet");
    // this.gamestate.rows.push("telex");
    // this.gamestate.rows.push("butus");
    // this.gamestate.rows.push("boto");
    // this.gamestate.finishedRows = 5;
  }

  initFromHistory() {
    this.gamestate = theHistory.currentGame();
  }
}

function doConfetti() {
  confetti();
  setTimeout(() => {
    confetti();
  }, 800);
}
