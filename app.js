const form = document.getElementById("searchForm");
const input = document.getElementById("wordInput");
const wordEl = document.getElementById("word");
const phoneticEl = document.getElementById("phonetic");
const meaningEl = document.getElementById("meaning");
const errorEl = document.getElementById("error");
const resultDiv = document.getElementById("result");
const loadingDiv = document.getElementById("loading");
const synonymsDiv = document.getElementById("synonyms");
const audioContainer = document.getElementById("audioContainer");
const favBtn = document.getElementById("favoriteBtn");
const favList = document.getElementById("favoritesList");
const favCount = document.getElementById("favCount");

let currentWord = "";
let favs = JSON.parse(localStorage.getItem("wordly_favorites")) || [];

const saveFavs = () => localStorage.setItem("wordly_favorites", JSON.stringify(favs));

const renderFavs = () => {
  favCount.textContent = `(${favs.length})`;
  favList.innerHTML = favs.length
    ? favs.map(f =>
        `<div class="favorite-item">
          <span onclick="searchWord('${f.word}')">${f.word}</span>
          <button onclick="removeFav('${f.word}')">X</button>
        </div>`
      ).join("")
    : "<p>No favorites yet</p>";
};

const toggleFav = () => {
  if (!currentWord) return;
  favs = favs.find(f => f.word === currentWord)
    ? favs.filter(f => f.word !== currentWord)
    : [...favs, { word: currentWord }];
  saveFavs();
  renderFavs();
  favBtn.textContent = favs.find(f => f.word === currentWord) ? "Saved" : "Save";
};

/* API FETCH */
async function fetchWord(word) {
  try {
    errorEl.textContent = "";
    resultDiv.style.display = "none";
    loadingDiv.style.display = "block";

    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error();

    const data = (await res.json())[0];
    currentWord = data.word;

    wordEl.textContent = data.word;
    phoneticEl.textContent = data.phonetic || "";

    /* AUDIO */
    const audio = data.phonetics.find(p => p.audio)?.audio;
    audioContainer.innerHTML = audio ? `<audio controls src="${audio}"></audio>` : "No audio";

    meaningEl.innerHTML = data.meanings
      .flatMap(m =>
        m.definitions.map(d =>
          `<div class="meaning-item">
            <h3>${m.partOfSpeech}</h3>
            <p>${d.definition}</p>
            ${d.example ? `<i>${d.example}</i>` : ""}
          </div>`
        )
      ).join("");


// synonyms 
      const syns = [...new Set(
      data.meanings.flatMap(m =>
        m.definitions.flatMap(d => d.synonyms || [])
      )
    )].slice(0, 10);

    synonymsDiv.innerHTML = syns.length
      ? "<h3>Synonyms:</h3>" + syns.map(s =>
          `<span class="synonym-chip" onclick="fetchWord('${s}')">${s}</span>`
        ).join("")
      : "";

    favBtn.textContent = favs.find(f => f.word === currentWord) ? "Saved" : "Save";

    resultDiv.style.display = "block";
    loadingDiv.style.display = "none";

  } catch {
    loadingDiv.style.display = "none";
    errorEl.textContent = "Word not found";
  }
}

window.searchWord = fetchWord;

window.removeFav = word => {
  favs = favs.filter(f => f.word !== word);
  saveFavs();
  renderFavs();
};

form.onsubmit = e => {
  e.preventDefault();
  if (input.value.trim()) fetchWord(input.value.trim());
};

favBtn.onclick = toggleFav;

renderFavs();