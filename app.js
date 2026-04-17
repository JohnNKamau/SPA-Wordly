


// Get elements
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
const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesListDiv = document.getElementById("favoritesList");
const favCountSpan = document.getElementById("favCount");
const themeBtn = document.getElementById("themeBtn");

// Variables
let currentWord = "";
let currentAudio = null;

// Load favorites from localStorage
let favorites = JSON.parse(localStorage.getItem("wordly_favorites")) || [];

// Theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️ Light";
}

// Event listeners
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const word = input.value.trim();
  if (!word) return;
  fetchWord(word);
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeBtn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
});

favoriteBtn?.addEventListener("click", () => {
  if (!currentWord) return;
  
  const exists = favorites.find(f => f.word === currentWord);
  if (exists) {
    favorites = favorites.filter(f => f.word !== currentWord);
    favoriteBtn.classList.remove("active");
    favoriteBtn.textContent = "❤️ Save";
  } else {
    favorites.push({ word: currentWord, date: new Date().toISOString() });
    favoriteBtn.classList.add("active");
    favoriteBtn.textContent = "✅ Saved";
  }
  
  localStorage.setItem("wordly_favorites", JSON.stringify(favorites));
  displayFavorites();
});

// Fetch word from API
async function fetchWord(word) {
  try {
    // Clear and show loading
    errorEl.textContent = "";
    meaningEl.innerHTML = "";
    synonymsDiv.innerHTML = "";
    audioContainer.innerHTML = "";
    resultDiv.style.display = "none";
    loadingDiv.style.display = "block";
    
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (!res.ok) {
      throw new Error("Word not found");
    }
    
    const data = await res.json();
    const result = data[0];
    currentWord = result.word;
    
    // Display word and phonetic
    wordEl.textContent = result.word;
    phoneticEl.textContent = result.phonetic || "";
    
    // Setup audio
    const audio = result.phonetics.find(p => p.audio);
    if (audio && audio.audio) {
      const audioElem = document.createElement("audio");
      audioElem.controls = true;
      audioElem.src = audio.audio;
      audioContainer.innerHTML = "";
      audioContainer.appendChild(audioElem);
    } else {
      audioContainer.innerHTML = "<p>No audio available</p>";
    }
    
    // Display meanings (all definitions, not just first)
    meaningEl.innerHTML = "";
    result.meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        const div = document.createElement("div");
        div.className = "meaning-item";
        div.innerHTML = `
          <h3>${meaning.partOfSpeech}</h3>
          <p>${def.definition}</p>
          ${def.example ? `<div class="example">📖 "${def.example}"</div>` : ""}
        `;
        meaningEl.appendChild(div);
      });
    });
    
    // Display synonyms
    const allSynonyms = [];
    result.meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        if (def.synonyms && def.synonyms.length > 0) {
          allSynonyms.push(...def.synonyms);
        }
      });
    });
    
    const uniqueSynonyms = [...new Set(allSynonyms)].slice(0, 10);
    
    if (uniqueSynonyms.length > 0) {
      synonymsDiv.innerHTML = "<h3>Similar Words:</h3>";
      uniqueSynonyms.forEach(syn => {
        const chip = document.createElement("span");
        chip.className = "synonym-chip";
        chip.textContent = syn;
        chip.onclick = () => {
          input.value = syn;
          fetchWord(syn);
        };
        synonymsDiv.appendChild(chip);
      });
    }
    
    // Update favorite button
    const isFav = favorites.find(f => f.word === currentWord);
    if (isFav) {
      favoriteBtn.classList.add("active");
      favoriteBtn.textContent = "✅ Saved";
    } else {
      favoriteBtn.classList.remove("active");
      favoriteBtn.textContent = "❤️ Save";
    }
    
    // Show results
    resultDiv.style.display = "block";
    loadingDiv.style.display = "none";
    
  } catch (error) {
    loadingDiv.style.display = "none";
    errorEl.textContent = "❌ Word not found. Try another word.";
    wordEl.textContent = "";
    phoneticEl.textContent = "";
    meaningEl.innerHTML = "";
    synonymsDiv.innerHTML = "";
    audioContainer.innerHTML = "";
    resultDiv.style.display = "none";
  }
}

// Display favorites
function displayFavorites() {
  if (!favoritesListDiv) return;
  
  favCountSpan.textContent = `(${favorites.length})`;
  
  if (favorites.length === 0) {
    favoritesListDiv.innerHTML = "<p>No favorite words yet. Save some words!</p>";
    return;
  }
  
  favoritesListDiv.innerHTML = "";
  favorites.forEach(fav => {
    const div = document.createElement("div");
    div.className = "favorite-item";
    div.innerHTML = `
      <span class="favorite-word" onclick="searchFavorite('${fav.word}')">${fav.word}</span>
      <button class="remove-fav" onclick="removeFavorite('${fav.word}')">Remove</button>
    `;
    favoritesListDiv.appendChild(div);
  });
}

// Search favorite word
function searchFavorite(word) {
  input.value = word;
  fetchWord(word);
}

// Remove favorite
function removeFavorite(word) {
  favorites = favorites.filter(f => f.word !== word);
  localStorage.setItem("wordly_favorites", JSON.stringify(favorites));
  displayFavorites();
  
  // Update button if current word is removed
  if (currentWord === word) {
    favoriteBtn.classList.remove("active");
    favoriteBtn.textContent = "❤️ Save";
  }
}

// Make functions global for onclick
window.searchFavorite = searchFavorite;
window.removeFavorite = removeFavorite;

// Initial display
displayFavorites();

