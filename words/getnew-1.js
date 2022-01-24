// I used this script to filter out new words when a new word list turned up
// The first manually revised set of words is in hu-words-5-filtered.txt
// The new list, saved from szotar.hu, is in szotarhu-5-filter1.txt
// The additions were again manually reviewed and saved as szotarhu-5-filter3.txt
// This is used directly by the custom build task

const fs = require("fs");

let prevWordsStr = fs.readFileSync("words/hu-words-5-filtered.txt", "utf8");
let prevWordsArr = prevWordsStr.split(/\r?\n/);
let prevWords = new Set();
prevWordsArr.forEach(word => {
  if (word.startsWith(".")) word = word.substr(1);
  prevWords.add(word);
});

let newWordsStr = fs.readFileSync("words/szotarhu-5-filter1.txt", "utf8");
let newWordsArr = newWordsStr.split(/\r?\n/);
let out = "";
for (const word of newWordsArr) {
  if (prevWords.has(word)) continue;
  out += word + "\n";
}
fs.writeFileSync("words/szotarhu-5-filter2.txt", out);
