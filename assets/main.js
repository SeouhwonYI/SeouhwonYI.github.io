// --- Publications render only (theme code removed) ---
(async function () {
  const LIST = document.getElementById("pub-list");
  const TPL = document.getElementById("pub-item");
  const MY = (window.MY_NAME || "").trim();

  function authorHTML(authors = []) {
    return authors
      .map(a => {
        const cleanA = (a || "").trim();
        return (MY && cleanA === MY) ? `<strong>${escapeHtml(cleanA)}</strong>` : escapeHtml(cleanA);
      })
      .join(", ");
  }

  function primaryLink(item) {
    if (item.arxiv) return `https://arxiv.org/abs/${encodeURIComponent(item.arxiv)}`;
    if (item.url)   return item.url;
    return null;
  }

  // filename → ./uploads/filename | absolute/url 그대로 허용
  function resolvePdfUrl(pdf) {
    if (!pdf) return null;
    const s = String(pdf).trim();
    if (/^https?:\/\//i.test(s)) return s;      // absolute URL
    if (s.startsWith("./") || s.startsWith("../")) return s; // relative path already
    if (s.startsWith("/")) return s;            // site-absolute (사용자 페이지면 OK, 프로젝트 페이지면 주의)
    return `./uploads/${encodeURIComponent(s)}`; // filename only → uploads 폴더
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
    // NOTE: 상대 경로! /data/... (루트) 아님
    const res = await fetch("./data/publications.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    // sort by year desc, then title asc
    const pubs = [...raw].sort(
      (a, b) => (b.year || 0) - (a.year || 0) || String(a.title).localeCompare(String(b.title))
    );

    pubs.forEach(item => {
      const node = TPL.content.cloneNode(true);
      const yearEl   = node.querySelector("[data-year]");
      const titleEl  = node.querySelector("[data-title]");
      const authorsEl= node.querySelector("[data-authors]");
      const venueEl  = node.querySelector("[data-venue]");
      const linksEl  = node.querySelector("[data-links]");

      yearEl.textContent = item.year ? String(item.year) : "";

      const link = primaryLink(item);
      if (link) {
        titleEl.href = link;
        titleEl.textContent = item.title || "(untitled)";
      } else {
        titleEl.removeAttribute("href");
        titleEl.textContent = item.title || "(untitled)";
        titleEl.classList.remove("link");
      }

      authorsEl.innerHTML = authorHTML(item.authors || []);
      venueEl.textContent = item.venue || "";

      const addBtn = (name, url) => {
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = name;
        a.className = "px-2.5 py-1 rounded-lg border border-slate-300/70 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800";
        linksEl.appendChild(a);
      };

      if (item.arxiv) addBtn("arXiv", `https://arxiv.org/abs/${encodeURIComponent(item.arxiv)}`);
      addBtn("PDF",   resolvePdfUrl(item.pdf));
      addBtn("Code",  item.code);
      addBtn("BibTeX",item.bibtex);

      LIST.appendChild(node);
    });
  } catch (e) {
    console.error("Failed to load publications:", e);
    if (LIST) {
      LIST.innerHTML = `<div class="text-sm text-red-600 dark:text-red-400">
        Failed to load publications. Check <code>data/publications.json</code> and files in <code>/uploads</code>.
      </div>`;
    }
  }
})();
