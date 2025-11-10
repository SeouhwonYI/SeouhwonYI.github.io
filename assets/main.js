// --- Theme toggle (emoji) ---
const THEME_KEY = "theme";

function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "dark" || (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
    setEmoji("🌞"); // now showing sun because we're in dark (click to go light)
  } else {
    root.classList.remove("dark");
    setEmoji("🌙"); // now showing moon because we're in light (click to go dark)
  }
}

function setEmoji(e) {
  const span = document.getElementById("theme-emoji");
  if (span) span.textContent = e;
}

document.addEventListener("DOMContentLoaded", () => {
  const current = localStorage.getItem(THEME_KEY) || "system";
  applyTheme(current);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("dark");
      const next = isDark ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }
});

// --- Publications render ---
(async function () {
  const LIST = document.getElementById("pub-list");
  const TPL = document.getElementById("pub-item");
  const MY = (window.MY_NAME || "").trim();

  function authorHTML(authors = []) {
    return authors.map(a => {
      const cleanA = (a || "").trim();
      if (MY && cleanA === MY) return `<strong>${escapeHtml(cleanA)}</strong>`;
      return escapeHtml(cleanA);
    }).join(", ");
  }

  function primaryLink(item) {
    if (item.arxiv) return `https://arxiv.org/abs/${encodeURIComponent(item.arxiv)}`;
    if (item.url)   return item.url;
    return null;
  }

  function resolvePdfUrl(pdf) {
    if (!pdf) return null;
    const s = String(pdf).trim();
    if (/^https?:\/\//i.test(s)) return s;      // absolute URL
    if (s.startsWith("/")) return s;            // site-absolute path
    return `/uploads/${encodeURIComponent(s)}`; // filename only → uploads 폴더 (요구 1)
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  try {
    const res = await fetch("/data/publications.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const pubs = [...raw].sort((a, b) => (b.year || 0) - (a.year || 0) || String(a.title).localeCompare(String(b.title)));

    pubs.forEach(item => {
      const node = TPL.content.cloneNode(true);
      const year = node.querySelector("[data-year]");
      const title = node.querySelector("[data-title]");
      const authors = node.querySelector("[data-authors]");
      const venue = node.querySelector("[data-venue]");
      const links = node.querySelector("[data-links]");

      year.textContent = item.year ? String(item.year) : "";

      const link = primaryLink(item);
      if (link) {
        title.href = link;
        title.textContent = item.title || "(untitled)";
      } else {
        title.removeAttribute("href");
        title.textContent = item.title || "(untitled)";
        title.classList.remove("link");
      }

      authors.innerHTML = authorHTML(item.authors || []);
      venue.textContent = item.venue || "";

      const addBtn = (name, url) => {
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = name;
        a.className = "px-2.5 py-1 rounded-lg border border-slate-300/70 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800";
        links.appendChild(a);
      };

      if (item.arxiv) addBtn("arXiv", `https://arxiv.org/abs/${encodeURIComponent(item.arxiv)}`);
      addBtn("PDF", resolvePdfUrl(item.pdf)); // 파일명 → /uploads/filename.pdf
      addBtn("Code", item.code);
      addBtn("BibTeX", item.bibtex);

      LIST.appendChild(node);
    });
  } catch (e) {
    console.error("Failed to load publications:", e);
    if (LIST) LIST.innerHTML = `<div class="text-sm text-red-600 dark:text-red-400">
      Failed to load publications. Check <code>data/publications.json</code> and files in <code>/uploads</code>.
    </div>`;
  }
})();
