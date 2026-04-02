param(
  [string]$SourceBase = "C:\Users\ordunama\Documents\Hitss\verify_docs\tmp_fase2_extract_20260318",
  [string]$OutputDir = "C:\Users\ordunama\Documents\Hitss\verify_docs\presentacion"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$assetVersion = "20260319-phase2-annexes-v4"

$repos = @(
  @{ Repo = "claro-video-android-coship"; Source = "claro-video-android-coship" },
  @{ Repo = "claro-video-android"; Source = "claro-video-android" },
  @{ Repo = "claro-video-android-request-manager"; Source = "claro-video-android-request-manager" },
  @{ Repo = "claro-video-android-smart-tv"; Source = "claro-video-android-smart-tv" },
  @{ Repo = "claro-video-android-tv"; Source = "claro-video-android-tv" },
  @{ Repo = "claro-video-android-tv-stb"; Source = "claro-video-android-tv-stb" },
  @{ Repo = "claro-video-ios"; Source = "claro-video-ios" },
  @{ Repo = "claro-video-ios-player"; Source = "claro-video-ios-player" },
  @{ Repo = "claro-video-ios-services"; Source = "claro-video-services" },
  @{ Repo = "claro-video-ios-analytics"; Source = "claro-video-ios-analytics" },
  @{ Repo = "claro-video-ios-tvos"; Source = "claro-video-ios-tvos" },
  @{ Repo = "claro-video-web"; Source = "claro-video-web" },
  @{ Repo = "claro-video-web-chromecast"; Source = "claro-video-web-chromecast" },
  @{ Repo = "claro-video-aaf-lg-nativa"; Source = "claro-video-aaf-lg-nativa" },
  @{ Repo = "claro-video-aaf-samsung-nativa"; Source = "claro-video-aaf-samsung-nativa" },
  @{ Repo = "claro-video-aaf-ott"; Source = "claro-video-aaf-ott" },
  @{ Repo = "claro-video-aaf-iptv"; Source = "claro-video-aaf-iptv" },
  @{ Repo = "claro-video-middleware-claro-musica"; Source = "claro-video-middleware-claro-musica" },
  @{ Repo = "claro-video-universal-windows-platform"; Source = "claro-video-universal-windows-platform" },
  @{ Repo = "claro-video-roku-tv"; Source = "claro-video-roku-tv" }
)

$coreDocs = @(
  "TECHNICAL_DEBT.md",
  "RISK_ASSESSMENT.md",
  "QUALITY_AUDIT.md",
  "QUALITY_REPORT.md",
  "ISO_5055_QUALITY_REPORT.md",
  "SECURITY_REVIEW.md",
  "SECURITY_REMEDIATION_PLAN.md"
)

function ConvertTo-HtmlSafeText {
  param([string]$Text)
  return [System.Net.WebUtility]::HtmlEncode([string]$Text)
}

function Get-RelativeDisplayPath {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  if ([string]::IsNullOrWhiteSpace($TargetPath)) {
    return "No disponible"
  }

  return [System.IO.Path]::GetRelativePath($BasePath, $TargetPath).Replace("/", "\")
}

function Get-PreferredSummaryFile {
  param(
    [System.IO.DirectoryInfo]$Root,
    [System.IO.FileInfo[]]$AllMarkdownFiles
  )

  $preferredPatterns = @(
    "\\05-seguimiento\\EXECUTIVE_SUMMARY",
    "\\docs\\05-seguimiento\\EXECUTIVE_SUMMARY",
    "\\03-diagnostico\\README\.md$",
    "\\docs\\03-diagnostico\\README\.md$",
    "EXECUTIVE_SUMMARY",
    "VALIDATION_SUMMARY",
    "README\.md$"
  )

  foreach ($pattern in $preferredPatterns) {
    $match = $AllMarkdownFiles |
      Where-Object { $_.FullName -match $pattern } |
      Sort-Object FullName |
      Select-Object -First 1
    if ($match) {
      return $match
    }
  }

  return $null
}

function Get-FirstNarrativeParagraph {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return "No se detectó un resumen narrativo consistente en la fuente de FASE 2."
  }

  $lines = ($Text -replace "`r", "") -split "`n"
  $buffer = New-Object System.Collections.Generic.List[string]

  foreach ($line in $lines) {
    $trimmed = $line.Trim()

    if (-not $trimmed) {
      if ($buffer.Count -gt 0) { break }
      continue
    }

    if (
      $trimmed.StartsWith("#") -or
      $trimmed.StartsWith(">") -or
      $trimmed.StartsWith("|") -or
      $trimmed.StartsWith("---") -or
      $trimmed.StartsWith("<!--") -or
      $trimmed -match "^\*\*(Versión|Fecha|Proyecto|Orquestador|Fuentes?|Status|Fuente)"
    ) {
      if ($buffer.Count -gt 0) { break }
      continue
    }

    $buffer.Add($trimmed)
  }

  if ($buffer.Count -eq 0) {
    return "No se detectó un resumen narrativo consistente en la fuente de FASE 2."
  }

  $joined = ($buffer -join " ")
  $joined = $joined -replace '\*\*', ""
  $joined = $joined -replace '`', ""
  $joined = $joined -replace '\s{2,}', " "
  return $joined.Trim()
}

function Get-FirstMetric {
  param(
    [string[]]$Texts,
    [string[]]$Patterns
  )

  foreach ($text in $Texts) {
    if ([string]::IsNullOrWhiteSpace($text)) { continue }
    foreach ($pattern in $Patterns) {
      $match = [regex]::Match($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
      if ($match.Success) {
        return $match.Groups[1].Value.Replace(",", ".")
      }
    }
  }

  return "N/D"
}

function Join-LabelList {
  param([string[]]$Items)

  if (-not $Items -or $Items.Count -eq 0) {
    return "No se detectaron artefactos nucleares en la carpeta diagnóstica."
  }

  return ($Items | Sort-Object | ForEach-Object { "<code>$([System.Net.WebUtility]::HtmlEncode($_))</code>" }) -join ", "
}

function Get-DiagramFiles {
  param([System.IO.DirectoryInfo]$Root)

  $diagramDirs = @(Get-ChildItem -Path $Root.FullName -Recurse -Directory |
    Where-Object { $_.Name -eq "diagrams" } |
    Sort-Object FullName)

  if ($diagramDirs.Count -eq 0) {
    return @()
  }

  $diagramFiles = foreach ($dir in $diagramDirs) {
    Get-ChildItem -Path $dir.FullName -File -Filter *.md
  }

  return @($diagramFiles | Sort-Object `
    @{ Expression = {
      switch -Regex (([string]$_.Name).ToUpperInvariant()) {
        "^README\.MD$" { 0; break }
        "^ARCHITECTURE_DIAGRAMS\.MD$" { 1; break }
        "^ISO_5055_HEATMAP\.MD$" { 2; break }
        default { 3 }
      }
    } }, `
    @{ Expression = { $_.FullName } })
}

$manifest = New-Object System.Collections.Generic.List[object]

foreach ($repoDef in $repos) {
  $repoName = [string]$repoDef.Repo
  $sourceName = [string]$repoDef.Source
  $rootPath = Join-Path $SourceBase $sourceName

  if (-not (Test-Path $rootPath)) {
    throw "No se encontró la carpeta fuente de FASE 2 para $repoName en $rootPath"
  }

  $root = Get-Item $rootPath
  $allMarkdownFiles = @(Get-ChildItem -Path $root.FullName -Recurse -File -Filter *.md | Sort-Object FullName)
  $diagDir = Get-ChildItem -Path $root.FullName -Recurse -Directory |
    Where-Object { $_.Name -eq "03-diagnostico" } |
    Sort-Object FullName |
    Select-Object -First 1

  $diagFiles = @()
  if ($diagDir) {
    $diagFiles = @(Get-ChildItem -Path $diagDir.FullName -File -Filter *.md | Sort-Object Name)
  }

  $diagramFiles = @(Get-DiagramFiles -Root $root)

  $summaryFile = Get-PreferredSummaryFile -Root $root -AllMarkdownFiles $allMarkdownFiles

  $docFiles = New-Object System.Collections.Generic.List[System.IO.FileInfo]
  $seenDocs = @{}

  foreach ($candidate in @($summaryFile) + $diagFiles + $diagramFiles) {
    if ($null -eq $candidate) { continue }
    if ($seenDocs.ContainsKey($candidate.FullName)) { continue }
    $seenDocs[$candidate.FullName] = $true
    $docFiles.Add($candidate)
  }

  $summaryText = if ($summaryFile) { Get-Content -Path $summaryFile.FullName -Raw } else { "" }
  $techDebtFile = $diagFiles | Where-Object { $_.Name -like "TECHNICAL_DEBT*" } | Select-Object -First 1
  $isoFile = $diagFiles | Where-Object { $_.Name -like "ISO_5055*" } | Select-Object -First 1
  $riskFile = $diagFiles | Where-Object { $_.Name -like "RISK_ASSESSMENT*" } | Select-Object -First 1

  $techDebtText = if ($techDebtFile) { Get-Content -Path $techDebtFile.FullName -Raw } else { "" }
  $isoText = if ($isoFile) { Get-Content -Path $isoFile.FullName -Raw } else { "" }
  $riskText = if ($riskFile) { Get-Content -Path $riskFile.FullName -Raw } else { "" }

  $tdsValue = Get-FirstMetric -Texts @($summaryText, $techDebtText) -Patterns @(
    "(?:Technical(?:\s+|-)Debt(?:\s+|-)Score|Technical Debt Score|TechDebt Score|TDS|Deuda Técnica Score|Score de Deuda Técnica)[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*/\s*100"
  )

  $isoValue = Get-FirstMetric -Texts @($summaryText, $isoText) -Patterns @(
    "(?:Score General de Calidad ISO/IEC 5055|ISO Score|ISO/IEC 5055[^0-9]{0,60})([0-9]+(?:[.,][0-9]+)?)\s*/\s*100"
  )

  $riskValue = Get-FirstMetric -Texts @($summaryText, $riskText) -Patterns @(
    "(?:Riesgos identificados|Riesgos\s+detectados|Total de riesgos)[^0-9]{0,12}([0-9]+)"
  )

  $corePresent = @($diagFiles | Where-Object { $coreDocs -contains $_.Name } | Select-Object -ExpandProperty Name -Unique)
  $diagramPresent = @($diagramFiles | Select-Object -ExpandProperty Name -Unique)
  $summaryExcerpt = Get-FirstNarrativeParagraph -Text $summaryText
  $diagramMermaidCount = 0

  $docItems = foreach ($file in $docFiles) {
    $relativePath = Get-RelativeDisplayPath -BasePath $root.FullName -TargetPath $file.FullName
    $content = Get-Content -Path $file.FullName -Raw
    $isDiagramDoc = $relativePath -match '(?i)(^|\\)diagrams\\'
    $hasMermaid = $content -match '(?is)```mermaid'
    if ($isDiagramDoc -and $hasMermaid) {
      $diagramMermaidCount += 1
    }
    $detailsAttributes = if ($isDiagramDoc) {
      if ($hasMermaid) {
        ' data-render-diagrams="true" open'
      } else {
        ' data-render-diagrams="true"'
      }
    } else {
      ''
    }
    $displayName = if ($isDiagramDoc) { "Diagrama · $($file.Name)" } else { $file.Name }
@"
            <details class="doc-item"$detailsAttributes>
              <summary><span class="doc-name">$([System.Net.WebUtility]::HtmlEncode($displayName))</span><span class="doc-path">$([System.Net.WebUtility]::HtmlEncode($relativePath))</span></summary>
              <pre class="doc-pre">$([System.Net.WebUtility]::HtmlEncode($content))</pre>
            </details>
"@
  }

  $normalizationNote = if ($repoName -ne $sourceName) {
    "Fuente normalizada desde <code>$([System.Net.WebUtility]::HtmlEncode($sourceName))</code> para mantener el naming del portafolio."
  } else {
    "La fuente se integró con el mismo nombre usado en el portafolio principal."
  }

  $diagDisplay = if ($diagDir) {
    "<code>$([System.Net.WebUtility]::HtmlEncode((Get-RelativeDisplayPath -BasePath $root.FullName -TargetPath $diagDir.FullName)))</code>"
  } else {
    "<code>03-diagnostico</code> no detectado"
  }

  $summaryDisplay = if ($summaryFile) {
    "<code>$([System.Net.WebUtility]::HtmlEncode((Get-RelativeDisplayPath -BasePath $root.FullName -TargetPath $summaryFile.FullName)))</code>"
  } else {
    "<code>Resumen maestro no detectado</code>"
  }

  $diagramDisplay = if ($diagramFiles.Count -gt 0) {
    "Diagramas detectados: <strong>$($diagramFiles.Count)</strong> en carpetas <code>diagrams</code>. Artefactos: $(Join-LabelList -Items $diagramPresent). Diagramas Mermaid renderizables: <strong>$diagramMermaidCount</strong>."
  } else {
    "No se detectaron markdowns adicionales en carpetas <code>diagrams</code>."
  }

  $html = @"
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Anexo FASE 2 - $repoName</title>
  <link rel="stylesheet" href="RESUMEN_EJECUTIVO_4_REPOSITORIOS.css?v=$assetVersion">
</head>
<body class="dashboard-page annex-page phase-two-dashboard-page theme-dark" data-dashboard-spa="false">
  <div class="shell">
    <header class="hero is-visible">
      <span class="kicker">Anexo FASE 2</span>
      <h1>$repoName</h1>
      <p class="hero-mainline">Diagnóstico cuantitativo por documento</p>
      <p><a href="FASE_2_DIAGNOSTICO_20_REPOSITORIOS.html#anexo-fase2">Volver a la single page verde de FASE 2</a></p>
    </header>

    <main class="main">
      <section id="contenido-diagnostico">
        <h3>Anexo FASE 2: $repoName</h3>
        <p class="docs-note">Documentos detectados: $($docFiles.Count) (FASE 2). Ruta diagnóstica base: $diagDisplay. Resumen maestro: $summaryDisplay. $diagramDisplay $normalizationNote</p>

        <div class="kpi-grid" aria-label="Métricas rápidas del anexo FASE 2">
          <article class="kpi">
            <div class="n">$($docFiles.Count)</div>
            <div class="l">documentos embebidos</div>
          </article>
          <article class="kpi">
            <div class="n">$tdsValue</div>
            <div class="l">Technical Debt Score</div>
          </article>
          <article class="kpi">
            <div class="n">$isoValue</div>
            <div class="l">score ISO/IEC 5055</div>
          </article>
          <article class="kpi">
            <div class="n">$($corePresent.Count)</div>
            <div class="l">artefactos núcleo detectados</div>
          </article>
          <article class="kpi">
            <div class="n">$($diagramFiles.Count)</div>
            <div class="l">diagramas markdown detectados</div>
          </article>
        </div>

        <div class="card-grid">
          <article class="mini-card">
            <h4>Resumen ejecutivo detectado</h4>
            <p>$([System.Net.WebUtility]::HtmlEncode($summaryExcerpt))</p>
          </article>
          <article class="mini-card">
            <h4>Artefactos núcleo</h4>
            <p>Disponibles: $(Join-LabelList -Items $corePresent)</p>
          </article>
          <article class="mini-card">
            <h4>Diagramas FASE 2</h4>
            <p>$diagramDisplay</p>
          </article>
          <article class="mini-card">
            <h4>Lectura operativa</h4>
            <p>Este anexo conserva el resumen ejecutivo detectado, el set completo de markdowns de <code>03-diagnostico</code> y los artefactos de <code>diagrams</code> para consulta directa sin salir de la presentación.</p>
          </article>
        </div>

        <article class="repo-content-block">
          <div class="repo-content-head">
            <h4>Repositorio: $repoName</h4>
            <p>Contenido FASE 2 generado desde $diagDisplay y carpetas <code>diagrams</code> detectadas. Riesgos identificados reportados: <strong>$riskValue</strong>.</p>
          </div>
$($docItems -join "`n")
        </article>
      </section>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script src="RESUMEN_EJECUTIVO_4_REPOSITORIOS.js?v=$assetVersion"></script>
</body>
</html>
"@

  $outputFile = Join-Path $OutputDir ("ANEXO_FASE2_{0}.html" -f $repoName)
  Set-Content -Path $outputFile -Value $html -Encoding UTF8

  $manifest.Add([pscustomobject]@{
    Repo = $repoName
    Source = $sourceName
    Output = [System.IO.Path]::GetFileName($outputFile)
    Diag = if ($diagDir) { Get-RelativeDisplayPath -BasePath $root.FullName -TargetPath $diagDir.FullName } else { "N/D" }
    Docs = $docFiles.Count
    TDS = $tdsValue
    ISO = $isoValue
  })
}

$manifest | Sort-Object Repo | Format-Table -AutoSize
