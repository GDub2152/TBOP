(() => {
  const data = window.SITE_DATA || {};
  const $ = id => document.getElementById(id);

  const makeCard = item => {
    const article = document.createElement("article");
    article.className = "card";

    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = item.label || "Update";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = item.date || "";

    const body = document.createElement("p");
    body.textContent = item.body || "";

    article.append(kicker, title, meta, body);

    if (item.linkText && item.linkUrl) {
      const link = document.createElement("a");
      link.className = "text-link";
      link.href = item.linkUrl;
      link.textContent = item.linkText + " →";
      if (item.linkUrl.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      article.appendChild(link);
    }
    return article;
  };

  const newsGrid = $("newsGrid");
  (data.news || []).forEach(item => newsGrid.appendChild(makeCard(item)));

  const eventsGrid = $("eventsGrid");
  (data.events || []).forEach(item => eventsGrid.appendChild(makeCard(item)));

  const aboutText = $("aboutText");
  (data.about || []).forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    aboutText.appendChild(p);
  });

  const quickInfo = $("quickInfo");
  (data.quickInfo || []).forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "quick-row";
    const a = document.createElement("span");
    const b = document.createElement("span");
    a.textContent = label;
    b.textContent = value;
    row.append(a,b);
    quickInfo.appendChild(row);
  });

  const addResources = (targetId, items) => {
    const target = $(targetId);
    (items || []).forEach(item => {
      const a = document.createElement("a");
      a.className = "resource-card";
      a.href = item.url || "#";
      if ((item.url || "").startsWith("http")) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      const strong = document.createElement("strong");
      strong.textContent = item.title || "";
      const span = document.createElement("span");
      span.textContent = item.description || "";
      a.append(strong, span);
      target.appendChild(a);
    });
  };

  addResources("libraryGrid", data.library);
  addResources("resourcesGrid", data.resources);

  const galleryGrid = $("galleryGrid");
  (data.gallery || []).forEach(item => {
    const card = document.createElement("article");
    card.className = "gallery-card";
    const visual = document.createElement("div");
    visual.className = "gallery-placeholder";
    visual.textContent = "📷";
    const caption = document.createElement("div");
    caption.className = "gallery-caption";
    const strong = document.createElement("strong");
    strong.textContent = item.title || "";
    const span = document.createElement("span");
    span.textContent = item.description || "";
    caption.append(strong, span);
    card.append(visual, caption);
    galleryGrid.appendChild(card);
  });

  if (data.contact) {
    $("contactText").textContent = data.contact.text || "";
    if (data.contact.email) {
      const btn = $("contactButton");
      btn.href = "mailto:" + data.contact.email;
      btn.classList.remove("hidden");
    }
  }

  $("year").textContent = new Date().getFullYear();

  const navToggle = $("navToggle");
  const siteNav = $("siteNav");
  navToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  siteNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
})();
