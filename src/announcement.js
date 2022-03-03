function announceSorry() {
  let elm = document.createElement("section");
  elm.setAttribute("id", "announcement");
  elm.innerHTML = htmlSorry;
  let elmGrid = document.getElementById("grid");
  elmGrid.classList.add("hidden");
  elmGrid.before(elm);
  elm.addEventListener("change", () => {
    elm.querySelector("button").disabled = false;
  });
  elm.querySelector("button").addEventListener("click", () => {
    elm.remove();
    elmGrid.classList.remove("hidden");
  });
}

const htmlSorry = `
<h3>Bocs a<br>tegnapiért!</h3>
<div>
  <input type="radio" id="sorry1" name="sorry">
  <label for="sorry1">Szóra sem érdemes</label>
</div>
<div>
  <input type="radio" id="sorry2" name="sorry">
  <label for="sorry2">Fátylat rá</label>
</div>
<button disabled>Mutasd a mait!</button>
<p>
  <a href="https://gist.github.com/gugray/c616706bd975888eff2db9254f717325">Ugye több ilyen nem lesz?</a>
</p>
`;

export {announceSorry};
