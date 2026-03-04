(function () {
      const body = document.body;
      const dashboardMode = body.classList.contains("dashboard-page");
      const themeStorageKey = "verify_docs_dashboard_theme";
      const baseTitle = document.title;
      const sections = Array.from(document.querySelectorAll("main section[id]"));
      const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
      const linkById = new Map(
        links.map((a) => [a.getAttribute("href").slice(1), a])
      );

      function readStoredTheme() {
        if (!dashboardMode) return "dark";
        try {
          return window.localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
        } catch (error) {
          return "dark";
        }
      }

      function writeStoredTheme(theme) {
        if (!dashboardMode) return;
        try {
          window.localStorage.setItem(themeStorageKey, theme);
        } catch (error) {
          // Ignore storage restrictions on local files.
        }
      }

      function applyDashboardTheme(theme) {
        if (!dashboardMode) return;
        const lightMode = theme === "light";
        body.classList.toggle("theme-light", lightMode);
        body.classList.toggle("theme-dark", !lightMode);
      }

      if (dashboardMode) {
        applyDashboardTheme(readStoredTheme());
      }

      function mountThemeToggle() {
        if (!dashboardMode) return;

        const host = document.querySelector(".spa-toolbar-actions") || document.querySelector(".hero");
        if (!host || host.querySelector(".dashboard-theme-toggle")) return;

        const toggle = document.createElement("label");
        toggle.className = "dashboard-theme-toggle";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "dashboard-theme-toggle-input";

        const track = document.createElement("span");
        track.className = "dashboard-theme-toggle-track";

        const thumb = document.createElement("span");
        thumb.className = "dashboard-theme-toggle-thumb";
        track.appendChild(thumb);

        const text = document.createElement("span");
        text.className = "dashboard-theme-toggle-text";

        toggle.appendChild(input);
        toggle.appendChild(track);
        toggle.appendChild(text);

        if (host.classList.contains("hero")) {
          toggle.classList.add("is-hero-toggle");
        }

        const syncLabel = () => {
          const lightMode = body.classList.contains("theme-light");
          input.checked = lightMode;
          text.textContent = lightMode ? "Claro" : "Oscuro";
          input.setAttribute("aria-label", "Cambiar entre modo claro y modo oscuro");
          toggle.setAttribute("title", lightMode ? "Modo claro activo" : "Modo oscuro activo");
        };

        input.addEventListener("change", () => {
          const nextTheme = input.checked ? "light" : "dark";
          applyDashboardTheme(nextTheme);
          writeStoredTheme(nextTheme);
          syncLabel();
          window.location.reload();
        });

        syncLabel();
        host.appendChild(toggle);
      }

      if (dashboardMode) {
        document.querySelectorAll(".reveal").forEach((el) => {
          el.classList.add("is-visible");
        });
      } else {
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
      }

      const mermaidAvailable = typeof window.mermaid !== "undefined";
      if (mermaidAvailable) {
        const dashboardLightTheme = dashboardMode && body.classList.contains("theme-light");
        const mermaidThemeVariables = dashboardMode
          ? (dashboardLightTheme
            ? {
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
            : {
                background: "#0b1531",
                primaryColor: "#162b56",
                primaryTextColor: "#eef4ff",
                primaryBorderColor: "#6f96d5",
                lineColor: "#7fa7eb",
                secondaryColor: "#193364",
                secondaryTextColor: "#eef4ff",
                secondaryBorderColor: "#79a1de",
                tertiaryColor: "#112342",
                tertiaryTextColor: "#eef4ff",
                tertiaryBorderColor: "#6f94cd",
                clusterBkg: "#102246",
                clusterBorder: "#698fc7",
                edgeLabelBackground: "#13274d",
                fontFamily: "Aptos, Segoe UI, sans-serif"
              })
          : {
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
            };

        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            nodeSpacing: 42,
            rankSpacing: 54
          },
          themeVariables: mermaidThemeVariables
        });
      }

      function extractMermaidBlocks(rawText) {
        const blocks = [];
        const lines = String(rawText || "").replace(/\r\n?/g, "\n").split("\n");
        let activeFence = null;
        let buffer = [];
        let lastHeading = "";
        let currentTitle = "";

        lines.forEach((line) => {
          const trimmed = line.trim();

          if (!activeFence) {
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
              lastHeading = headingMatch[2].trim();
              return;
            }

            if (/^```/i.test(trimmed)) {
              const lang = trimmed.slice(3).trim().toLowerCase();
              if (lang === "mermaid") {
                activeFence = "mermaid";
                buffer = [];
                currentTitle = lastHeading;
              } else {
                activeFence = "other";
              }
            }
            return;
          }

          if (/^```/.test(trimmed)) {
            if (activeFence === "mermaid") {
              const code = buffer.join("\n").trim();
              if (code) {
                blocks.push({
                  code,
                  title: currentTitle || ("Diagrama " + (blocks.length + 1))
                });
              }
            }
            activeFence = null;
            buffer = [];
            currentTitle = "";
            return;
          }

          if (activeFence === "mermaid") {
            buffer.push(line);
          }
        });

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
            addStatus(item, "No se pudo renderizar Mermaid en este navegador. Puedes ver el código fuente del diagrama.");
            const pre = item.querySelector(".doc-pre");
            if (pre) pre.classList.remove("diagram-raw-hidden");
          })
          .finally(() => {
            item.dataset.diagramRendering = "false";
          });
      }

      function prepareScrollableTables() {
        if (!dashboardMode) return;
        document.querySelectorAll(".spa-stage section table").forEach((table) => {
          if (table.closest(".table-scroll")) return;
          const wrapper = document.createElement("div");
          wrapper.className = "table-scroll";
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        });
      }

      function initDashboardNavigation() {
        if (!dashboardMode || !sections.length || !links.length) return;

        prepareScrollableTables();

        const orderedSections = sections.filter((section) => linkById.has(section.id));
        const orderedIds = orderedSections.map((section) => section.id);
        const activeTitle = document.querySelector("[data-spa-active-title]");
        const activeMeta = document.querySelector("[data-spa-active-meta]");
        const prevBtn = document.querySelector('[data-spa-nav="prev"]');
        const nextBtn = document.querySelector('[data-spa-nav="next"]');
        let currentIndex = 0;

        function getSectionTitle(section) {
          const heading = section.querySelector("h3");
          return heading ? heading.textContent.trim() : section.id;
        }

        function updateToolbar(section, index) {
          const title = getSectionTitle(section);
          const tables = section.querySelectorAll("table").length;
          const bullets = section.querySelectorAll("li").length;

          if (activeTitle) activeTitle.textContent = title;
          if (activeMeta) {
            activeMeta.textContent =
              "Vista " +
              (index + 1) +
              " de " +
              orderedSections.length +
              " · " +
              tables +
              " tablas · " +
              bullets +
              " puntos clave";
          }

          document.title = baseTitle + " · " + title;

          if (prevBtn) prevBtn.disabled = index === 0;
          if (nextBtn) nextBtn.disabled = index === orderedSections.length - 1;
        }

        function activateSection(id, syncHash) {
          const nextIndex = orderedIds.indexOf(id);
          if (nextIndex === -1) return;

          currentIndex = nextIndex;
          body.classList.add("spa-ready");

          orderedSections.forEach((section, index) => {
            const isActive = index === currentIndex;
            section.hidden = !isActive;
            section.classList.toggle("is-active-view", isActive);
            section.setAttribute("aria-hidden", isActive ? "false" : "true");
            if (isActive) {
              section.classList.add("is-visible");
              section.scrollTop = 0;
            }
          });

          links.forEach((link) => {
            const isActive = link.getAttribute("href").slice(1) === id;
            link.classList.toggle("active", isActive);
          });

          updateToolbar(orderedSections[currentIndex], currentIndex);

          if (syncHash) {
            const encodedHash = "#" + encodeURIComponent(id);
            if (window.location.hash !== encodedHash) {
              window.history.replaceState(null, "", encodedHash);
            }
          }
        }

        links.forEach((link) => {
          link.addEventListener("click", (event) => {
            const id = link.getAttribute("href").slice(1);
            if (!orderedIds.includes(id)) return;
            event.preventDefault();
            activateSection(id, true);
          });
        });

        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            if (currentIndex <= 0) return;
            activateSection(orderedIds[currentIndex - 1], true);
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            if (currentIndex >= orderedIds.length - 1) return;
            activateSection(orderedIds[currentIndex + 1], true);
          });
        }

        const requestedId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        const initialId = orderedIds.includes(requestedId) ? requestedId : orderedIds[0];
        activateSection(initialId, true);

        window.addEventListener("hashchange", () => {
          const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
          if (orderedIds.includes(hashId) && orderedIds[currentIndex] !== hashId) {
            activateSection(hashId, false);
          }
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

          blocks.forEach((block, idx) => {
            const card = document.createElement("article");
            card.className = "diagram-card";

            const title = document.createElement("div");
            title.className = "diagram-title";
            title.textContent = block.title || ("Diagrama " + (idx + 1));

            const mer = document.createElement("div");
            mer.className = "mermaid diagram-mermaid";
            mer.textContent = block.code;

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
                ? "Ver código fuente (Markdown)"
                : "Ocultar código fuente";
            };

            btn.addEventListener("click", () => {
              pre.classList.toggle("diagram-raw-hidden");
              refreshLabel();
            });

            refreshLabel();
            toolbar.appendChild(btn);
            item.insertBefore(toolbar, pre);
          } else {
            addStatus(item, "Mermaid no está disponible en este navegador. Se mantiene el markdown original.");
          }

          item.addEventListener("toggle", () => {
            if (item.open) renderItemDiagrams(item);
          });

          if (item.open) {
            renderItemDiagrams(item);
          }
        });
      }

      mountThemeToggle();
      initDashboardNavigation();
      prepareArchitectureDiagrams();
    })();
