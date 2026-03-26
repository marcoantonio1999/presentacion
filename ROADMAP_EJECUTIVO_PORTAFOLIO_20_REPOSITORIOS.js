(function () {
  const data = window.__ROADMAP_EXEC_DATA__;
  if (!data) {
    throw new Error("No se encontró ROADMAP_EXEC_DATA");
  }

  const state = {
    stack: "Todos",
    theme: "Todos",
    sprint: "Todos",
    valueStream: "Todos",
    repo: "Todos",
    search: "",
    criticalOnly: false,
    sidebarCollapsed: true,
  };

  const storageKeys = {
    sidebarCollapsed: "roadmap-exec-sidebar-collapsed",
  };

  const stackOrder = data.filters.stacks;
  const themeOrder = data.priorities.order;
  const sprintOrder = data.sprints.map((item) => item.id);
  const sprintMeta = new Map(data.sprints.map((item) => [item.id, item]));
  const themeColors = data.priorities.colors;
  const valueStreamOrder = data.filters.value_streams || (data.value_stream_summaries || []).map((item) => item.name);
  const dimensionOrder = ["Arquitectura", "Testing", "Seguridad", "DevOps", "Dependencias", "Trazabilidad"];
  const dimensionCatalog = new Map((data.dimension_catalog || []).map((item) => [item.dimension, item]));
  const trackingActions = data.tracking?.actions || [];
  const dimensionColors = {
    Arquitectura: "#84cc16",
    Testing: "#14b8a6",
    Seguridad: "#10b981",
    DevOps: "#38bdf8",
    Dependencias: "#f97316",
    Trazabilidad: "#22d3ee",
  };
  const dimensionDescriptions = {
    Arquitectura: dimensionCatalog.get("Arquitectura")?.benefits || "Modularidad, deuda estructural, rendimiento y decisiones de diseño que sostienen los VSS más pesados.",
    Testing: dimensionCatalog.get("Testing")?.benefits || "Cobertura, regresión y automatización para mover VSS sin perder control operativo.",
    Seguridad: dimensionCatalog.get("Seguridad")?.benefits || "Secretos, autenticación, transporte, hardcodes y reducción de superficie explotable.",
    DevOps: dimensionCatalog.get("DevOps")?.benefits || "CI/CD, quality gates, empaquetado y flujo de entrega para ejecutar el backlog con continuidad.",
    Dependencias: dimensionCatalog.get("Dependencias")?.benefits || "Versiones EOL, librerías legacy y riesgo acumulado por actualización pendiente.",
    Trazabilidad: dimensionCatalog.get("Trazabilidad")?.benefits || "Documentación, observabilidad y evidencia operativa para seguir cada VSS de punta a punta.",
  };
  const dimensionEvaluates = {
    Arquitectura: "Código, arquitectura y acoplamientos que sostienen el flujo.",
    Testing: "Cobertura, regresión y validación automática de cambios.",
    Seguridad: "Exposición accidental, accesos, secretos y cadena de confianza.",
    DevOps: "Pipeline, enforcement, release y controles de entrega.",
    Dependencias: "Librerías EOL, vulnerabilidades y deuda de actualización.",
    Trazabilidad: "Logs, evidencia, documentación y seguimiento end-to-end.",
  };
  const controlPrinciples = [
    {
      title: "Prevención antes que reacción",
      text: "El plan prioriza controles preventivos por sprint para que los hallazgos no se conviertan en incidente operativo.",
      accent: "#38bdf8",
    },
    {
      title: "Cero exposición accidental",
      text: "La lectura ejecutiva se centra en credenciales, configuración, transporte y evidencia que hoy podrían filtrarse o quedar expuestos.",
      accent: "#10b981",
    },
    {
      title: "Seguridad de la cadena",
      text: "No basta con un fix de código: el control debe cubrir VSS, pipeline, despliegue, trazabilidad y validación continua.",
      accent: "#f97316",
    },
    {
      title: "Tendencia a cero vulnerabilidad",
      text: "La meta no se vende como hecho consumado; se presenta como evolución observable desde el estado actual hasta un modelo controlado.",
      accent: "#84cc16",
    },
  ];

  const elements = {
    heroPanel: document.getElementById("hero-panel"),
    stack: document.getElementById("filter-stack"),
    theme: document.getElementById("filter-theme"),
    sprint: document.getElementById("filter-sprint"),
    vss: document.getElementById("filter-vss"),
    repo: document.getElementById("filter-repo"),
    search: document.getElementById("filter-search"),
    critical: document.getElementById("filter-critical"),
    reset: document.getElementById("filter-reset"),
    print: document.getElementById("print-roadmap"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    sidebarHandle: document.getElementById("sidebar-handle"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    kpis: document.getElementById("kpi-grid"),
    principleGrid: document.getElementById("principle-grid"),
    observationalNote: document.getElementById("observational-note"),
    observationalGrid: document.getElementById("observational-grid"),
    ladder: document.getElementById("priority-ladder"),
    dimensionMatrixBody: document.getElementById("dimension-matrix-body"),
    dimensionGrid: document.getElementById("dimension-grid"),
    gapGrid: document.getElementById("gap-grid"),
    maturityNote: document.getElementById("maturity-note"),
    maturityGrid: document.getElementById("maturity-grid"),
    trackingNote: document.getElementById("tracking-note"),
    trackingKpis: document.getElementById("tracking-kpi-grid"),
    trackingSprints: document.getElementById("tracking-sprint-grid"),
    trackingRepos: document.getElementById("tracking-repo-grid"),
    generalGanttIntro: document.getElementById("general-gantt-intro"),
    generalGantt: document.getElementById("general-gantt-board"),
    vssOverviewNote: document.getElementById("vss-overview-note"),
    vssOverview: document.getElementById("vss-overview-board"),
    vssDetail: document.getElementById("vss-detail-grid"),
    legend: document.getElementById("gantt-legend"),
    gantt: document.getElementById("gantt-board"),
    coverageChart: document.getElementById("coverage-chart"),
    coverageSummary: document.getElementById("coverage-summary"),
    themeInsights: document.getElementById("theme-insights"),
    streamInsights: document.getElementById("value-stream-insights"),
    stackGrid: document.getElementById("stack-grid"),
    detailCount: document.getElementById("detail-count"),
    detailBody: document.getElementById("detail-body"),
    copySummary: document.getElementById("copy-summary"),
    sourceGrid: document.getElementById("source-grid"),
  };

  function loadUiState() {
    try {
      const stored = window.localStorage.getItem(storageKeys.sidebarCollapsed);
      if (stored !== null) {
        state.sidebarCollapsed = stored === "true";
      }
    } catch (error) {
      state.sidebarCollapsed = true;
    }
  }

  function persistSidebarState() {
    try {
      window.localStorage.setItem(storageKeys.sidebarCollapsed, String(state.sidebarCollapsed));
    } catch (error) {
      // Ignorar almacenamiento no disponible.
    }
  }

  function applySidebarState() {
    document.body.classList.toggle("roadmap-sidebar-collapsed", state.sidebarCollapsed);
    const expanded = String(!state.sidebarCollapsed);
    const buttonLabel = state.sidebarCollapsed ? "Mostrar panel" : "Ocultar panel";
    const handleLabel = state.sidebarCollapsed ? "Panel" : "Cerrar";

    if (elements.sidebarToggle) {
      elements.sidebarToggle.textContent = buttonLabel;
      elements.sidebarToggle.setAttribute("aria-expanded", expanded);
      elements.sidebarToggle.setAttribute("title", buttonLabel);
    }
    if (elements.sidebarHandle) {
      const label = elements.sidebarHandle.querySelector(".handle-label");
      if (label) label.textContent = handleLabel;
      elements.sidebarHandle.setAttribute("aria-expanded", expanded);
      elements.sidebarHandle.setAttribute("title", buttonLabel);
    }
    persistSidebarState();
  }

  function toggleSidebar(forceCollapsed) {
    if (typeof forceCollapsed === "boolean") {
      state.sidebarCollapsed = forceCollapsed;
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }
    applySidebarState();
  }

  const sectionDescriptions = {
    "Pruebas unitarias": "Frente ya iniciado esta semana: baseline de cobertura, refuerzo de tests críticos y estabilización de regresión.",
    Seguridad: "Credenciales, CVEs, secretos, autenticación, HTTPS, hardcodes y blindaje de datos.",
    Rendimiento: "Tiempo de respuesta, bundles, lazy loading, escalabilidad y experiencia de reproducción.",
    Observabilidad: "Logging, métricas, alertas, trazabilidad operacional y visibilidad de incidentes.",
    "Calidad/Arquitectura": "Deuda técnica, mantenimiento, refactor, obsolescencia, modularidad y calidad estructural.",
    "Operación/Otras": "CI/CD, despliegue, soporte, continuidad operativa y remediaciones transversales restantes.",
  };

  function normalizeDimensionName(value) {
    const text = normalizeText(value);
    if (text === "arquitectura") return "Arquitectura";
    if (text === "testing") return "Testing";
    if (text === "seguridad") return "Seguridad";
    if (text === "devops") return "DevOps";
    if (text === "dependencias") return "Dependencias";
    if (text === "trazabilidad") return "Trazabilidad";
    return "";
  }

  function classifyDimension(record) {
    const directDimension = normalizeDimensionName(record.dimension);
    if (directDimension) return directDimension;
    const stream = normalizeText(record.value_stream_group);
    if (stream === "dependencias") return "Dependencias";
    if (stream === "cobertura" || stream === "tests" || record.priority_theme === "Pruebas unitarias") return "Testing";
    if (record.priority_theme === "Seguridad") return "Seguridad";
    if (stream === "ci_cd" || record.priority_theme === "Operación/Otras") return "DevOps";
    if (stream === "documentacion" || record.priority_theme === "Observabilidad") return "Trazabilidad";
    return "Arquitectura";
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasEvidence(refs) {
    return Array.isArray(refs) && refs.length > 0;
  }

  function hasCombinedEvidence(record) {
    return hasEvidence(record.vss_refs) && hasEvidence(record.phase2_refs);
  }

  function isExposureRecord(record) {
    const haystack = normalizeText(
      [
        record.pain_point,
        record.problem_description,
        record.current_state,
        record.target_state,
        record.risk_category_raw,
      ].join(" ")
    );
    return /(expos|credencial|secret|token|hardcod|http|tls|ssl|cert|dns|config)/.test(haystack);
  }

  function getControlProfile(items) {
    const total = items.length || 1;
    const criticalCount = items.filter((record) => record.business_criticality_rank >= 3).length;
    const reviewCount = items.filter((record) => record.needs_review).length;
    const evidenceCount = items.filter((record) => hasCombinedEvidence(record)).length;
    const criticalRatio = criticalCount / total;
    const reviewRatio = reviewCount / total;
    const evidenceRatio = evidenceCount / total;

    let stateLabel = "Observacional";
    if (criticalRatio < 0.25 && reviewRatio < 0.04 && evidenceRatio >= 0.9) {
      stateLabel = "Baseline inicial";
    } else if (criticalRatio < 0.4 && reviewRatio < 0.08 && evidenceRatio >= 0.82) {
      stateLabel = "Observacional con brechas";
    }

    let riskLabel = "Medio";
    let riskTone = "normal";
    if (criticalRatio >= 0.55 || reviewRatio >= 0.12) {
      riskLabel = "Critico";
      riskTone = "critical";
    } else if (criticalRatio >= 0.35 || reviewRatio >= 0.06) {
      riskLabel = "Alto";
      riskTone = "high";
    } else if (criticalRatio >= 0.22) {
      riskLabel = "Medio-Alto";
      riskTone = "high";
    }

    return {
      total,
      criticalCount,
      reviewCount,
      evidenceCount,
      criticalRatio,
      reviewRatio,
      evidenceRatio,
      stateLabel,
      riskLabel,
      riskTone,
    };
  }

  function getEvidenceSummary(records) {
    const withVss = records.filter((record) => hasEvidence(record.vss_refs)).length;
    const withPhase2 = records.filter((record) => hasEvidence(record.phase2_refs)).length;
    const withBoth = records.filter((record) => hasCombinedEvidence(record)).length;
    const reposWithBoth = new Set(records.filter((record) => hasCombinedEvidence(record)).map((record) => record.repo)).size;
    const accidentalExposure = records.filter((record) => isExposureRecord(record)).length;
    const chainSecurity = records.filter((record) => ["Seguridad", "DevOps", "Trazabilidad"].includes(classifyDimension(record))).length;
    const profile = getControlProfile(records);

    return {
      withVss,
      withPhase2,
      withBoth,
      reposWithBoth,
      accidentalExposure,
      chainSecurity,
      profile,
    };
  }

  function setOptions(select, items) {
    select.innerHTML = "";
    const base = document.createElement("option");
    base.value = "Todos";
    base.textContent = "Todos";
    select.appendChild(base);
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function buildFilters() {
    setOptions(elements.stack, stackOrder);
    setOptions(elements.theme, themeOrder);
    setOptions(elements.sprint, sprintOrder);
    setOptions(elements.vss, valueStreamOrder);
    setOptions(elements.repo, data.filters.repos);

    elements.stack.addEventListener("change", () => {
      state.stack = elements.stack.value;
      render();
    });
    elements.theme.addEventListener("change", () => {
      state.theme = elements.theme.value;
      render();
    });
    elements.sprint.addEventListener("change", () => {
      state.sprint = elements.sprint.value;
      render();
    });
    elements.vss.addEventListener("change", () => {
      state.valueStream = elements.vss.value;
      render();
    });
    elements.repo.addEventListener("change", () => {
      state.repo = elements.repo.value;
      render();
    });
    elements.search.addEventListener("input", () => {
      state.search = elements.search.value;
      render();
    });
    elements.critical.addEventListener("change", () => {
      state.criticalOnly = elements.critical.checked;
      render();
    });
    elements.reset.addEventListener("click", () => {
      state.stack = "Todos";
      state.theme = "Todos";
      state.sprint = "Todos";
      state.valueStream = "Todos";
      state.repo = "Todos";
      state.search = "";
      state.criticalOnly = false;
      elements.stack.value = "Todos";
      elements.theme.value = "Todos";
      elements.sprint.value = "Todos";
      elements.vss.value = "Todos";
      elements.repo.value = "Todos";
      elements.search.value = "";
      elements.critical.checked = false;
      render();
    });
    elements.print.addEventListener("click", () => window.print());
    elements.copySummary.addEventListener("click", copyVisibleSummary);
    if (elements.sidebarToggle) {
      elements.sidebarToggle.addEventListener("click", () => toggleSidebar());
    }
    if (elements.sidebarHandle) {
      elements.sidebarHandle.addEventListener("click", () => toggleSidebar());
    }
    if (elements.sidebarOverlay) {
      elements.sidebarOverlay.addEventListener("click", () => toggleSidebar(true));
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !state.sidebarCollapsed) {
        toggleSidebar(true);
      }
    });
  }

  function getFilteredRecords() {
    const search = normalizeText(state.search);
    return data.records.filter((record) => {
      if (state.stack !== "Todos" && record.stack !== state.stack) return false;
      if (state.theme !== "Todos" && record.priority_theme !== state.theme) return false;
      if (state.sprint !== "Todos" && record.sprint_assigned !== state.sprint) return false;
      if (state.valueStream !== "Todos" && record.value_stream_group !== state.valueStream) return false;
      if (state.repo !== "Todos" && record.repo !== state.repo) return false;
      if (state.criticalOnly && record.business_criticality_rank < 3) return false;
      if (!search) return true;
      const haystack = normalizeText(
        [
          record.stack,
          record.repo,
          record.value_stream,
          record.value_stream_group,
          record.pain_point,
          record.problem_description,
          record.priority_theme,
          record.risk_category_raw,
        ].join(" ")
      );
      return haystack.includes(search);
    });
  }

  function summarize(records) {
    const repos = new Set(records.map((record) => record.repo));
    const stacks = new Set(records.map((record) => record.stack));
    const valueStreams = new Set(records.map((record) => record.value_stream_group));
    return {
      total: records.length,
      repoCount: repos.size,
      stackCount: stacks.size,
      valueStreamCount: valueStreams.size,
      criticalHighCount: records.filter((record) => record.business_criticality_rank >= 3).length,
      needsReviewCount: records.filter((record) => record.needs_review).length,
    };
  }

  function groupBy(items, keyFn) {
    return items.reduce((map, item) => {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
      return map;
    }, new Map());
  }

  function sortRecords(records) {
    return [...records].sort((a, b) => {
      const stackDiff = stackOrder.indexOf(a.stack) - stackOrder.indexOf(b.stack);
      if (stackDiff !== 0) return stackDiff;
      const sprintDiff = sprintOrder.indexOf(a.sprint_assigned) - sprintOrder.indexOf(b.sprint_assigned);
      if (sprintDiff !== 0) return sprintDiff;
      const themeDiff = themeOrder.indexOf(a.priority_theme) - themeOrder.indexOf(b.priority_theme);
      if (themeDiff !== 0) return themeDiff;
      const criticalityDiff = b.business_criticality_rank - a.business_criticality_rank;
      if (criticalityDiff !== 0) return criticalityDiff;
      return a.repo.localeCompare(b.repo);
    });
  }

  function getDimensionEntries(records) {
    const grouped = groupBy(records, (record) => classifyDimension(record));
    return dimensionOrder
      .map((dimension) => [dimension, grouped.get(dimension) || []])
      .filter(([, items]) => items.length);
  }

  function getOrderedValueStreams(records) {
    const visible = new Set(records.map((record) => record.value_stream_group));
    const ordered = valueStreamOrder.filter((stream) => visible.has(stream));
    const extras = [...visible].filter((stream) => !valueStreamOrder.includes(stream)).sort();
    return [...ordered, ...extras];
  }

  function getActiveSprintRange(items) {
    const visible = [...new Set(items.map((record) => record.sprint_assigned))]
      .sort((a, b) => sprintOrder.indexOf(a) - sprintOrder.indexOf(b));
    if (!visible.length) return "Sin carga visible";
    if (visible.length === 1) return visible[0];
    return `${visible[0]} a ${visible[visible.length - 1]}`;
  }

  function getSamplePainPoints(items, maxItems = 3) {
    const seen = new Set();
    return items
      .map((record) => record.pain_point || record.problem_description)
      .filter(Boolean)
      .filter((item) => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      })
      .slice(0, maxItems);
  }

  function getDimensionBenefitSnippet(dimension) {
    const value = dimensionDescriptions[dimension] || "";
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
  }

  function buildDimensionNarrative(dimension, items) {
    const topStack = counter(items.map((record) => record.stack))[0];
    const topStream = counter(items.map((record) => record.value_stream_group))[0];
    const profile = getControlProfile(items);
    const windowLabel = getActiveSprintRange(items);
    return `${dimension} concentra ${items.length} hallazgos; ${profile.criticalCount} son alta o crítica, hoy opera en estado ${profile.stateLabel.toLowerCase()} y el peso principal cae en ${topStack?.[0] || "el portafolio"} con ${topStream?.[0] || "sin dato"} como VSS dominante. La ventana visible corre de ${windowLabel}.`;
  }

  function buildValueStreamNarrative(stream, items) {
    const topDimension = counter(items.map((record) => classifyDimension(record)))[0];
    const topStack = counter(items.map((record) => record.stack))[0];
    const topSprint = counter(items.map((record) => record.sprint_assigned))[0];
    const repos = new Set(items.map((record) => record.repo)).size;
    const stacks = new Set(items.map((record) => record.stack)).size;
    const profile = getControlProfile(items);
    return `${stream} reúne ${items.length} hallazgos en ${repos} repositorios y ${stacks} stacks. La dimensión dominante es ${topDimension?.[0] || "sin dato"}, el estado actual sigue en ${profile.stateLabel.toLowerCase()} y el pico operativo visible cae en ${topSprint?.[0] || "sin sprint"} con mayor presión en ${topStack?.[0] || "el portafolio"}.`;
  }

  function renderControlPrinciples() {
    if (!elements.principleGrid) return;
    elements.principleGrid.innerHTML = "";
    controlPrinciples.forEach((item) => {
      const card = document.createElement("article");
      card.className = "principle-card";
      card.style.borderColor = hexToRgba(item.accent, 0.34);
      card.innerHTML = `
        <span class="dimension-rank">Control</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      `;
      elements.principleGrid.appendChild(card);
    });
  }

  function renderObservationalState(records) {
    if (!elements.observationalNote || !elements.observationalGrid) return;
    const summary = summarize(records);
    const evidence = getEvidenceSummary(records);
    const exposureCritical = records.filter((record) => isExposureRecord(record) && record.business_criticality_rank >= 3).length;

    elements.observationalNote.innerHTML = `
      <article class="general-gantt-note">
        <strong>El punto de partida sigue siendo observacional, no controlado</strong>
        <p>${evidence.withBoth} de ${summary.total} hallazgos visibles ya cruzan VSS + FASE 2; aun asi, ${summary.needsReviewCount} siguen marcados para revisión y ${exposureCritical} mantienen exposición alta o crítica. Esta vista sirve para gobernar el cambio sin sobreactuar el nivel de madurez actual.</p>
      </article>
    `;

    elements.observationalGrid.innerHTML = "";
    [
      ["Repos con evidencia cruzada", `${evidence.reposWithBoth}/${summary.repoCount}`, "Repositorios con al menos un hallazgo respaldado por VSS y FASE 2."],
      ["Hallazgos con evidencia cruzada", `${evidence.withBoth}/${summary.total}`, "Pain points que ya trazan fuente VSS y anexo diagnóstico."],
      ["Hallazgos por revisar", summary.needsReviewCount, "Clasificaciones que todavía no conviene vender como baseline cerrado."],
      ["Exposición accidental visible", evidence.accidentalExposure, "Hallazgos que hablan de secretos, hardcodes, transporte inseguro o configuraciones expuestas."],
      ["Cadena bajo presión", evidence.chainSecurity, "Hallazgos en Seguridad, DevOps y Trazabilidad que pegan al control end-to-end."],
      ["Estado actual", evidence.profile.stateLabel, "Lectura conservadora del portafolio usando severidad, revisión pendiente y evidencia cruzada."],
    ].forEach(([label, value, text]) => {
      const card = document.createElement("article");
      card.className = "observational-card";
      card.innerHTML = `<strong>${value}</strong><span>${label}</span><p>${text}</p>`;
      elements.observationalGrid.appendChild(card);
    });
  }

  function renderDimensionMatrix(records) {
    if (!elements.dimensionMatrixBody) return;
    elements.dimensionMatrixBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    getDimensionEntries(records).forEach(([dimension, items]) => {
      const profile = getControlProfile(items);
      const topStream = counter(items.map((record) => record.value_stream_group))[0]?.[0] || "Sin dato";
      const row = document.createElement("tr");
      const riskClass = profile.riskTone === "critical" ? "tag is-critical" : profile.riskTone === "high" ? "tag is-high" : "tag";
      row.innerHTML = `
        <td><span class="tag">${escapeHtml(dimension)}</span></td>
        <td>${escapeHtml(dimensionEvaluates[dimension])}</td>
        <td>${escapeHtml(profile.stateLabel)}</td>
        <td><span class="${riskClass}">${escapeHtml(profile.riskLabel)}</span></td>
        <td>${escapeHtml(topStream)}</td>
        <td>${escapeHtml(getActiveSprintRange(items))}</td>
      `;
      fragment.appendChild(row);
    });

    elements.dimensionMatrixBody.appendChild(fragment);
  }

  function buildGapModels(records) {
    const accidentalExposure = records.filter((record) => isExposureRecord(record));
    const chainControl = records.filter((record) => ["DevOps", "Trazabilidad"].includes(classifyDimension(record)) || record.value_stream_group === "CI_CD");
    const dependencies = records.filter((record) => classifyDimension(record) === "Dependencias");
    const zeroVulnerability = records.filter((record) =>
      ["Seguridad", "Dependencias"].includes(classifyDimension(record)) && record.business_criticality_rank >= 3
    );

    return [
      {
        title: "Exposición accidental",
        items: accidentalExposure,
        text: "La prevención sigue siendo prioritaria porque aún hay secretos, configuraciones y transportes inseguros visibles en la evidencia.",
      },
      {
        title: "Seguridad de la cadena",
        items: chainControl,
        text: "Pipeline, release, trazabilidad y enforcement todavía concentran carga suficiente para no declarar control homogéneo del extremo a extremo.",
      },
      {
        title: "Dependencias y obsolescencia",
        items: dependencies,
        text: "La cadena no es segura si librerías y toolchains siguen arrastrando deuda EOL o vulnerabilidades sin cerrar.",
      },
      {
        title: "Cero vulnerabilidad aun no alcanzado",
        items: zeroVulnerability,
        text: "El plan se presenta como tendencia a cero vulnerabilidad, no como estado ya logrado; la evidencia crítica sigue abierta en seguridad y dependencias.",
      },
    ];
  }

  function renderGapSummary(records) {
    if (!elements.gapGrid) return;
    elements.gapGrid.innerHTML = "";

    buildGapModels(records).forEach((gap) => {
      const items = gap.items;
      const topStream = counter(items.map((record) => record.value_stream_group))[0]?.[0] || "Sin dato";
      const topStack = counter(items.map((record) => record.stack))[0]?.[0] || "Sin dato";
      const sample = getSamplePainPoints(items, 1)[0];
      const card = document.createElement("article");
      card.className = "gap-card";
      card.innerHTML = `
        <span class="dimension-rank">Brecha</span>
        <h3>${gap.title}</h3>
        <p>${gap.text}</p>
        <div class="pill-row">
          <span class="tiny-pill">${items.length} hallazgos</span>
          <span class="tiny-pill">${escapeHtml(topStream)}</span>
          <span class="tiny-pill">${escapeHtml(topStack)}</span>
          <span class="tiny-pill">${escapeHtml(getActiveSprintRange(items))}</span>
        </div>
        ${sample ? `<ul class="sample-list"><li>${escapeHtml(sample)}</li></ul>` : ""}
      `;
      elements.gapGrid.appendChild(card);
    });
  }

  function renderMaturityEvolution(records) {
    if (!elements.maturityNote || !elements.maturityGrid) return;
    const summary = summarize(records);
    const evidence = getEvidenceSummary(records);
    elements.maturityNote.innerHTML = `
      <article class="general-gantt-note">
        <strong>Evolución esperada: Observational → Baseline → Controlled</strong>
        <p>El portafolio arranca en ${evidence.profile.stateLabel.toLowerCase()}: ${summary.total} hallazgos visibles, ${summary.criticalHighCount} alta o crítica y ${summary.needsReviewCount} todavía por revisar. Los sprints no se presentan como Jira; se presentan como mecanismo para cerrar brechas y subir madurez.</p>
      </article>
    `;

    elements.maturityGrid.innerHTML = "";
    [
      {
        stage: "Observational",
        state: "is-current",
        window: "Hoy",
        text: `${evidence.withBoth}/${summary.total} hallazgos con evidencia cruzada; aún no hay base suficiente para hablar de control total.`,
      },
      {
        stage: "Baseline",
        state: "is-next",
        window: "S32-S35",
        text: "Se consolida la línea base sobre pruebas, contratos, seguridad y pipeline para cerrar exposición accidental y fijar criterios mínimos.",
      },
      {
        stage: "Controlled",
        state: "is-target",
        window: "S36-S42",
        text: "El objetivo es llegar con quality gate, trazabilidad operativa, validaciones recurrentes y cierre formal por VSS.",
      },
    ].forEach((item) => {
      const card = document.createElement("article");
      card.className = `maturity-card ${item.state}`;
      card.innerHTML = `
        <span class="dimension-rank">${item.window}</span>
        <h3>${item.stage}</h3>
        <p>${item.text}</p>
      `;
      elements.maturityGrid.appendChild(card);
    });
  }

  function getSourceFileName(path) {
    return String(path || "").split(/[\\/]/).pop() || String(path || "");
  }

  function getFilteredTrackingActions(records) {
    const visibleRepos = new Set(records.map((record) => record.repo));
    const search = normalizeText(state.search);
    return trackingActions.filter((action) => {
      if (!visibleRepos.has(action.repo)) return false;
      if (state.sprint !== "Todos" && action.sprint_assigned !== state.sprint) return false;
      if (state.criticalOnly && action.criticality_rank < 3) return false;
      if (!search) return true;
      const haystack = normalizeText(
        [
          action.repo,
          action.stack,
          action.code,
          action.block,
          action.area,
          action.title,
          action.description,
          action.status,
          action.sprint_raw,
          action.owner,
          action.dependencies,
          action.owasp,
          action.notes,
        ].join(" ")
      );
      return haystack.includes(search);
    });
  }

  function summarizeTrackingActions(actions) {
    const repos = new Set(actions.map((action) => action.repo));
    const owners = new Set(
      actions
        .map((action) => action.owner)
        .filter((owner) => owner && owner !== "Sin responsable")
    );
    const sprints = new Set(actions.map((action) => action.sprint_assigned).filter(Boolean));
    return {
      total: actions.length,
      pendingCount: actions.filter((action) => action.status === "PENDIENTE").length,
      criticalHighCount: actions.filter((action) => action.criticality_rank >= 3).length,
      repoCount: repos.size,
      sprintCount: sprints.size,
      totalEffortMax: actions.reduce((sum, action) => sum + (Number(action.effort_max_visible) || 0), 0),
      ownerCount: owners.size,
      unassignedCount: actions.filter((action) => !action.owner || action.owner === "Sin responsable").length,
    };
  }

  function sortSprintIds(ids) {
    return [...ids].sort((a, b) => {
      const aIndex = sprintOrder.indexOf(a);
      const bIndex = sprintOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return String(a).localeCompare(String(b));
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  function renderTracking(records) {
    if (!elements.trackingNote || !elements.trackingKpis || !elements.trackingSprints || !elements.trackingRepos) return;

    const actions = getFilteredTrackingActions(records);
    const summary = summarizeTrackingActions(actions);
    const workbookName = getSourceFileName(data.tracking?.source_path || data.metadata.sources.backlog);
    const sheetCount = data.tracking?.sheet_count || 0;

    elements.trackingNote.innerHTML = `
      <article class="general-gantt-note">
        <strong>Tracking operativo conectado al backlog visible</strong>
        <p>La V2 ya consume <code>${escapeHtml(workbookName)}</code> como fuente maestra. En esta capa se integran ${sheetCount} hojas <code>TRACKING_ACCIONES</code> para bajar de la lectura VSS a acciones concretas por repo, sprint y responsable. Con los filtros actuales hay ${summary.total} acciones visibles, ${summary.pendingCount} siguen pendientes y ${summary.unassignedCount} todavía no tienen responsable asignado.</p>
      </article>
    `;

    elements.trackingKpis.innerHTML = "";
    elements.trackingSprints.innerHTML = "";
    elements.trackingRepos.innerHTML = "";

    if (!actions.length) {
      elements.trackingRepos.innerHTML = `<article class="tracking-card"><h3>Sin acciones visibles</h3><p>Los filtros activos no dejan acciones de tracking dentro de los repositorios visibles del backlog.</p></article>`;
      return;
    }

    [
      ["Acciones visibles", summary.total],
      ["Pendientes", summary.pendingCount],
      ["Alta / crítica", summary.criticalHighCount],
      ["Repos con tracking", summary.repoCount],
      ["Horas máximas", summary.totalEffortMax],
      ["Sin responsable", summary.unassignedCount],
    ].forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "kpi-card";
      card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      elements.trackingKpis.appendChild(card);
    });

    const sprintGroups = groupBy(actions, (action) => action.sprint_assigned || "Sin sprint");
    sortSprintIds([...sprintGroups.keys()]).forEach((sprintId) => {
      const items = sprintGroups.get(sprintId) || [];
      const meta = sprintMeta.get(sprintId);
      const topBlocks = counter(items.map((action) => action.block || "Sin bloque")).slice(0, 3);
      const statuses = counter(items.map((action) => action.status)).slice(0, 2);
      const card = document.createElement("article");
      card.className = "tracking-card";
      card.innerHTML = `
        <h3>${escapeHtml(sprintId)}</h3>
        <p>${meta ? `${shortDate(meta.start)} · ${shortDate(meta.end)}` : "Sprint sin mapeo exacto en el horizonte"}</p>
        <div class="stack-metric">
          <div><strong>${items.length}</strong><span>acciones</span></div>
          <div><strong>${items.reduce((sum, action) => sum + (Number(action.effort_max_visible) || 0), 0)}</strong><span>hrs máx</span></div>
        </div>
        <div class="pill-row" style="margin-top:0.8rem;">
          <span class="tiny-pill">${new Set(items.map((action) => action.repo)).size} repos</span>
          ${statuses.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        <div class="pill-row" style="margin-top:0.6rem;">
          ${topBlocks.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
      `;
      elements.trackingSprints.appendChild(card);
    });

    const repoGroups = [...groupBy(actions, (action) => action.repo).entries()].sort((a, b) => {
      const aPending = a[1].filter((action) => action.status === "PENDIENTE").length;
      const bPending = b[1].filter((action) => action.status === "PENDIENTE").length;
      if (bPending !== aPending) return bPending - aPending;
      const aCritical = a[1].filter((action) => action.criticality_rank >= 3).length;
      const bCritical = b[1].filter((action) => action.criticality_rank >= 3).length;
      if (bCritical !== aCritical) return bCritical - aCritical;
      return a[0].localeCompare(b[0]);
    });

    repoGroups.forEach(([repo, items]) => {
      const repoRecords = records.filter((record) => record.repo === repo);
      const topStream = counter(repoRecords.map((record) => record.value_stream_group))[0]?.[0] || "Sin VSS visible";
      const topDimension = counter(repoRecords.map((record) => classifyDimension(record)))[0]?.[0] || "Sin dimensión visible";
      const topBlocks = counter(items.map((action) => action.block || "Sin bloque")).slice(0, 3);
      const sampleTitles = items
        .map((action) => action.title)
        .filter(Boolean)
        .slice(0, 2);
      const card = document.createElement("article");
      card.className = "tracking-card";
      card.innerHTML = `
        <h3>${escapeHtml(repo)}</h3>
        <p>${escapeHtml(items[0].stack)} · ${items.length} acciones de tracking visibles · ${items.filter((action) => action.status === "PENDIENTE").length} pendientes</p>
        <div class="stack-metric">
          <div><strong>${items.filter((action) => action.criticality_rank >= 3).length}</strong><span>alta / crítica</span></div>
          <div><strong>${items.reduce((sum, action) => sum + (Number(action.effort_max_visible) || 0), 0)}</strong><span>hrs máx</span></div>
        </div>
        <div class="pill-row" style="margin-top:0.8rem;">
          <span class="tiny-pill">${escapeHtml(topStream)}</span>
          <span class="tiny-pill">${escapeHtml(topDimension)}</span>
          <span class="tiny-pill">${new Set(items.map((action) => action.owner).filter((owner) => owner && owner !== "Sin responsable")).size || 0} responsables asignados</span>
        </div>
        <div class="pill-row" style="margin-top:0.6rem;">
          ${topBlocks.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        ${sampleTitles.length ? `<ul class="sample-list">${sampleTitles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}</ul>` : ""}
      `;
      elements.trackingRepos.appendChild(card);
    });
  }

  function renderHeroPanel(records) {
    const summary = summarize(records);
    const evidence = getEvidenceSummary(records);
    const trackingSummary = summarizeTrackingActions(getFilteredTrackingActions(records));
    const streamCounts = counter(records.map((record) => record.value_stream_group));
    const topStream = streamCounts[0] ? streamCounts[0][0] : "Sin datos";
    const dimensionCounts = counter(records.map((record) => classifyDimension(record)));
    const topDimension = dimensionCounts[0] ? dimensionCounts[0][0] : "Sin datos";

    elements.heroPanel.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "hero-panel-grid";
    [
      ["Pain points visibles", summary.total],
      ["Acciones tracking", trackingSummary.total],
      ["Repositorios visibles", summary.repoCount],
      ["VSS activos", summary.valueStreamCount],
      ["Estado actual", evidence.profile.stateLabel],
      ["Dimensión dominante", topDimension],
      ["Criticidad alta / crítica", summary.criticalHighCount],
      ["VSS dominante", topStream],
      ["Sin responsable", trackingSummary.unassignedCount],
    ].forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "hero-panel-card";
      card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      grid.appendChild(card);
    });
    elements.heroPanel.appendChild(grid);
  }

  function renderKpis(records) {
    const summary = summarize(records);
    const evidence = getEvidenceSummary(records);
    const trackingSummary = summarizeTrackingActions(getFilteredTrackingActions(records));
    const lastCoverage = renderCoverage(records);
    elements.kpis.innerHTML = "";
    const cards = [
      ["Hallazgos visibles", summary.total],
      ["Alta / crítica", summary.criticalHighCount],
      ["Repos con evidencia cruzada", evidence.reposWithBoth],
      ["VSS visibles", summary.valueStreamCount],
      ["Acciones tracking", trackingSummary.total],
      ["Sin responsable", trackingSummary.unassignedCount],
      ["Cobertura final", `${lastCoverage.toFixed(1)}%`],
    ];
    cards.forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "kpi-card";
      card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      elements.kpis.appendChild(card);
    });
  }

  function renderPriorityLadder(records) {
    const counts = Object.fromEntries(dimensionOrder.map((dimension) => [dimension, 0]));
    records.forEach((record) => {
      counts[classifyDimension(record)] += 1;
    });
    elements.ladder.innerHTML = "";
    dimensionOrder.forEach((dimension, index) => {
      const card = document.createElement("article");
      card.className = "priority-card";
      card.style.background = `linear-gradient(155deg, ${hexToRgba(dimensionColors[dimension], 0.95)}, ${hexToRgba(dimensionColors[dimension], 0.52)})`;
      card.innerHTML = `
        <span class="priority-rank">Dimensión ${index + 1}</span>
        <h3>${dimension}</h3>
        <p>${getDimensionBenefitSnippet(dimension)}</p>
        <strong>${counts[dimension]} hallazgos</strong>
      `;
      elements.ladder.appendChild(card);
    });
  }

  function renderDimensionSummary(records) {
    if (!elements.dimensionGrid) return;
    elements.dimensionGrid.innerHTML = "";

    getDimensionEntries(records).forEach(([dimension, items]) => {
      const topStreams = counter(items.map((record) => record.value_stream_group)).slice(0, 4);
      const topStacks = counter(items.map((record) => record.stack)).slice(0, 4);
      const topSprints = counter(items.map((record) => record.sprint_assigned)).slice(0, 3);
      const samples = getSamplePainPoints(items, 3);
      const profile = getControlProfile(items);

      const card = document.createElement("article");
      card.className = "dimension-card";
      card.style.borderColor = hexToRgba(dimensionColors[dimension], 0.32);
      card.innerHTML = `
        <div class="dimension-card-head">
          <div>
            <span class="dimension-rank">${dimension}</span>
            <h3>${dimension}</h3>
            <p>${escapeHtml(buildDimensionNarrative(dimension, items))}</p>
          </div>
        </div>
        <div class="dimension-metric-row">
          <article class="dimension-metric">
            <strong>${items.length}</strong>
            <span>hallazgos visibles</span>
          </article>
          <article class="dimension-metric">
            <strong>${profile.criticalCount}</strong>
            <span>alta / crítica</span>
          </article>
          <article class="dimension-metric">
            <strong>${new Set(items.map((record) => record.value_stream_group)).size}</strong>
            <span>VSS tocados</span>
          </article>
        </div>
        <div class="pill-row">
          <span class="tiny-pill">${escapeHtml(profile.stateLabel)}</span>
          <span class="tiny-pill">${escapeHtml(profile.riskLabel)}</span>
          ${topStreams.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        <div class="pill-row" style="margin-top:0.7rem;">
          ${topStacks.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        <div class="pill-row" style="margin-top:0.7rem;">
          ${topSprints.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        <ul class="sample-list">${samples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      `;
      elements.dimensionGrid.appendChild(card);
    });

    if (!elements.dimensionGrid.children.length) {
      elements.dimensionGrid.innerHTML = `<article class="source-card"><h3>Sin resultados</h3><p>Los filtros actuales no dejan hallazgos visibles para construir el resumen 6D.</p></article>`;
    }
  }

  function renderVssOverview(records) {
    if (!elements.vssOverview || !elements.vssOverviewNote) return;

    const orderedStreams = getOrderedValueStreams(records);
    const topStream = counter(records.map((record) => record.value_stream_group))[0];
    const topSprint = counter(records.map((record) => record.sprint_assigned))[0];
    const profile = getControlProfile(records);
    elements.vssOverviewNote.innerHTML = `
      <article class="general-gantt-note">
        <strong>${orderedStreams.length} VSS visibles en el horizonte actual</strong>
        <p>${topStream?.[0] || "Sin VSS dominante"} lidera la carga visible y ${topSprint?.[0] || "sin sprint dominante"} concentra el mayor volumen operativo. El portafolio visible sigue en ${profile.stateLabel.toLowerCase()}, por eso cada bloque resume presión por sprint, dimensión dominante y repositorios tocados en vez de vender control total.</p>
      </article>
    `;

    elements.vssOverview.innerHTML = "";
    if (!orderedStreams.length) {
      elements.vssOverview.innerHTML = `<article class="source-card"><h3>Sin resultados</h3><p>Los filtros activos no dejan VSS visibles para el cronograma global.</p></article>`;
      return;
    }

    const head = document.createElement("div");
    head.className = "vss-board-head";
    head.innerHTML = `<div class="vss-board-lane vss-board-lane-head">Value stream / VSS</div>`;
    const headShell = document.createElement("div");
    headShell.className = "vss-board-track-shell";
    const headTrack = document.createElement("div");
    headTrack.className = "vss-board-track vss-board-track-head";
    data.sprints.forEach((sprint) => {
      const label = document.createElement("div");
      label.className = "vss-board-sprint";
      label.innerHTML = `<strong>${sprint.id}</strong><span>${shortDate(sprint.start)} · ${shortDate(sprint.end)}</span>`;
      headTrack.appendChild(label);
    });
    headShell.appendChild(headTrack);
    head.appendChild(headShell);
    elements.vssOverview.appendChild(head);

    orderedStreams.forEach((stream) => {
      const items = records.filter((record) => record.value_stream_group === stream);
      if (!items.length) return;
      const row = document.createElement("article");
      row.className = "vss-board-row";
      const lane = document.createElement("div");
      lane.className = "vss-board-lane";
      lane.innerHTML = `
        <strong>${escapeHtml(stream)}</strong>
        <span>${items.length} hallazgos · ${new Set(items.map((record) => record.repo)).size} repos · ${new Set(items.map((record) => record.stack)).size} stacks</span>
      `;
      row.appendChild(lane);

      const trackShell = document.createElement("div");
      trackShell.className = "vss-board-track-shell";
      const track = document.createElement("div");
      track.className = "vss-board-track";

      data.sprints.forEach((sprint) => {
        const sprintItems = items.filter((record) => record.sprint_assigned === sprint.id);
        const cell = document.createElement("div");
        cell.className = "vss-board-cell";
        if (!sprintItems.length) {
          cell.classList.add("is-empty");
          track.appendChild(cell);
          return;
        }

        const dominantDimension = counter(sprintItems.map((record) => classifyDimension(record)))[0]?.[0] || "Arquitectura";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vss-board-block";
        button.style.background = `linear-gradient(160deg, ${hexToRgba(dimensionColors[dominantDimension], 0.94)}, ${hexToRgba(dimensionColors[dominantDimension], 0.58)})`;
        button.title = [
          `${stream} · ${sprint.id}`,
          `${sprintItems.length} hallazgos`,
          `Dimensión dominante: ${dominantDimension}`,
          `Repos: ${[...new Set(sprintItems.map((record) => record.repo))].slice(0, 4).join(", ")}`,
        ].join("\n");
        button.innerHTML = `
          <strong>${sprintItems.length}</strong>
          <span>${escapeHtml(dominantDimension)}</span>
          <span>${new Set(sprintItems.map((record) => record.repo)).size} repos</span>
        `;
        button.addEventListener("click", () => {
          state.valueStream = stream;
          state.sprint = sprint.id;
          elements.vss.value = stream;
          elements.sprint.value = sprint.id;
          render();
          document.getElementById("detalle").scrollIntoView({ behavior: "smooth", block: "start" });
        });
        cell.appendChild(button);
        track.appendChild(cell);
      });

      trackShell.appendChild(track);
      row.appendChild(trackShell);
      elements.vssOverview.appendChild(row);
    });
  }

  function renderVssDetail(records) {
    if (!elements.vssDetail) return;
    elements.vssDetail.innerHTML = "";

    const orderedStreams = getOrderedValueStreams(records);
    orderedStreams.forEach((stream) => {
      const items = records.filter((record) => record.value_stream_group === stream);
      if (!items.length) return;

      const dimensionMix = counter(items.map((record) => classifyDimension(record))).slice(0, 4);
      const stackMix = counter(items.map((record) => record.stack)).slice(0, 4);
      const samples = getSamplePainPoints(items, 3);
      const profile = getControlProfile(items);

      const card = document.createElement("article");
      card.className = "vss-detail-card";
      const topDimension = dimensionMix[0]?.[0] || "Arquitectura";
      card.style.borderColor = hexToRgba(dimensionColors[topDimension], 0.3);

      const timelineShell = document.createElement("div");
      timelineShell.className = "vss-detail-timeline-shell";
      const timeline = document.createElement("div");
      timeline.className = "vss-detail-timeline";

      data.sprints.forEach((sprint) => {
        const sprintItems = items.filter((record) => record.sprint_assigned === sprint.id);
        const block = document.createElement(sprintItems.length ? "button" : "article");
        block.className = "vss-sprint-card";
        if (!sprintItems.length) {
          block.classList.add("is-empty");
          block.innerHTML = `<strong>${sprint.id}</strong><span>Sin carga visible</span>`;
          timeline.appendChild(block);
          return;
        }

        const dominantDimension = counter(sprintItems.map((record) => classifyDimension(record)))[0]?.[0] || "Arquitectura";
        block.type = "button";
        block.style.background = `linear-gradient(160deg, ${hexToRgba(dimensionColors[dominantDimension], 0.2)}, rgba(8, 18, 28, 0.92))`;
        block.title = `${stream} · ${sprint.id}\n${sprintItems.length} hallazgos\nDimensión dominante: ${dominantDimension}`;
        block.innerHTML = `
          <strong>${sprint.id}</strong>
          <span>${shortDate(sprint.start)} · ${shortDate(sprint.end)}</span>
          <strong>${sprintItems.length} hallazgos</strong>
          <span>${escapeHtml(dominantDimension)}</span>
        `;
        block.addEventListener("click", () => {
          state.valueStream = stream;
          state.sprint = sprint.id;
          elements.vss.value = stream;
          elements.sprint.value = sprint.id;
          render();
          document.getElementById("detalle").scrollIntoView({ behavior: "smooth", block: "start" });
        });
        timeline.appendChild(block);
      });

      timelineShell.appendChild(timeline);
      card.innerHTML = `
        <div class="vss-detail-head">
          <div>
            <span class="dimension-rank">VSS</span>
            <h3>${escapeHtml(stream)}</h3>
            <p>${escapeHtml(buildValueStreamNarrative(stream, items))}</p>
          </div>
          <div class="vss-metric-strip">
            <span class="vss-metric-chip">${items.length} hallazgos</span>
            <span class="vss-metric-chip">${profile.criticalCount} alta / crítica</span>
            <span class="vss-metric-chip">${new Set(items.map((record) => record.repo)).size} repos</span>
            <span class="vss-metric-chip">${escapeHtml(profile.stateLabel)}</span>
            <span class="vss-metric-chip">${getActiveSprintRange(items)}</span>
          </div>
        </div>
        <div class="pill-row">
          ${dimensionMix.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
        <div class="pill-row" style="margin-top:0.7rem;">
          ${stackMix.map(([label, count]) => `<span class="tiny-pill">${escapeHtml(label)}: ${count}</span>`).join("")}
        </div>
      `;
      card.appendChild(timelineShell);

      if (samples.length) {
        const sampleList = document.createElement("ul");
        sampleList.className = "sample-list";
        sampleList.innerHTML = samples.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        card.appendChild(sampleList);
      }

      elements.vssDetail.appendChild(card);
    });

    if (!elements.vssDetail.children.length) {
      elements.vssDetail.innerHTML = `<article class="source-card"><h3>Sin resultados</h3><p>Los filtros activos no dejan tarjetas visibles para el cronograma por VSS.</p></article>`;
    }
  }

  function generalTrackMinWidth(columnMinWidth) {
    const gapPx = 9;
    return data.sprints.length * columnMinWidth + (data.sprints.length - 1) * gapPx + 16;
  }

  function applyGeneralSprintLayout(track) {
    const columnMinWidth = 148;
    track.style.gridTemplateColumns = `repeat(${data.sprints.length}, minmax(${columnMinWidth}px, 1fr))`;
    track.style.minWidth = `${generalTrackMinWidth(columnMinWidth)}px`;
  }

  function applyDetailedSprintLayout(grid) {
    const labelWidth = 180;
    const columnMinWidth = 94;
    const gapPx = 9;
    grid.style.gridTemplateColumns = `${labelWidth}px repeat(${data.sprints.length}, minmax(${columnMinWidth}px, 1fr))`;
    grid.style.minWidth = `${labelWidth + data.sprints.length * columnMinWidth + (data.sprints.length - 1) * gapPx}px`;
  }

  function buildGeneralBaseText(segment) {
    return segment.summary || segment.activity || segment.hallazgos || segment.qa_ia || "";
  }

  function buildGeneralTooltip(segment) {
    return [
      segment.title,
      segment.summary ? `Resumen: ${segment.summary}` : "",
      segment.hallazgos ? `Hallazgos: ${segment.hallazgos}` : "",
      segment.activity ? `Actividad: ${segment.activity}` : "",
      segment.qa_ia ? `QA e IA: ${segment.qa_ia}` : "",
      `Sprints: ${segment.start_sprint}${segment.start_sprint !== segment.end_sprint ? ` a ${segment.end_sprint}` : ""}`,
      `Fechas: ${shortDate(segment.start)} a ${shortDate(segment.end)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function renderGeneralPlan() {
    const plan = data.general_plan;
    if (!plan || !elements.generalGantt || !elements.generalGanttIntro) return;
    const kickoffSprint = data.sprints.find((item) => item.start === plan.kickoff);
    const officialSprint = data.sprints.find((item) => item.start === plan.official_start);

    elements.generalGanttIntro.innerHTML = `
      <article class="general-gantt-note">
        <strong>Kickoff ${kickoffSprint?.id || ""}: ${shortDate(plan.kickoff)} · Inicio formal ${officialSprint?.id || ""}: ${shortDate(plan.official_start)}</strong>
        <p>${escapeHtml(plan.note)}</p>
      </article>
    `;

    elements.generalGantt.innerHTML = "";

    const head = document.createElement("div");
    head.className = "general-gantt-head";
    head.innerHTML = `<div class="general-gantt-lane general-gantt-lane-head">Frente general</div>`;
    const headShell = document.createElement("div");
    headShell.className = "general-gantt-track-shell";
    const headTrack = document.createElement("div");
    headTrack.className = "general-gantt-track general-gantt-track-head";
    applyGeneralSprintLayout(headTrack);
    data.sprints.forEach((sprint) => {
      const label = document.createElement("div");
      label.className = "general-gantt-sprint";
      label.innerHTML = `<strong>${sprint.id}</strong><span>${shortDate(sprint.start)} · ${shortDate(sprint.end)}</span>`;
      headTrack.appendChild(label);
    });
    headShell.appendChild(headTrack);
    head.appendChild(headShell);
    elements.generalGantt.appendChild(head);

    (plan.rows || []).forEach((item) => {
      const row = document.createElement("article");
      row.className = "general-gantt-row";

      const lane = document.createElement("div");
      lane.className = "general-gantt-lane";
      lane.innerHTML = `
        <strong>${escapeHtml(item.lane)}</strong>
        <span>${escapeHtml(item.status)}</span>
      `;
      row.appendChild(lane);

      const trackShell = document.createElement("div");
      trackShell.className = "general-gantt-track-shell";
      const track = document.createElement("div");
      track.className = "general-gantt-track";
      applyGeneralSprintLayout(track);

      (item.segments || []).forEach((segment) => {
        const startIndex = sprintOrder.indexOf(segment.start_sprint);
        const endIndex = sprintOrder.indexOf(segment.end_sprint);
        if (startIndex < 0 || endIndex < 0) return;
        const baseText = buildGeneralBaseText(segment);
        const sprintRange = `${segment.start_sprint}${segment.start_sprint !== segment.end_sprint ? ` a ${segment.end_sprint}` : ""}`;

        const block = document.createElement("div");
        block.className = "general-gantt-block";
        if (segment.is_active) {
          block.classList.add("is-active");
        }
        block.style.gridColumn = `${startIndex + 1} / ${endIndex + 2}`;
        const color = segment.color || themeColors[segment.theme] || "#64748b";
        block.style.background = `linear-gradient(160deg, ${hexToRgba(color, 0.94)}, ${hexToRgba(color, 0.6)})`;
        block.title = buildGeneralTooltip(segment);
        block.setAttribute("aria-label", block.title);
        block.innerHTML = `
          <span class="general-gantt-badge">${escapeHtml(segment.label || segment.theme)}</span>
          <strong>${escapeHtml(segment.title)}</strong>
          ${baseText ? `<p>${escapeHtml(baseText)}</p>` : ""}
          <div class="general-gantt-meta">
            <span>${escapeHtml(sprintRange)}</span>
          </div>
        `;
        track.appendChild(block);
      });

      trackShell.appendChild(track);
      row.appendChild(trackShell);
      elements.generalGantt.appendChild(row);
    });
  }

  function renderLegend() {
    elements.legend.innerHTML = "";
    themeOrder.forEach((theme) => {
      const chip = document.createElement("span");
      chip.className = "legend-chip";
      chip.innerHTML = `<span class="legend-dot" style="background:${themeColors[theme]}"></span>${theme}`;
      elements.legend.appendChild(chip);
    });
  }

  function sprintContainsSegment(segment, sprintId) {
    const startIndex = sprintOrder.indexOf(segment.start_sprint);
    const endIndex = sprintOrder.indexOf(segment.end_sprint);
    const sprintIndex = sprintOrder.indexOf(sprintId);
    return startIndex >= 0 && endIndex >= 0 && sprintIndex >= 0 && sprintIndex >= startIndex && sprintIndex <= endIndex;
  }

  function compactProgramDetail(segment) {
    const source = segment.hallazgos || segment.activity || segment.qa_ia || segment.summary || "";
    if (source.length <= 58) return source;
    return `${source.slice(0, 55).trim()}...`;
  }

  function getSupplementalStackRows() {
    const laneConfigs = [
      { lane: "QA + IA transversal", label: "QA + IA", theme: "Observabilidad" },
      { lane: "Quality Gate", label: "Quality Gate", theme: "Seguridad" },
      { lane: "Entrega y cierre", label: "Entrega y cierre", theme: "Operación/Otras" },
    ];
    const rows = data.general_plan?.rows || [];
    return laneConfigs
      .map((config) => {
        const row = rows.find((item) => item.lane === config.lane);
        if (!row) return null;
        return {
          ...config,
          status: row.status,
          segments: row.segments || [],
        };
      })
      .filter(Boolean)
      .filter((row) => {
        if (state.theme !== "Todos" && state.theme !== row.theme) return false;
        if (state.sprint !== "Todos" && !row.segments.some((segment) => sprintContainsSegment(segment, state.sprint))) return false;
        return true;
      });
  }

  function renderGantt(records) {
    const filteredByStack = groupBy(records, (record) => record.stack);
    const supplementalRows = getSupplementalStackRows();
    const hasRecordScopedFilter = state.repo !== "Todos" || Boolean(state.search) || state.criticalOnly;
    elements.gantt.innerHTML = "";
    stackOrder.forEach((stack) => {
      const stackRecords = filteredByStack.get(stack) || [];
      const shouldShowSupplementals = supplementalRows.length && (!hasRecordScopedFilter || !!stackRecords.length || state.stack === stack);
      if (!stackRecords.length && !shouldShowSupplementals) return;

      const stackCard = document.createElement("article");
      stackCard.className = "gantt-stack";
      const repos = new Set(stackRecords.map((record) => record.repo));
      const head = document.createElement("div");
      head.className = "gantt-stack-head";
      head.innerHTML = `
        <h3>${stack}</h3>
        <div class="gantt-stack-meta">
          <span>${repos.size} repos</span>
          <span>${stackRecords.length} hallazgos</span>
          <span>${stackRecords.filter((record) => record.business_criticality_rank >= 3).length} alta / crítica</span>
          ${shouldShowSupplementals ? `<span>${supplementalRows.length} frentes transversales</span>` : ""}
        </div>
      `;
      stackCard.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "gantt-grid";
      applyDetailedSprintLayout(grid);
      const blankHead = document.createElement("div");
      blankHead.className = "gantt-sprint-head";
      blankHead.textContent = "Categoría";
      grid.appendChild(blankHead);
      data.sprints.forEach((sprint) => {
        const header = document.createElement("div");
        header.className = "gantt-sprint-head";
        header.innerHTML = `<strong>${sprint.id}</strong><span>${shortDate(sprint.start)} · ${shortDate(sprint.end)}</span>`;
        grid.appendChild(header);
      });

      const themeGroups = groupBy(stackRecords, (record) => record.priority_theme);
      themeOrder.forEach((theme) => {
        const themeRecords = themeGroups.get(theme) || [];
        if (!themeRecords.length) return;

        const label = document.createElement("div");
        label.className = "gantt-theme-label";
        label.innerHTML = `<strong>${theme}</strong><span>${themeRecords.length} hallazgos · ${new Set(themeRecords.map((record) => record.value_stream_group)).size} grupos</span>`;
        grid.appendChild(label);

        const sprintCells = groupBy(themeRecords, (record) => record.sprint_assigned);
        data.sprints.forEach((sprint) => {
          const cell = document.createElement("div");
          cell.className = "gantt-cell";
          const cellRecords = sprintCells.get(sprint.id) || [];
          if (!cellRecords.length) {
            cell.classList.add("empty-cell");
            grid.appendChild(cell);
            return;
          }

          const byGroup = counter(cellRecords.map((record) => record.value_stream_group)).slice(0, 2).map((item) => item[0]);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "gantt-block";
          button.style.background = `linear-gradient(160deg, ${hexToRgba(themeColors[theme], 0.92)}, ${hexToRgba(themeColors[theme], 0.58)})`;
          button.innerHTML = `
            <strong>${cellRecords.length} hallazgos</strong>
            <span>${byGroup.join(" · ")}</span>
            <span>${new Set(cellRecords.map((record) => record.repo)).size} repos</span>
          `;
          button.addEventListener("click", () => {
            state.stack = stack;
            state.theme = theme;
            state.sprint = sprint.id;
            elements.stack.value = stack;
            elements.theme.value = theme;
            elements.sprint.value = sprint.id;
            render();
            document.getElementById("detalle").scrollIntoView({ behavior: "smooth", block: "start" });
          });
          cell.appendChild(button);
          grid.appendChild(cell);
        });
      });

      if (shouldShowSupplementals) {
        supplementalRows.forEach((row) => {
          const label = document.createElement("div");
          label.className = "gantt-theme-label gantt-theme-label-program";
          label.innerHTML = `<strong>${row.label}</strong><span>${row.status}</span>`;
          grid.appendChild(label);

          data.sprints.forEach((sprint) => {
            const cell = document.createElement("div");
            cell.className = "gantt-cell gantt-cell-program";
            const segment = row.segments.find((item) => sprintContainsSegment(item, sprint.id));
            if (!segment) {
              cell.classList.add("empty-cell");
              grid.appendChild(cell);
              return;
            }

            const color = segment.color || themeColors[row.theme] || "#64748b";
            const block = document.createElement("article");
            block.className = "gantt-block gantt-block-program";
            block.style.background = `linear-gradient(160deg, ${hexToRgba(color, 0.94)}, ${hexToRgba(color, 0.62)})`;
            block.title = [
              segment.title,
              segment.hallazgos ? `Hallazgos: ${segment.hallazgos}` : "",
              segment.activity ? `Actividad: ${segment.activity}` : "",
              segment.qa_ia ? `QA e IA: ${segment.qa_ia}` : "",
            ]
              .filter(Boolean)
              .join("\n");
            block.innerHTML = `
              <strong>${escapeHtml(row.label)}</strong>
              <span>${escapeHtml(segment.title)}</span>
              <span>${escapeHtml(compactProgramDetail(segment))}</span>
            `;
            cell.appendChild(block);
            grid.appendChild(cell);
          });
        });
      }

      stackCard.appendChild(grid);
      elements.gantt.appendChild(stackCard);
    });

    if (!elements.gantt.children.length) {
      elements.gantt.innerHTML = `<article class="gantt-stack"><div class="gantt-stack-head"><h3>Sin resultados</h3></div><div class="gantt-cell" style="min-height:120px;padding:1rem;opacity:1;">No hay bloques que coincidan con los filtros activos.</div></article>`;
    }
  }

  function renderCoverage(records) {
    const total = records.length || 1;
    const counts = new Map(data.sprints.map((sprint) => [sprint.id, 0]));
    records.forEach((record) => {
      counts.set(record.sprint_assigned, (counts.get(record.sprint_assigned) || 0) + 1);
    });

    let cumulative = 0;
    const series = data.sprints.map((sprint) => {
      const count = counts.get(sprint.id) || 0;
      cumulative += count;
      return {
        ...sprint,
        count,
        cumulative,
        percent: (count / total) * 100,
        cumulativePercent: (cumulative / total) * 100,
      };
    });

    const width = 1040;
    const height = 320;
    const leftPad = 72;
    const rightPad = 56;
    const topPad = 36;
    const bottomPad = 84;
    const plotWidth = width - leftPad - rightPad;
    const step = plotWidth / (series.length - 1);
    const barWidth = Math.min(64, step * 0.64);
    const maxCount = Math.max(...series.map((item) => item.count), 1);
    const chartHeight = height - topPad - bottomPad;
    const baseY = height - bottomPad;
    const bars = series.map((item, index) => {
      const xCenter = leftPad + index * step;
      const x = xCenter - barWidth / 2;
      const barHeight = Math.max(10, (item.count / maxCount) * chartHeight);
      const y = baseY - barHeight;
      const lineY = baseY - (item.cumulativePercent / 100) * chartHeight;
      return {
        ...item,
        xCenter,
        x,
        y,
        barHeight,
        lineY,
      };
    });
    const points = bars.map((item) => `${item.xCenter},${item.lineY}`);
    const labelPositions = [];
    bars.forEach((item, index) => {
      let x = item.xCenter;
      let y = item.lineY - 18;
      const previous = labelPositions[index - 1];
      if (previous && Math.abs(y - previous.y) < 18 && Math.abs(x - previous.x) < 96) {
        y = previous.y - 22;
        if (y < 18) {
          y = item.lineY + 26;
        }
        if (index === bars.length - 1) {
          x += 18;
        }
      }
      labelPositions.push({
        x,
        y,
        width: 26 + `${item.cumulativePercent.toFixed(0)}%`.length * 7,
      });
    });

    elements.coverageChart.innerHTML = `
      <svg class="coverage-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Cobertura acumulada por sprint">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="0.95"></stop>
            <stop offset="100%" stop-color="#0f766e" stop-opacity="0.78"></stop>
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8"></stop>
            <stop offset="100%" stop-color="#22c55e"></stop>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="rgba(5,12,20,0.22)"></rect>
        <line x1="${leftPad}" y1="${baseY}" x2="${width - rightPad}" y2="${baseY}" stroke="rgba(124,150,180,0.22)" stroke-width="1"></line>
        ${bars
          .map((item) => {
            return `
              <g>
                <rect x="${item.x}" y="${item.y}" width="${barWidth}" height="${item.barHeight}" rx="16" fill="url(#barGradient)" opacity="0.92"></rect>
                <text x="${item.xCenter}" y="${baseY + 24}" text-anchor="middle" fill="#d4e5ff" font-size="13" font-weight="700">${item.id}</text>
                <text x="${item.xCenter}" y="${baseY + 46}" text-anchor="middle" fill="#9fdcc6" font-size="13">${item.count}</text>
              </g>
            `;
          })
          .join("")}
        <polyline fill="none" stroke="url(#lineGradient)" stroke-width="4" points="${points.join(" ")}"></polyline>
        ${bars
          .map((item, index) => {
            const label = labelPositions[index];
            const labelText = `${item.cumulativePercent.toFixed(0)}%`;
            const rectX = label.x - label.width / 2;
            const rectY = label.y - 16;
            return `
              <g>
                <circle cx="${item.xCenter}" cy="${item.lineY}" r="6" fill="#ecfeff"></circle>
                <rect x="${rectX}" y="${rectY}" width="${label.width}" height="22" rx="11" fill="rgba(6,14,24,0.92)" stroke="rgba(92,228,184,0.22)"></rect>
                <text x="${label.x}" y="${label.y}" text-anchor="middle" fill="#ecfeff" font-size="13" font-weight="700">${labelText}</text>
              </g>
            `;
          })
          .join("")}
      </svg>
    `;

    elements.coverageSummary.innerHTML = "";
    series.forEach((item) => {
      const card = document.createElement("article");
      card.className = "coverage-sprint-card";
      card.innerHTML = `
        <strong>${item.id} · ${item.count} hallazgos</strong>
        <span>${shortDate(item.start)} a ${shortDate(item.end)}</span>
        <span>${item.percent.toFixed(1)}% del total · acumulado ${item.cumulativePercent.toFixed(1)}%</span>
      `;
      elements.coverageSummary.appendChild(card);
    });
    return series[series.length - 1]?.cumulativePercent || 0;
  }

  function renderThemeInsights(records) {
    elements.themeInsights.innerHTML = "";
    elements.streamInsights.innerHTML = "";

    const themeRecords = groupBy(records, (record) => record.priority_theme);
    themeOrder.forEach((theme) => {
      const items = themeRecords.get(theme) || [];
      if (!items.length) return;
      const stacks = counter(items.map((record) => record.stack)).slice(0, 4);
      const streams = counter(items.map((record) => record.value_stream_group)).slice(0, 4);
      const card = document.createElement("article");
      card.className = "theme-card";
      card.innerHTML = `
        <h3>${theme}</h3>
        <p>${sectionDescriptions[theme]}</p>
        <div class="pill-row">
          <span class="tiny-pill">${items.length} hallazgos</span>
          <span class="tiny-pill">${items.filter((record) => record.business_criticality_rank >= 3).length} alta / crítica</span>
        </div>
        <div class="pill-row" style="margin-top:0.7rem;">
          ${stacks.map(([label, count]) => `<span class="tiny-pill">${label}: ${count}</span>`).join("")}
        </div>
        <ul class="sample-list">${streams.map(([label]) => `<li>${label}</li>`).join("")}</ul>
      `;
      elements.themeInsights.appendChild(card);
    });

    const streamGroups = groupBy(records, (record) => record.value_stream_group);
    [...streamGroups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([stream, items]) => {
        const themes = counter(items.map((record) => record.priority_theme)).slice(0, 3);
        const card = document.createElement("article");
        card.className = "stream-card";
        card.innerHTML = `
          <h3>${stream}</h3>
          <p>${items.length} hallazgos en ${new Set(items.map((record) => record.stack)).size} stacks.</p>
          <div class="pill-row">${themes.map(([label, count]) => `<span class="tiny-pill">${label}: ${count}</span>`).join("")}</div>
          <ul class="sample-list">${items.slice(0, 3).map((item) => `<li>${escapeHtml(item.pain_point)}</li>`).join("")}</ul>
        `;
        elements.streamInsights.appendChild(card);
      });
  }

  function renderStackComparison(records) {
    elements.stackGrid.innerHTML = "";
    const stackGroups = groupBy(records, (record) => record.stack);
    const maxCount = Math.max(...stackOrder.map((stack) => (stackGroups.get(stack) || []).length), 1);

    stackOrder.forEach((stack) => {
      const items = stackGroups.get(stack) || [];
      if (!items.length) return;
      const themeMix = counter(items.map((record) => record.priority_theme)).slice(0, 3);
      const card = document.createElement("article");
      card.className = "stack-card";
      const ratio = (items.length / maxCount) * 100;
      card.innerHTML = `
        <h3>${stack}</h3>
        <p>${new Set(items.map((record) => record.repo)).size} repos · ${new Set(items.map((record) => record.value_stream_group)).size} grupos VSS</p>
        <div class="stack-metric">
          <div><strong>${items.length}</strong><span>pain points</span></div>
          <div><strong>${items.filter((record) => record.business_criticality_rank >= 3).length}</strong><span>alta / crítica</span></div>
        </div>
        <div class="pill-row" style="margin-top:0.8rem;">${themeMix.map(([label, count]) => `<span class="tiny-pill">${label}: ${count}</span>`).join("")}</div>
        <div class="stack-bar"><span style="width:${ratio}%;"></span></div>
      `;
      elements.stackGrid.appendChild(card);
    });
  }

  function renderDetailTable(records) {
    const sorted = sortRecords(records);
    elements.detailCount.textContent = `${sorted.length} filas visibles`;
    elements.detailBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    sorted.forEach((record) => {
      const row = document.createElement("tr");
      const criticalClass =
        record.business_criticality_rank >= 4
          ? "tag is-critical"
          : record.business_criticality_rank >= 3
            ? "tag is-high"
            : "tag";
      const vssLink = record.vss_refs.find((item) => item.href);
      const phase2Link = record.phase2_refs.find((item) => item.href);
      row.innerHTML = `
        <td><span class="tag">${escapeHtml(record.stack)}</span></td>
        <td>
          <strong>${escapeHtml(record.repo)}</strong>
          <div class="pill-row" style="margin-top:0.4rem;">
            ${vssLink ? `<a class="tag is-link" href="${escapeHtml(vssLink.href)}">VSS</a>` : ""}
            ${phase2Link ? `<a class="tag is-link" href="${escapeHtml(phase2Link.href)}">FASE 2</a>` : ""}
          </div>
        </td>
        <td>${escapeHtml(record.value_stream_group)}</td>
        <td>${escapeHtml(record.pain_point || record.problem_description)}</td>
        <td><span class="tag">${escapeHtml(record.priority_theme)}</span></td>
        <td><span class="${criticalClass}">${escapeHtml(record.business_criticality)}</span></td>
        <td><span class="tag">${escapeHtml(record.sprint_assigned)}</span></td>
        <td>${record.effort_hours_max || 0}</td>
        <td>
          <code>${escapeHtml(record.source_path)}</code>
          ${record.needs_review ? `<div class="pill-row" style="margin-top:0.4rem;"><span class="tag is-high">Revisar clasificación</span></div>` : ""}
        </td>
      `;
      fragment.appendChild(row);
    });
    elements.detailBody.appendChild(fragment);
  }

  function renderSources(records) {
    elements.sourceGrid.innerHTML = "";
    const summary = summarize(records);
    const workbookName = getSourceFileName(data.metadata.sources.backlog);
    const globalCards = [
      {
        title: "Workbook maestro",
        text: `${summary.total} hallazgos visibles del backlog y ${data.stats.tracking_action_count || 0} acciones operativas consolidadas desde el workbook de negocio.`,
        links: [{ label: workbookName, path: data.metadata.sources.backlog }],
      },
      {
        title: "Tracking por repo",
        text: `${data.tracking?.sheet_count || 0} hojas TRACKING_ACCIONES integradas a la V2 para bajar de VSS a acciones por sprint, repo y responsable.`,
        links: [{ label: `${data.tracking?.sheet_count || 0} hojas tracking`, path: data.metadata.sources.backlog }],
      },
      {
        title: "Diagnóstico FASE 2",
        text: "Referencias cruzadas a anexos FASE 2 y a los documentos de diagnóstico, ISO 5055 y diagramas de arquitectura.",
        links: [{ label: "fase 2.zip", path: data.metadata.sources.phase2_zip }],
      },
      {
        title: "Consolidado VSS",
        text: "Trazabilidad estructural desde VSS para ligar stack, repo, value stream y fuentes generadas por los desarrolladores.",
        links: [{ label: "vss consolidado", path: data.metadata.sources.vss_root }],
      },
    ];

    globalCards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "source-card";
      card.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <div class="source-card-links">
          ${item.links.map((link) => `<span class="tag">${escapeHtml(link.label)}</span>`).join("")}
        </div>
      `;
      elements.sourceGrid.appendChild(card);
    });

    const repos = [...new Set(records.map((record) => record.repo))].sort();
    repos.slice(0, 20).forEach((repo) => {
      const repoRecords = records.filter((record) => record.repo === repo);
      const vssRefs = uniqueRefs(repoRecords.flatMap((record) => record.vss_refs || []));
      const phase2Refs = uniqueRefs(repoRecords.flatMap((record) => record.phase2_refs || []));
      const card = document.createElement("article");
      card.className = "source-card";
      card.innerHTML = `
        <h3>${repo}</h3>
        <p>${repoRecords.length} hallazgos · ${new Set(repoRecords.map((record) => record.value_stream_group)).size} grupos VSS</p>
      `;
      const linkWrap = document.createElement("div");
      linkWrap.className = "source-card-links";
      [...vssRefs, ...phase2Refs].slice(0, 6).forEach((ref) => {
        if (ref.href) {
          const anchor = document.createElement("a");
          anchor.className = "tag is-link";
          anchor.href = ref.href;
          anchor.textContent = ref.label;
          linkWrap.appendChild(anchor);
          return;
        }
        const span = document.createElement("span");
        span.className = "tag";
        span.title = ref.path || ref.label;
        span.textContent = ref.label;
        linkWrap.appendChild(span);
      });
      card.appendChild(linkWrap);
      elements.sourceGrid.appendChild(card);
    });
  }

  function render() {
    const records = getFilteredRecords();
    renderHeroPanel(records);
    renderKpis(records);
    renderControlPrinciples();
    renderObservationalState(records);
    renderDimensionMatrix(records);
    renderPriorityLadder(records);
    renderDimensionSummary(records);
    renderGapSummary(records);
    renderMaturityEvolution(records);
    renderTracking(records);
    renderGeneralPlan();
    renderVssOverview(records);
    renderVssDetail(records);
    renderLegend();
    renderGantt(records);
    renderThemeInsights(records);
    renderStackComparison(records);
    renderDetailTable(records);
    renderSources(records);
  }

  function counter(items) {
    const counts = new Map();
    items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  }

  function uniqueRefs(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.label}|${item.href || ""}|${item.path || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function shortDate(value) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const normalized = clean.length === 3
      ? clean.split("").map((char) => char + char).join("")
      : clean;
    const intValue = parseInt(normalized, 16);
    const r = (intValue >> 16) & 255;
    const g = (intValue >> 8) & 255;
    const b = intValue & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  async function copyVisibleSummary() {
    const records = getFilteredRecords();
    const summary = summarize(records);
    const evidence = getEvidenceSummary(records);
    const trackingSummary = summarizeTrackingActions(getFilteredTrackingActions(records));
    const dimensionCounts = counter(records.map((record) => classifyDimension(record)))
      .slice(0, 4)
      .map(([dimension, count]) => `${dimension}: ${count}`)
      .join(" | ");
    const themeCounts = counter(records.map((record) => record.priority_theme))
      .slice(0, 4)
      .map(([theme, count]) => `${theme}: ${count}`)
      .join(" | ");
    const streamCounts = counter(records.map((record) => record.value_stream_group))
      .slice(0, 4)
      .map(([stream, count]) => `${stream}: ${count}`)
      .join(" | ");
    const stackCounts = counter(records.map((record) => record.stack))
      .slice(0, 4)
      .map(([stack, count]) => `${stack}: ${count}`)
      .join(" | ");
    const message = [
      "Resumen visible del roadmap",
      `Pain points: ${summary.total}`,
      `Criticidad alta / crítica: ${summary.criticalHighCount}`,
      `Stacks visibles: ${summary.stackCount}`,
      `Repos visibles: ${summary.repoCount}`,
      `Estado actual: ${evidence.profile.stateLabel}`,
      `Evidencia cruzada: ${evidence.withBoth}/${summary.total}`,
      `Tracking visible: ${trackingSummary.total} acciones | pendientes ${trackingSummary.pendingCount} | sin responsable ${trackingSummary.unassignedCount}`,
      `Dimensiones dominantes: ${dimensionCounts}`,
      `Temas dominantes: ${themeCounts}`,
      `VSS dominantes: ${streamCounts}`,
      `Stacks dominantes: ${stackCounts}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(message);
      elements.copySummary.textContent = "Resumen copiado";
      setTimeout(() => {
        elements.copySummary.textContent = "Copiar resumen visible";
      }, 1800);
    } catch (error) {
      elements.copySummary.textContent = "No se pudo copiar";
      setTimeout(() => {
        elements.copySummary.textContent = "Copiar resumen visible";
      }, 1800);
    }
  }

  loadUiState();
  applySidebarState();
  buildFilters();
  render();
})();
