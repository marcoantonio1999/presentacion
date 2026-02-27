(function () {
      const sections = Array.from(document.querySelectorAll("main section[id]"));
      const links = Array.from(document.querySelectorAll(".toc a"));
      const linkById = new Map(
        links.map((a) => [a.getAttribute("href").slice(1), a])
      );

      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { threshold: 0.01, rootMargin: "0px 0px -8% 0px" }
      );

      document.querySelectorAll(".reveal").forEach((el) => {
        revealObserver.observe(el);
      });

      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((l) => l.classList.remove("active"));
            const active = linkById.get(entry.target.id);
            if (active) active.classList.add("active");
          });
        },
        { threshold: 0.45, rootMargin: "-12% 0px -40% 0px" }
      );

      sections.forEach((section) => navObserver.observe(section));

      const mermaidAvailable = typeof window.mermaid !== "undefined";
      if (mermaidAvailable) {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            background: "#f7fbff",
            primaryColor: "#dbeafe",
            primaryTextColor: "#0f2740",
            primaryBorderColor: "#4f7fb2",
            lineColor: "#355b84",
            secondaryColor: "#e7f1ff",
            secondaryTextColor: "#0f2740",
            secondaryBorderColor: "#5b88b8",
            tertiaryColor: "#eef5ff",
            tertiaryTextColor: "#0f2740",
            tertiaryBorderColor: "#6d97c3",
            clusterBkg: "#edf4ff",
            clusterBorder: "#6f9ac6",
            edgeLabelBackground: "#ffffff",
            fontFamily: "Aptos, Segoe UI, sans-serif"
          }
        });
      }

      function extractMermaidBlocks(rawText) {
        const blocks = [];
        // Match only proper fenced Mermaid blocks that start on their own line.
        // This avoids false positives like inline text containing ````mermaid`.
        const re = /(^|\r?\n)```mermaid[ \t]*\r?\n([\s\S]*?)\r?\n```(?=\r?\n|$)/gim;
        let match;
        while ((match = re.exec(rawText)) !== null) {
          const code = (match[2] || "").trim();
          if (code) blocks.push(code);
        }
        return blocks;
      }

      function addStatus(item, message) {
        const prev = item.querySelector(".diagram-status");
        if (prev) prev.remove();
        const pre = item.querySelector(".doc-pre");
        if (!pre) return;
        const msg = document.createElement("p");
        msg.className = "diagram-status";
        msg.textContent = message;
        item.insertBefore(msg, pre);
      }

      function renderItemDiagrams(item) {
        if (!mermaidAvailable) return;
        if (item.dataset.diagramRendered === "true") return;
        if (item.dataset.diagramRendering === "true") return;
        const nodes = Array.from(item.querySelectorAll(".diagram-gallery .mermaid"));
        if (!nodes.length) return;
        item.dataset.diagramRendering = "true";
        window.mermaid.run({ nodes })
          .then(() => {
            item.dataset.diagramRendered = "true";
          })
          .catch(() => {
            addStatus(item, "No se pudo renderizar Mermaid en este navegador. Puedes ver el codigo fuente del diagrama.");
            const pre = item.querySelector(".doc-pre");
            if (pre) pre.classList.remove("diagram-raw-hidden");
          })
          .finally(() => {
            item.dataset.diagramRendering = "false";
          });
      }

      function prepareArchitectureDiagrams() {
        const items = Array.from(document.querySelectorAll("details.doc-item"));
        items.forEach((item) => {
          const nameEl = item.querySelector(".doc-name");
          const pre = item.querySelector(".doc-pre");
          if (!nameEl || !pre) return;
          const docName = (nameEl.textContent || "").trim().toUpperCase();
          if (docName !== "ARCHITECTURE_DIAGRAMS.MD") return;

          const blocks = extractMermaidBlocks(pre.textContent || "");
          if (!blocks.length) return;

          const gallery = document.createElement("div");
          gallery.className = "diagram-gallery";

          blocks.forEach((code, idx) => {
            const card = document.createElement("article");
            card.className = "diagram-card";

            const title = document.createElement("div");
            title.className = "diagram-title";
            title.textContent = "Diagrama " + (idx + 1);

            const mer = document.createElement("div");
            mer.className = "mermaid diagram-mermaid";
            mer.textContent = code;

            card.appendChild(title);
            card.appendChild(mer);
            gallery.appendChild(card);
          });

          item.insertBefore(gallery, pre);

          if (mermaidAvailable) {
            pre.classList.add("diagram-raw-hidden");
            const toolbar = document.createElement("div");
            toolbar.className = "diagram-toolbar";
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "diagram-toggle-btn";

            const refreshLabel = () => {
              btn.textContent = pre.classList.contains("diagram-raw-hidden")
                ? "Ver codigo fuente (Markdown)"
                : "Ocultar codigo fuente";
            };

            btn.addEventListener("click", () => {
              pre.classList.toggle("diagram-raw-hidden");
              refreshLabel();
            });

            refreshLabel();
            toolbar.appendChild(btn);
            item.insertBefore(toolbar, pre);
          } else {
            addStatus(item, "Mermaid no esta disponible en este navegador. Se mantiene el markdown original.");
          }

          item.addEventListener("toggle", () => {
            if (item.open) renderItemDiagrams(item);
          });

          if (item.open) {
            renderItemDiagrams(item);
          }
        });
      }

      prepareArchitectureDiagrams();
    })();
