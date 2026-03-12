(function () {
      const body = document.body;
      const dashboardMode = body.classList.contains("dashboard-page");
      const spaMode = dashboardMode && body.dataset.dashboardSpa !== "false";
      const diagramWorkspaceMode = body.classList.contains("diagram-workspace-page");
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

      if (spaMode || diagramWorkspaceMode) {
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
          maxTextSize: 2000000,
          maxEdges: 5000,
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
            scheduleDiagramWorkspaceFit(item);
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

      function normalizeWorkspaceSvg(svg) {
        if (!svg) return;
        try {
          const root = svg.querySelector(".root") || svg;
          if (!root) return;

          let width = 0;
          let height = 0;
          let offsetX = 0;
          let offsetY = 0;

          if (typeof root.getBBox === "function") {
            const bbox = root.getBBox();
            if (bbox && bbox.width && bbox.height) {
              width = bbox.width;
              height = bbox.height;
              offsetX = bbox.x;
              offsetY = bbox.y;
            }
          }

          if (!width || !height) {
            const viewBox = svg.viewBox && svg.viewBox.baseVal
              ? svg.viewBox.baseVal
              : null;
            const attrWidth = parseFloat(svg.getAttribute("width")) || 0;
            const attrHeight = parseFloat(svg.getAttribute("height")) || 0;
            if ((viewBox && viewBox.width && viewBox.height) || (attrWidth && attrHeight)) {
              width = viewBox ? viewBox.width : attrWidth;
              height = viewBox ? viewBox.height : attrHeight;
              offsetX = viewBox ? viewBox.x : 0;
              offsetY = viewBox ? viewBox.y : 0;
            }
          }

          if (!width || !height) {
            const svgRect = typeof svg.getBoundingClientRect === "function"
              ? svg.getBoundingClientRect()
              : null;
            const rootRect = typeof root.getBoundingClientRect === "function"
              ? root.getBoundingClientRect()
              : null;
            width = rootRect && rootRect.width ? rootRect.width : 0;
            height = rootRect && rootRect.height ? rootRect.height : 0;
            offsetX = rootRect && svgRect ? (rootRect.left - svgRect.left) : 0;
            offsetY = rootRect && svgRect ? (rootRect.top - svgRect.top) : 0;
          }

          if (!width || !height) return;

          const padding = Math.max(Math.round(Math.min(width, height) * 0.02), 24);
          const frameWidth = Math.ceil(width + padding * 2);
          const frameHeight = Math.ceil(height + padding * 2);
          const baseTransform = svg.dataset.workspaceBaseTransform != null
            ? svg.dataset.workspaceBaseTransform
            : (root.getAttribute("transform") || "");

          svg.dataset.workspaceBaseTransform = baseTransform;
          root.setAttribute(
            "transform",
            ("translate(" +
              Math.round(padding - offsetX) +
              " " +
              Math.round(padding - offsetY) +
              ") " +
              baseTransform).trim()
          );
          svg.setAttribute("viewBox", "0 0 " + frameWidth + " " + frameHeight);
          svg.setAttribute("width", String(frameWidth));
          svg.setAttribute("height", String(frameHeight));
          svg.style.maxWidth = "none";
          svg.style.maxHeight = "none";
          svg.style.overflow = "visible";
          svg.dataset.workspaceNormalized = "true";
        } catch (error) {
          // Ignore SVGs that do not expose a stable bounding box yet.
        }
      }

      function getDiagramSvgMetrics(svg) {
        if (!svg) return null;
        normalizeWorkspaceSvg(svg);
        const viewBox = svg.viewBox && svg.viewBox.baseVal
          ? svg.viewBox.baseVal
          : null;
        const width =
          parseFloat(svg.getAttribute("width")) ||
          (viewBox ? viewBox.width : 0) ||
          svg.getBoundingClientRect().width;
        const height =
          parseFloat(svg.getAttribute("height")) ||
          (viewBox ? viewBox.height : 0) ||
          svg.getBoundingClientRect().height;
        if (!width || !height) return null;
        return { width, height };
      }

      function updateWorkspaceScale(card, nextScale) {
        if (!diagramWorkspaceMode) return;
        const svg = card.querySelector(".diagram-mermaid svg");
        if (!svg) return;
        const metrics = getDiagramSvgMetrics(svg);
        if (!metrics) return;
        const scale = Math.max(0.02, Math.min(2.6, nextScale));
        card.dataset.diagramScale = scale.toFixed(2);
        svg.style.transform = "none";
        svg.style.width = (metrics.width * scale).toFixed(2) + "px";
        svg.style.height = (metrics.height * scale).toFixed(2) + "px";
        const readout = card.querySelector(".diagram-scale-readout");
        if (readout) {
          readout.textContent = Math.round(scale * 100) + "%";
        }
      }

      function setWorkspaceScale(card, nextScale) {
        const viewport = card.querySelector(".diagram-stage-scroll");
        const svg = card.querySelector(".diagram-mermaid svg");
        if (!viewport || !svg) return;
        const currentScale = parseFloat(card.dataset.diagramScale || "1") || 1;
        const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
        const centerY = viewport.scrollTop + viewport.clientHeight / 2;
        const relX = centerX / currentScale;
        const relY = centerY / currentScale;
        updateWorkspaceScale(card, nextScale);
        const appliedScale = parseFloat(card.dataset.diagramScale || "1") || 1;
        window.requestAnimationFrame(() => {
          viewport.scrollLeft = Math.max(relX * appliedScale - viewport.clientWidth / 2, 0);
          viewport.scrollTop = Math.max(relY * appliedScale - viewport.clientHeight / 2, 0);
        });
      }

      function getWorkspaceAutoScale(metrics, viewport) {
        if (!metrics || !viewport) return 1;
        const viewportWidth = viewport.clientWidth || Math.round(viewport.getBoundingClientRect().width) || 0;
        const viewportHeight = viewport.clientHeight || Math.round(viewport.getBoundingClientRect().height) || 0;
        const availableWidth = Math.max(viewportWidth - 40, 1);
        const availableHeight = Math.max(viewportHeight - 40, 1);
        if (!availableWidth || !availableHeight) return 1;
        return Math.max(
          0.02,
          Math.min(
            availableWidth / Math.max(metrics.width, 1),
            availableHeight / Math.max(metrics.height, 1),
            1
          )
        );
      }

      function getWorkspacePreferredScale(metrics, viewport) {
        const fitScale = getWorkspaceAutoScale(metrics, viewport);
        if (fitScale >= 0.72) return fitScale;
        const viewportWidth = viewport.clientWidth || Math.round(viewport.getBoundingClientRect().width) || 0;
        const widthReadableScale = viewportWidth
          ? Math.min(Math.max((viewportWidth - 140) / Math.max(metrics.width, 1), fitScale), 1)
          : fitScale;
        return Math.max(
          fitScale,
          Math.min(
            0.72,
            Math.max(widthReadableScale, 0.54)
          )
        );
      }

      function alignWorkspaceViewport(card, metrics, appliedScale, viewportWidth) {
        const viewport = card.querySelector(".diagram-stage-scroll");
        if (!viewport) return;
        const scaledWidth = metrics.width * appliedScale;
        viewport.scrollLeft = scaledWidth > viewportWidth
          ? Math.max((scaledWidth - viewportWidth) / 2, 0)
          : 0;
        viewport.scrollTop = 0;
      }

      function fitWorkspaceDiagram(card) {
        const viewport = card.querySelector(".diagram-stage-scroll");
        const svg = card.querySelector(".diagram-mermaid svg");
        const metrics = getDiagramSvgMetrics(svg);
        if (!viewport || !metrics) return false;
        const viewportWidth = viewport.clientWidth || Math.round(viewport.getBoundingClientRect().width) || 0;
        const viewportHeight = viewport.clientHeight || Math.round(viewport.getBoundingClientRect().height) || 0;
        if (!viewportWidth || !viewportHeight) return false;
        const nextScale = getWorkspaceAutoScale(metrics, viewport);
        updateWorkspaceScale(card, nextScale);
        window.requestAnimationFrame(() => {
          const appliedScale = parseFloat(card.dataset.diagramScale || "1") || 1;
          alignWorkspaceViewport(card, metrics, appliedScale, viewportWidth);
        });
        return true;
      }

      function setPreferredWorkspaceDiagram(card) {
        const viewport = card.querySelector(".diagram-stage-scroll");
        const svg = card.querySelector(".diagram-mermaid svg");
        const metrics = getDiagramSvgMetrics(svg);
        if (!viewport || !metrics) return false;
        const viewportWidth = viewport.clientWidth || Math.round(viewport.getBoundingClientRect().width) || 0;
        const viewportHeight = viewport.clientHeight || Math.round(viewport.getBoundingClientRect().height) || 0;
        if (!viewportWidth || !viewportHeight) return false;
        const nextScale = getWorkspacePreferredScale(metrics, viewport);
        updateWorkspaceScale(card, nextScale);
        window.requestAnimationFrame(() => {
          const appliedScale = parseFloat(card.dataset.diagramScale || "1") || 1;
          alignWorkspaceViewport(card, metrics, appliedScale, viewportWidth);
        });
        return true;
      }

      function mountWorkspacePan(viewport) {
        if (!diagramWorkspaceMode || !viewport || viewport.dataset.dragPanReady === "true") return;
        viewport.dataset.dragPanReady = "true";
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        const endDrag = () => {
          pointerId = null;
          viewport.classList.remove("is-dragging");
        };

        viewport.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          if (event.target.closest("button, a, summary")) return;
          pointerId = event.pointerId;
          startX = event.clientX;
          startY = event.clientY;
          startLeft = viewport.scrollLeft;
          startTop = viewport.scrollTop;
          viewport.classList.add("is-dragging");
          if (viewport.setPointerCapture) {
            viewport.setPointerCapture(event.pointerId);
          }
        });

        viewport.addEventListener("pointermove", (event) => {
          if (pointerId !== event.pointerId) return;
          viewport.scrollLeft = startLeft - (event.clientX - startX);
          viewport.scrollTop = startTop - (event.clientY - startY);
        });

        viewport.addEventListener("pointerup", endDrag);
        viewport.addEventListener("pointercancel", endDrag);
        viewport.addEventListener("mouseleave", (event) => {
          if (!(event.buttons & 1)) endDrag();
        });
      }

      function syncWorkspaceSourceButton(card, pre) {
        const sourceBtn = card.querySelector('[data-diagram-action="toggle-source"]');
        if (!sourceBtn || !pre) return;
        const hidden = pre.classList.contains("diagram-raw-hidden");
        sourceBtn.classList.toggle("is-active", !hidden);
        sourceBtn.textContent = hidden ? "MD" : "TXT";
        const label = hidden
          ? "Mostrar markdown original"
          : "Ocultar markdown original";
        sourceBtn.setAttribute("title", label);
        sourceBtn.setAttribute("aria-label", label);
      }

      function createWorkspaceToolButton(label, title, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "diagram-tool-btn";
        button.dataset.diagramAction = action;
        button.textContent = label;
        button.setAttribute("title", title);
        button.setAttribute("aria-label", title);
        return button;
      }

      function mountDiagramWorkspace(card, pre) {
        if (!diagramWorkspaceMode || card.dataset.workspaceMounted === "true") return;
        const title = card.querySelector(".diagram-title");
        const mer = card.querySelector(".diagram-mermaid");
        if (!title || !mer) return;

        const workspace = document.createElement("div");
        workspace.className = "diagram-workspace";

        const toolrail = document.createElement("aside");
        toolrail.className = "diagram-toolrail";

        const zoomInBtn = createWorkspaceToolButton("+", "Acercar diagrama", "zoom-in");
        const zoomOutBtn = createWorkspaceToolButton("-", "Alejar diagrama", "zoom-out");
        const fitBtn = createWorkspaceToolButton("Fit", "Ajustar al recuadro", "fit");
        const resetBtn = createWorkspaceToolButton("1:1", "Escala real del diagrama", "reset");
        const sourceBtn = createWorkspaceToolButton("MD", "Mostrar markdown original", "toggle-source");
        sourceBtn.classList.add("is-code-btn");

        const readout = document.createElement("div");
        readout.className = "diagram-scale-readout";
        readout.textContent = "100%";

        const stage = document.createElement("div");
        stage.className = "diagram-stage";

        const viewport = document.createElement("div");
        viewport.className = "diagram-stage-scroll";

        const canvas = document.createElement("div");
        canvas.className = "diagram-canvas";

        canvas.appendChild(mer);
        viewport.appendChild(canvas);
        stage.appendChild(viewport);

        toolrail.appendChild(zoomInBtn);
        toolrail.appendChild(zoomOutBtn);
        toolrail.appendChild(fitBtn);
        toolrail.appendChild(resetBtn);
        toolrail.appendChild(readout);
        toolrail.appendChild(sourceBtn);

        workspace.appendChild(toolrail);
        workspace.appendChild(stage);

        card.appendChild(title);
        card.appendChild(workspace);
        card.dataset.workspaceMounted = "true";
        card.dataset.diagramScale = "1";
        card.dataset.diagramPendingFit = "true";
        card.dataset.diagramViewMode = "readable";

        zoomInBtn.addEventListener("click", () => {
          const currentScale = parseFloat(card.dataset.diagramScale || "1") || 1;
          card.dataset.diagramViewMode = "manual";
          setWorkspaceScale(card, currentScale * 1.18);
        });

        zoomOutBtn.addEventListener("click", () => {
          const currentScale = parseFloat(card.dataset.diagramScale || "1") || 1;
          card.dataset.diagramViewMode = "manual";
          setWorkspaceScale(card, currentScale / 1.18);
        });

        fitBtn.addEventListener("click", () => {
          card.dataset.diagramViewMode = "fit";
          const fitted = fitWorkspaceDiagram(card);
          card.dataset.diagramFitted = fitted ? "true" : "false";
          card.dataset.diagramPendingFit = fitted ? "false" : "true";
        });

        resetBtn.addEventListener("click", () => {
          card.dataset.diagramViewMode = "manual";
          updateWorkspaceScale(card, 1);
          card.dataset.diagramFitted = "false";
          card.dataset.diagramPendingFit = "false";
          window.requestAnimationFrame(() => {
            viewport.scrollLeft = 0;
            viewport.scrollTop = 0;
          });
        });

        sourceBtn.addEventListener("click", () => {
          pre.classList.toggle("diagram-raw-hidden");
          syncWorkspaceSourceButton(card, pre);
        });

        syncWorkspaceSourceButton(card, pre);
        mountWorkspacePan(viewport);

        if (typeof window.ResizeObserver === "function") {
          const fitObserver = new ResizeObserver(() => {
            if (
              card.dataset.diagramPendingFit !== "true" &&
              card.dataset.diagramFitted === "true" &&
              (card.dataset.diagramViewMode || "readable") === "manual"
            ) return;
            const viewMode = card.dataset.diagramViewMode || "readable";
            const fitted = viewMode === "fit"
              ? fitWorkspaceDiagram(card)
              : setPreferredWorkspaceDiagram(card);
            if (fitted) {
              card.dataset.diagramFitted = "true";
              card.dataset.diagramPendingFit = "false";
            }
          });
          fitObserver.observe(viewport);
        }
      }

      function syncDiagramWorkspaces(root, options) {
        if (!diagramWorkspaceMode || !root) return;
        const settings = options || {};
        Array.from(root.querySelectorAll(".diagram-card[data-workspace-mounted='true']")).forEach((card) => {
          const svg = card.querySelector(".diagram-mermaid svg");
          if (!svg) return;
          svg.style.transformOrigin = "top left";
          const viewMode = settings.forceFit
            ? "fit"
            : settings.forcePreferred
              ? "readable"
              : (card.dataset.diagramViewMode || "readable");
          if (viewMode === "manual" && !settings.forceFit && !settings.forcePreferred) {
            updateWorkspaceScale(card, parseFloat(card.dataset.diagramScale || "1") || 1);
            return;
          }
          if (settings.forceFit || settings.forcePreferred || card.dataset.diagramFitted !== "true" || card.dataset.diagramPendingFit === "true") {
            card.dataset.diagramPendingFit = "true";
            card.dataset.diagramViewMode = viewMode;
            const fitted = viewMode === "fit"
              ? fitWorkspaceDiagram(card)
              : setPreferredWorkspaceDiagram(card);
            card.dataset.diagramFitted = fitted ? "true" : "false";
            card.dataset.diagramPendingFit = fitted ? "false" : "true";
          } else {
            updateWorkspaceScale(card, parseFloat(card.dataset.diagramScale || "1") || 1);
          }
        });
      }

      function scheduleDiagramWorkspaceFit(root) {
        if (!diagramWorkspaceMode || !root) return;
        const runFit = () => syncDiagramWorkspaces(root, { forcePreferred: true });
        Array.from(root.querySelectorAll(".diagram-card[data-workspace-mounted='true']")).forEach((card) => {
          card.dataset.diagramPendingFit = "true";
          if ((card.dataset.diagramViewMode || "readable") !== "manual") {
            card.dataset.diagramViewMode = "readable";
          }
        });
        window.requestAnimationFrame(runFit);
        window.setTimeout(runFit, 80);
        window.setTimeout(runFit, 220);
      }

      function getDiagramWorkspaceScrollTarget(section) {
        if (!section) return null;
        return (
          section.querySelector(".diagram-workspace-nav") ||
          section.querySelector(".diagram-workspace") ||
          section.querySelector("details.doc-item[open] summary") ||
          section.querySelector("details.doc-item") ||
          section
        );
      }

      function scrollDiagramSectionIntoView(section, behavior) {
        const target = getDiagramWorkspaceScrollTarget(section);
        if (!target) return;
        const topOffset = target.classList.contains("diagram-workspace") ? 12 : 14;
        const targetTop = Math.max(target.getBoundingClientRect().top + window.scrollY - topOffset, 0);
        window.scrollTo({ top: targetTop, behavior: behavior || "auto" });
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
        if (!spaMode || !sections.length || !links.length) return;

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
        const hasRequestedId = orderedIds.includes(requestedId);
        const initialId = hasRequestedId ? requestedId : orderedIds[0];
        activateSection(initialId, !hasRequestedId);

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
          const forceRender = item.dataset.renderDiagrams === "true";
          if (!pre) return;
          const docName = nameEl ? (nameEl.textContent || "").trim().toUpperCase() : "";
          if (!forceRender && docName !== "ARCHITECTURE_DIAGRAMS.MD") return;

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
            mountDiagramWorkspace(card, pre);
            gallery.appendChild(card);
          });

          item.insertBefore(gallery, pre);

          if (mermaidAvailable) {
            pre.classList.add("diagram-raw-hidden");
            if (diagramWorkspaceMode) {
              Array.from(gallery.querySelectorAll(".diagram-card")).forEach((card) => {
                syncWorkspaceSourceButton(card, pre);
              });
            }
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

      function openDetailFromHash() {
        const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        if (!hashId) return;
        const target = document.getElementById(hashId);
        if (!target) return;
        const detail = target.matches("details.doc-item")
          ? target
          : target.querySelector("details.doc-item");
        if (detail && !detail.open) {
          detail.open = true;
        }
      }

      function initDiagramWorkspacePage() {
        if (!diagramWorkspaceMode || !sections.length || !links.length) return;

        const nav = document.querySelector(".toc");
        if (!nav) return;

        const orderedSections = sections.filter((section) => linkById.has(section.id));
        const orderedIds = orderedSections.map((section) => section.id);
        if (!orderedIds.length) return;
        let currentIndex = 0;
        let settleScrollTimer = 0;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "diagram-index-toggle";
        nav.insertBefore(toggle, nav.firstChild);

        const setNavOpen = (open) => {
          nav.classList.toggle("is-open", open);
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        };

        const updateToggleLabel = (id) => {
          const link = linkById.get(id);
          const label = link ? link.textContent.trim() : "Indice de Diagramas";
          const position = orderedIds.indexOf(id) + 1;
          toggle.innerHTML =
            '<span class="diagram-index-toggle-label">Indice</span>' +
            "<strong>" +
            position +
            "/" +
            orderedIds.length +
            " · " +
            label +
            "</strong>";
        };

        const mountSectionNavigator = (section, index) => {
          const detail = section.querySelector("details.doc-item");
          if (!detail || detail.querySelector(".diagram-workspace-nav")) return;
          const gallery = detail.querySelector(".diagram-gallery");
          const rawDoc = detail.querySelector(".doc-pre");
          const insertionPoint = gallery || rawDoc;
          if (!insertionPoint) return;

          const navBar = document.createElement("div");
          navBar.className = "diagram-workspace-nav";

          const indexBtn = document.createElement("button");
          indexBtn.type = "button";
          indexBtn.className = "diagram-workspace-nav-btn is-primary";
          indexBtn.textContent = "Indice";
          indexBtn.addEventListener("click", () => {
            setNavOpen(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            window.requestAnimationFrame(() => toggle.focus());
          });

          const prevBtn = document.createElement("button");
          prevBtn.type = "button";
          prevBtn.className = "diagram-workspace-nav-btn";
          prevBtn.textContent = "Anterior";
          prevBtn.disabled = index === 0;
          prevBtn.addEventListener("click", () => {
            if (index <= 0) return;
            activateSection(orderedIds[index - 1], true);
          });

          const nextBtn = document.createElement("button");
          nextBtn.type = "button";
          nextBtn.className = "diagram-workspace-nav-btn";
          nextBtn.textContent = "Siguiente";
          nextBtn.disabled = index === orderedIds.length - 1;
          nextBtn.addEventListener("click", () => {
            if (index >= orderedIds.length - 1) return;
            activateSection(orderedIds[index + 1], true);
          });

          const state = document.createElement("span");
          state.className = "diagram-workspace-nav-state";
          state.textContent = (index + 1) + " de " + orderedIds.length;

          navBar.appendChild(indexBtn);
          navBar.appendChild(prevBtn);
          navBar.appendChild(nextBtn);
          navBar.appendChild(state);
          detail.insertBefore(navBar, insertionPoint);
        };

        orderedSections.forEach((section, index) => {
          mountSectionNavigator(section, index);
        });

        const activateSection = (id, syncHash) => {
          if (!orderedIds.includes(id)) return;
          currentIndex = orderedIds.indexOf(id);

          orderedSections.forEach((section) => {
            const isActive = section.id === id;
            section.hidden = !isActive;
            section.classList.toggle("is-active-diagram-view", isActive);
            section.setAttribute("aria-hidden", isActive ? "false" : "true");
            if (isActive) {
              section.classList.add("is-visible");
            }
          });

          links.forEach((link) => {
            const isActive = link.getAttribute("href").slice(1) === id;
            link.classList.toggle("active", isActive);
          });

          const activeSection = document.getElementById(id);
          if (activeSection) {
            const detail = activeSection.querySelector("details.doc-item");
            if (detail && !detail.open) {
              detail.open = true;
            }
            updateToggleLabel(id);
            const navState = activeSection.querySelector(".diagram-workspace-nav-state");
            if (navState) {
              navState.textContent = (currentIndex + 1) + " de " + orderedIds.length;
            }
            document.title = baseTitle + " · " + (activeSection.querySelector("h3")?.textContent.trim() || id);
            scheduleDiagramWorkspaceFit(activeSection);
            window.requestAnimationFrame(() => {
              const scrollBehavior = syncHash ? "smooth" : "auto";
              scrollDiagramSectionIntoView(activeSection, scrollBehavior);
              window.clearTimeout(settleScrollTimer);
              settleScrollTimer = window.setTimeout(() => {
                scrollDiagramSectionIntoView(activeSection, "auto");
              }, scrollBehavior === "smooth" ? 260 : 120);
            });
          }

          if (syncHash) {
            const encodedHash = "#" + encodeURIComponent(id);
            if (window.location.hash !== encodedHash) {
              window.history.replaceState(null, "", encodedHash);
            }
          }

          setNavOpen(false);
        };

        toggle.addEventListener("click", () => {
          setNavOpen(!nav.classList.contains("is-open"));
        });

        document.addEventListener("click", (event) => {
          if (!nav.classList.contains("is-open")) return;
          if (nav.contains(event.target)) return;
          setNavOpen(false);
        });

        links.forEach((link) => {
          link.addEventListener("click", (event) => {
            const id = link.getAttribute("href").slice(1);
            if (!orderedIds.includes(id)) return;
            event.preventDefault();
            activateSection(id, true);
          });
        });

        const requestedId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        const initialId = orderedIds.includes(requestedId) ? requestedId : orderedIds[0];
        activateSection(initialId, true);

        window.addEventListener("hashchange", () => {
          const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
          if (orderedIds.includes(hashId)) {
            activateSection(hashId, false);
          }
        });

        window.addEventListener("resize", () => {
          const activeSection = orderedSections.find((section) => !section.hidden);
          if (activeSection) {
            scheduleDiagramWorkspaceFit(activeSection);
          }
        });

        window.addEventListener("load", () => {
          const activeSection = orderedSections.find((section) => !section.hidden);
          if (!activeSection) return;
          scheduleDiagramWorkspaceFit(activeSection);
          scrollDiagramSectionIntoView(activeSection, "auto");
        });
      }

      mountThemeToggle();
      initDashboardNavigation();
      prepareArchitectureDiagrams();
      openDetailFromHash();
      initDiagramWorkspacePage();
      window.addEventListener("hashchange", openDetailFromHash);
    })();
