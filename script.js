const API_URL = "https://dummyjson.com/quotes/random";
const STORAGE_KEY = "favoriteQuotes";

const quoteText = document.querySelector("#quote-text");
const quoteAuthor = document.querySelector("#quote-author");
const errorMsg = document.querySelector("#error-msg");
const statusMsg = document.querySelector("#status-msg");
const newQuoteBtn = document.querySelector("#new-quote-btn");
const copyBtn = document.querySelector("#copy-btn");
const favBtn = document.querySelector("#fav-btn");
const favList = document.querySelector("#fav-list");
const clearFavsBtn = document.querySelector("#clear-favs-btn");

let currentQuote = null;          
let favorites = loadFavorites();
let statusTimer = null;

async function getQuote() {
  clearMessages();
  setLoading(true);

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.quote || !data.author) {
      throw new Error("Unexpected data format");
    }

    currentQuote = { id: data.id, quote: data.quote, author: data.author };
    quoteText.textContent = `"${currentQuote.quote}"`;
    quoteAuthor.textContent = `— ${currentQuote.author}`;
    copyBtn.disabled = false;
    favBtn.disabled = false;
  } catch (error) {
    console.error(error);
    currentQuote = null;
    quoteText.textContent = "";
    quoteAuthor.textContent = "";
    errorMsg.textContent = "Could not fetch data. Check your internet connection or try again later.";
    copyBtn.disabled = true;
    favBtn.disabled = true;
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  newQuoteBtn.disabled = isLoading;
  newQuoteBtn.textContent = isLoading ? "Loading..." : "New Quote";
  if (isLoading) {
    quoteText.textContent = "Loading...";
    quoteAuthor.textContent = "";
  }
}

function clearMessages() {
  errorMsg.textContent = "";
  statusMsg.textContent = "";
}

function showStatus(message) {
  statusMsg.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMsg.textContent = "";
  }, 2000);
}

async function copyQuote() {
  if (!currentQuote) return;
  const text = `"${currentQuote.quote}" — ${currentQuote.author}`;

  try {
    await navigator.clipboard.writeText(text);
    showStatus("Copied to clipboard!");
  } catch (error) {
    console.error(error);
    showStatus("Could not copy. Please copy it manually.");
  }
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error(error);
    showStatus("Could not save favorites.");
  }
}

function addFavorite() {
  if (!currentQuote) return;

  const alreadySaved = favorites.some((fav) => fav.id === currentQuote.id);
  if (alreadySaved) {
    showStatus("Already in your favorites.");
    return;
  }

  favorites.push(currentQuote);
  saveFavorites();
  renderFavorites();
  showStatus("Saved to favorites!");
}

function removeFavorite(id) {
  favorites = favorites.filter((fav) => String(fav.id) !== String(id));
  saveFavorites();
  renderFavorites();
}

function clearFavorites() {
  favorites = [];
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  favList.innerHTML = "";
  clearFavsBtn.disabled = favorites.length === 0;

  if (favorites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No favorites yet.";
    favList.appendChild(empty);
    return;
  }

  favorites.forEach((fav) => {
    const item = document.createElement("li");
    item.className = "fav-item";

    const text = document.createElement("p");
    text.textContent = `"${fav.quote}" — ${fav.author}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.dataset.id = fav.id;
    removeBtn.textContent = "Remove";

    item.append(text, removeBtn);
    favList.appendChild(item);
  });
}

newQuoteBtn.addEventListener("click", getQuote);
copyBtn.addEventListener("click", copyQuote);
favBtn.addEventListener("click", addFavorite);
clearFavsBtn.addEventListener("click", clearFavorites);

favList.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-btn")) {
    removeFavorite(event.target.dataset.id);
  }
});

renderFavorites();
getQuote();
