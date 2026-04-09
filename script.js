const pokemonData = Array.isArray(window.POKEMON_TASTES) ? window.POKEMON_TASTES : [];

const ITEMS_PER_PAGE = 24;
const collator = new Intl.Collator("ja");

const pokemonGrid = document.getElementById("pokemonGrid");
const pagination = document.getElementById("pagination");
const resultCount = document.getElementById("resultCount");
const searchName = document.getElementById("searchName");
const tasteFilter = document.getElementById("tasteFilter");
const sortOrder = document.getElementById("sortOrder");

let currentPage = 1;

function hiraToKata(text) {
  return text.replace(/[ぁ-ん]/g, (char) => (
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  ));
}

function normalizeName(text) {
  return hiraToKata(text.trim())
    .normalize("NFKC")
    .replace(/[（）]/g, (char) => (char === "（" ? "(" : ")"))
    .toLowerCase();
}

function formatDexNumber(value) {
  return `No.${String(value).padStart(3, "0")}`;
}

function getTasteClass(taste) {
  return `taste-${taste}`;
}

function updateURL() {
  const params = new URLSearchParams();

  if (searchName.value.trim()) {
    params.set("q", searchName.value.trim());
  }

  if (tasteFilter.value) {
    params.set("taste", tasteFilter.value);
  }

  if (sortOrder.value !== "dex") {
    params.set("sort", sortOrder.value);
  }

  if (currentPage > 1) {
    params.set("page", String(currentPage));
  }

  const nextURL = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
  window.history.replaceState(null, "", nextURL);
}

function loadStateFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("q")) {
    searchName.value = params.get("q");
  }

  if (params.has("taste")) {
    tasteFilter.value = params.get("taste");
  }

  if (params.has("sort")) {
    sortOrder.value = params.get("sort");
  }

  if (params.has("page")) {
    currentPage = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  }
}

function getFilteredData() {
  const query = normalizeName(searchName.value);
  const selectedTaste = tasteFilter.value;

  const filtered = pokemonData.filter((pokemon) => {
    const normalizedName = normalizeName(pokemon.name);
    const normalizedBaseName = normalizeName(pokemon.baseName);
    const matchesName = !query
      || normalizedName.includes(query)
      || normalizedBaseName.includes(query);
    const matchesTaste = !selectedTaste || pokemon.taste === selectedTaste;
    return matchesName && matchesTaste;
  });

  if (sortOrder.value === "kana") {
    filtered.sort((a, b) => (
      collator.compare(a.name, b.name)
      || a.dexNumber - b.dexNumber
    ));
  } else {
    filtered.sort((a, b) => (
      a.dexNumber - b.dexNumber
      || collator.compare(a.name, b.name)
    ));
  }

  return filtered;
}

function renderEmptyState() {
  pokemonGrid.innerHTML = `
    <div class="empty-state">
      <h2>条件に合うポケモンが見つかりませんでした。</h2>
      <p>検索語や味の条件を変えて、もう一度お試しください。</p>
    </div>
  `;
  pagination.innerHTML = "";
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  const prevButton = document.createElement("button");
  prevButton.className = "page-btn";
  prevButton.textContent = "前へ";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    currentPage -= 1;
    render();
  });
  pagination.appendChild(prevButton);

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, Math.max(5, currentPage + 2));

  for (let page = startPage; page <= endPage; page += 1) {
    const button = document.createElement("button");
    button.className = `page-btn${page === currentPage ? " active" : ""}`;
    button.textContent = String(page);
    button.addEventListener("click", () => {
      currentPage = page;
      render();
    });
    pagination.appendChild(button);
  }

  const nextButton = document.createElement("button");
  nextButton.className = "page-btn";
  nextButton.textContent = "次へ";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    currentPage += 1;
    render();
  });
  pagination.appendChild(nextButton);
}

function renderCards(pokemonList) {
  pokemonGrid.innerHTML = "";

  for (const pokemon of pokemonList) {
    const card = document.createElement("article");
    card.className = "pokemon-card";
    card.innerHTML = `
      <div class="card-head">
        <div>
          <p class="card-number">${formatDexNumber(pokemon.dexNumber)}</p>
          <h2 class="card-name">${pokemon.name}</h2>
        </div>
        <div class="card-icon-wrap">
          <img
            class="card-icon"
            src="${pokemon.iconUrl}"
            alt="${pokemon.name} のアイコン"
            loading="lazy"
            width="72"
            height="72"
          >
        </div>
      </div>
      <div class="card-footer">
        <div>
          <p class="taste-caption">好きな味</p>
          <span class="taste-pill ${getTasteClass(pokemon.taste)}">${pokemon.taste}</span>
        </div>
      </div>
    `;
    pokemonGrid.appendChild(card);
  }
}

function render() {
  const filtered = getFilteredData();
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  resultCount.textContent = `${totalItems}件`;

  if (totalItems === 0) {
    renderEmptyState();
    updateURL();
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  renderCards(pageItems);
  renderPagination(totalPages);
  updateURL();
}

function resetAndRender() {
  currentPage = 1;
  render();
}

loadStateFromURL();

searchName.addEventListener("input", resetAndRender);
tasteFilter.addEventListener("change", resetAndRender);
sortOrder.addEventListener("change", resetAndRender);

render();
