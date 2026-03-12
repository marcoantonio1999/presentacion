param(
  [Parameter(Mandatory = $true)]
  [string]$RepoName,

  [Parameter(Mandatory = $true)]
  [string]$SourceRoot,

  [Parameter(Mandatory = $true)]
  [string]$SourceLabel,

  [Parameter(Mandatory = $true)]
  [string]$SourceSummary,

  [Parameter(Mandatory = $true)]
  [string]$AnnexFileName,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [string]$AliasOutputPath,
  [string]$AssetVersion = "20260312n"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-HtmlEncoded([string]$Value) {
  return [System.Net.WebUtility]::HtmlEncode($Value)
}

function Remove-Diacritics([string]$Value) {
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }
  return $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function New-Slug([string]$Value) {
  $ascii = Remove-Diacritics $Value
  $slug = $ascii.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
  return $slug.Trim('-')
}

function Get-MarkdownTitle([string]$Path) {
  $firstLine = (Get-Content $Path | Select-Object -First 1).Trim()
  if ($firstLine.StartsWith('#')) {
    return ($firstLine -replace '^#+\s*', '').Trim()
  }
  return [IO.Path]::GetFileNameWithoutExtension($Path)
}

function Get-RelativeBackslashPath([string]$Root, [string]$Path) {
  $rootFull = [IO.Path]::GetFullPath($Root)
  if (-not $rootFull.EndsWith([IO.Path]::DirectorySeparatorChar)) {
    $rootFull += [IO.Path]::DirectorySeparatorChar
  }
  $pathFull = [IO.Path]::GetFullPath($Path)
  $rootUri = New-Object System.Uri($rootFull)
  $pathUri = New-Object System.Uri($pathFull)
  return $rootUri.MakeRelativeUri($pathUri).ToString().Replace('/', '\')
}

function Get-DataValue($Node, [string]$Key) {
  $dataNode = $Node.data | Where-Object { $_.key -eq $Key } | Select-Object -First 1
  if ($null -eq $dataNode) {
    return ""
  }
  if ($null -ne $dataNode.InnerText) {
    return [string]$dataNode.InnerText
  }
  return ""
}

function Format-MermaidLabel([string]$Label, [string]$Type) {
  $safeLabel = $Label
  if ([string]::IsNullOrWhiteSpace($safeLabel)) {
    $safeLabel = "sin etiqueta"
  }
  $safeLabel = $safeLabel.Replace('"', "'").Replace("`r", "").Replace("`n", '<br/>')
  return "$safeLabel<br/>($Type)"
}

function Add-SectionLine([System.Text.StringBuilder]$Builder, [string]$Line) {
  [void]$Builder.AppendLine($Line)
}

function Normalize-MermaidCode([string]$Code) {
  $normalized = [string]$Code
  $subgraphIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($match in [regex]::Matches($normalized, '(?m)^\s*subgraph\s+([A-Za-z0-9_-]+)\s*\[')) {
    [void]$subgraphIds.Add($match.Groups[1].Value)
  }

  if ($subgraphIds.Count -eq 0) {
    return $normalized
  }

  $conflictingNodeIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($match in [regex]::Matches($normalized, '(?m)^\s*([A-Za-z0-9_-]+)\s*\[')) {
    $nodeId = $match.Groups[1].Value
    if ($subgraphIds.Contains($nodeId)) {
      [void]$conflictingNodeIds.Add($nodeId)
    }
  }

  if ($conflictingNodeIds.Count -eq 0) {
    return $normalized
  }

  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($line in ($normalized -split "`r?`n")) {
    if ($line -match '^\s*subgraph\s+[A-Za-z0-9_-]+\s*\[') {
      $lines.Add($line) | Out-Null
      continue
    }

    $updatedLine = $line
    foreach ($nodeId in $conflictingNodeIds) {
      $safeNodeId = "${nodeId}_node"
      $escapedId = [regex]::Escape($nodeId)
      $updatedLine = [regex]::Replace(
        $updatedLine,
        "(?<![A-Za-z0-9_-])$escapedId(?![A-Za-z0-9_-])",
        $safeNodeId
      )
    }
    $lines.Add($updatedLine) | Out-Null
  }

  return ($lines -join "`n")
}

$analysisDir = Join-Path $SourceRoot 'analysis'
$vssRoot = Join-Path $SourceRoot 'VSS\GENERATED'
$repoSummaryPath = Join-Path $analysisDir 'repo_summary.json'
$graphMlPath = Join-Path $analysisDir 'repo_graph.graphml'

if (-not (Test-Path $repoSummaryPath)) {
  throw "No se encontro $repoSummaryPath"
}

$repoSummary = Get-Content $repoSummaryPath -Raw | ConvertFrom-Json
$domains = @()
if ($repoSummary.vss_included) {
  $domains = @($repoSummary.vss_included)
}
if (-not $domains.Count) {
  $domains = @(Get-ChildItem $vssRoot -Directory | Sort-Object Name | Select-Object -ExpandProperty Name)
}

$sections = New-Object System.Collections.Generic.List[object]

$globalMd = Get-ChildItem $analysisDir -Filter 'diagrama_global_*.md' | Sort-Object Name | Select-Object -First 1
$globalMmd = if ($globalMd) { Join-Path $globalMd.DirectoryName ($globalMd.BaseName + '.mmd') } else { $null }
$globalImpactMd = Get-ChildItem $analysisDir -Filter 'impacto_global_*.md' | Sort-Object Name | Select-Object -First 1

if (-not $globalMd -or -not $globalImpactMd) {
  throw "No se encontraron los diagramas globales en $analysisDir"
}

$sections.Add([pscustomobject]@{
  Title = Get-MarkdownTitle $globalMd.FullName
  Anchor = New-Slug (Get-MarkdownTitle $globalMd.FullName)
  Files = @($globalMd.FullName, $(if (Test-Path $globalMmd) { $globalMmd }))
  MarkdownPath = $globalMd.FullName
  RenderPath = $(if (Test-Path $globalMmd) { $globalMmd } else { $globalMd.FullName })
  Open = $true
}) | Out-Null

$sections.Add([pscustomobject]@{
  Title = Get-MarkdownTitle $globalImpactMd.FullName
  Anchor = New-Slug (Get-MarkdownTitle $globalImpactMd.FullName)
  Files = @($globalImpactMd.FullName)
  MarkdownPath = $globalImpactMd.FullName
  RenderPath = $globalImpactMd.FullName
  Open = $false
}) | Out-Null

foreach ($domain in $domains) {
  $domainDir = Join-Path $vssRoot $domain
  $domainAnalysisDir = Join-Path $domainDir 'analysis'
  $domainKey = $domain.ToLowerInvariant()
  $diagramMd = Get-ChildItem $domainAnalysisDir -Filter "diagrama_vss_*_${domainKey}.md" | Sort-Object Name | Select-Object -First 1
  $impactMd = Get-ChildItem $domainAnalysisDir -Filter "diagrama_impacto_vss_*_${domainKey}.md" | Sort-Object Name | Select-Object -First 1
  if (-not $diagramMd -or -not $impactMd) {
    throw "Faltan diagramas del dominio $domain en $domainAnalysisDir"
  }
  $diagramMmd = Join-Path $diagramMd.DirectoryName ($diagramMd.BaseName + '.mmd')
  $impactMmd = Join-Path $impactMd.DirectoryName ($impactMd.BaseName + '.mmd')

  $sections.Add([pscustomobject]@{
    Title = Get-MarkdownTitle $diagramMd.FullName
    Anchor = New-Slug (Get-MarkdownTitle $diagramMd.FullName)
    Files = @($diagramMd.FullName, $(if (Test-Path $diagramMmd) { $diagramMmd }))
    MarkdownPath = $diagramMd.FullName
    RenderPath = $(if (Test-Path $diagramMmd) { $diagramMmd } else { $diagramMd.FullName })
    Open = $false
  }) | Out-Null

  $sections.Add([pscustomobject]@{
    Title = Get-MarkdownTitle $impactMd.FullName
    Anchor = New-Slug (Get-MarkdownTitle $impactMd.FullName)
    Files = @($impactMd.FullName, $(if (Test-Path $impactMmd) { $impactMmd }))
    MarkdownPath = $impactMd.FullName
    RenderPath = $(if (Test-Path $impactMmd) { $impactMmd } else { $impactMd.FullName })
    Open = $false
  }) | Out-Null
}

$mermaidCount = @($sections | Where-Object { $_.Files.Count -gt 1 }).Count
$diagramCount = $sections.Count

$graphInfo = $null
if (Test-Path $graphMlPath) {
  $xml = [xml](Get-Content $graphMlPath -Raw)
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('g', 'http://graphml.graphdrawing.org/xmlns')

  $graphNodes = $xml.SelectNodes('//g:node', $ns)
  $graphEdges = $xml.SelectNodes('//g:edge', $ns)

  $nodeMap = [ordered]@{}
  $duplicateIds = 0
  $typeBuckets = @{}

  foreach ($node in $graphNodes) {
    $originalId = [string]$node.id
    if ($nodeMap.Contains($originalId)) {
      $duplicateIds++
      continue
    }

    $type = Get-DataValue $node 'type'
    if ([string]::IsNullOrWhiteSpace($type)) {
      $type = 'component'
    }
    $label = Get-DataValue $node 'label'
    if ([string]::IsNullOrWhiteSpace($label)) {
      $label = $originalId
    }

    $mermaidId = "g$($nodeMap.Count + 1)"
    $nodeMap[$originalId] = [pscustomobject]@{
      MermaidId = $mermaidId
      Label = $label
      Type = $type
    }

    if (-not $typeBuckets.ContainsKey($type)) {
      $typeBuckets[$type] = New-Object System.Collections.Generic.List[string]
    }
    $typeBuckets[$type].Add($mermaidId) | Out-Null
  }

  $graphLines = New-Object System.Collections.Generic.List[string]
  $graphLines.Add('flowchart LR') | Out-Null
  $graphLines.Add('%% GraphML tecnico renderizado desde repo_graph.graphml') | Out-Null

  foreach ($entry in $nodeMap.GetEnumerator()) {
    $formattedLabel = Format-MermaidLabel $entry.Value.Label $entry.Value.Type
    $graphLines.Add("    $($entry.Value.MermaidId)[`"$formattedLabel`"]") | Out-Null
  }

  foreach ($edge in $graphEdges) {
    $source = [string]$edge.source
    $target = [string]$edge.target
    if (-not $nodeMap.Contains($source) -or -not $nodeMap.Contains($target)) {
      continue
    }
    $relation = Get-DataValue $edge 'relation'
    if ([string]::IsNullOrWhiteSpace($relation)) {
      $relation = 'calls'
    }
    $graphLines.Add("    $($nodeMap[$source].MermaidId) -- `"$relation`" --> $($nodeMap[$target].MermaidId)") | Out-Null
  }

  $graphLines.Add('    classDef component fill:#15305f,stroke:#8fb8ff,color:#eef5ff,stroke-width:1px;') | Out-Null
  $graphLines.Add('    classDef contract_api fill:#4a2a12,stroke:#ffb870,color:#fff3e4,stroke-width:1px;') | Out-Null

  foreach ($bucket in $typeBuckets.GetEnumerator()) {
    if ($bucket.Value.Count -gt 0) {
      $graphLines.Add("    class $([string]::Join(',', $bucket.Value)) $($bucket.Key);") | Out-Null
    }
  }

  $graphMarkdown = @(
    '# GraphML global renderizado',
    '',
    "Transformacion tecnica del archivo ``analysis\repo_graph.graphml`` para visualizar la estructura global dentro del mismo visor. Esta vista no sustituye los $diagramCount entregables VSS; se agrega solo como comparativo adicional.",
    '',
    '```mermaid',
    ($graphLines -join "`n"),
    '```'
  ) -join "`n"

  $graphInfo = [pscustomobject]@{
    UniqueNodes = $nodeMap.Count
    Edges = $graphEdges.Count
    DuplicateIds = $duplicateIds
    Markdown = $graphMarkdown
  }
}

$builder = New-Object System.Text.StringBuilder

Add-SectionLine $builder '<!doctype html>'
Add-SectionLine $builder '<html lang="es">'
Add-SectionLine $builder '<head>'
Add-SectionLine $builder '  <meta charset="utf-8">'
Add-SectionLine $builder '  <meta name="viewport" content="width=device-width, initial-scale=1">'
Add-SectionLine $builder "  <title>Diagramas Value Strem Spect - $RepoName</title>"
Add-SectionLine $builder "  <link rel=""stylesheet"" href=""RESUMEN_EJECUTIVO_4_REPOSITORIOS.css?v=$AssetVersion"">"
Add-SectionLine $builder '</head>'
Add-SectionLine $builder '<body class="dashboard-page diagram-workspace-page" data-dashboard-spa="false">'
Add-SectionLine $builder '  <div class="shell">'
Add-SectionLine $builder '    <header class="hero reveal" id="indice-diagramas">'
Add-SectionLine $builder '      <span class="kicker">Diagramas Value Strem Spect</span>'
Add-SectionLine $builder "      <h1>$RepoName</h1>"
Add-SectionLine $builder '      <p class="hero-mainline">Entrega completa Value Strem Spect en pagina dedicada</p>'
Add-SectionLine $builder "      <p class=""diagram-hero-summary"">$SourceSummary</p>"
Add-SectionLine $builder '      <div class="meta">'
Add-SectionLine $builder "        <span class=""chip"">Fuente: $SourceLabel</span>"
Add-SectionLine $builder "        <span class=""chip"">Dominios: $($domains.Count)</span>"
Add-SectionLine $builder "        <span class=""chip"">Entregables: $diagramCount</span>"
Add-SectionLine $builder "        <span class=""chip"">Mermaid: $mermaidCount</span>"
if ($graphInfo) {
  Add-SectionLine $builder '        <span class="chip">GraphML extra: 1</span>'
}
Add-SectionLine $builder '      </div>'
Add-SectionLine $builder "      <p class=""diagram-hero-links""><a href=""$AnnexFileName#contenido-docs"">Volver al anexo tecnico</a> &middot; <a href=""index.html#value-strem-spect"">Volver al resumen consolidado</a></p>"
Add-SectionLine $builder '    </header>'
Add-SectionLine $builder ''
Add-SectionLine $builder '    <div class="layout">'
Add-SectionLine $builder '      <nav class="toc reveal" aria-label="Indice de diagramas VSS">'
Add-SectionLine $builder '        <h2>Indice de Diagramas</h2>'
Add-SectionLine $builder '        <p class="docs-note">Cada enlace abre el bloque correspondiente y te lleva al diagrama o mapa de impacto exacto.</p>'

for ($i = 0; $i -lt $sections.Count; $i++) {
  $section = $sections[$i]
  Add-SectionLine $builder "        <a href=""#$($section.Anchor)"">$($i + 1). $($section.Title)</a>"
}

if ($graphInfo) {
  Add-SectionLine $builder "        <a href=""#repo-graph-graphml"">$($sections.Count + 1). Render tecnico repo_graph.graphml</a>"
}

Add-SectionLine $builder '      </nav>'
Add-SectionLine $builder ''
Add-SectionLine $builder '      <main>'

for ($i = 0; $i -lt $sections.Count; $i++) {
  $section = $sections[$i]
  $number = $i + 1
  $renderPath = if ($section.PSObject.Properties.Name -contains 'RenderPath' -and $section.RenderPath) { $section.RenderPath } else { $section.MarkdownPath }
  $markdown = Get-Content $renderPath -Raw
  if ([IO.Path]::GetExtension($renderPath).Equals('.mmd', [System.StringComparison]::OrdinalIgnoreCase)) {
    $markdown = Normalize-MermaidCode $markdown
    $markdown = @(
      '```mermaid',
      $markdown.Trim(),
      '```'
    ) -join "`n"
  }
  $encodedMarkdown = Get-HtmlEncoded $markdown
  $sourcePaths = @($section.Files | Where-Object { $_ }) | ForEach-Object { Get-RelativeBackslashPath $SourceRoot $_ }
  $sourceLabelText = [string]::Join(' + ', $sourcePaths)
  $openAttr = if ($section.Open) { ' open' } else { '' }

  Add-SectionLine $builder "        <section id=""$($section.Anchor)"" class=""reveal"">"
  Add-SectionLine $builder "          <h3>$number. $($section.Title)</h3>"
  Add-SectionLine $builder "          <p class=""docs-note"">Fuente: <code>$(Get-HtmlEncoded $sourceLabelText)</code></p>"
  Add-SectionLine $builder '          <article class="repo-content-block">'
  Add-SectionLine $builder "            <details class=""doc-item"" data-render-diagrams=""true""$openAttr>"
  Add-SectionLine $builder "              <summary><span class=""doc-name"">$($section.Title)</span><span class=""doc-path"">$(Get-HtmlEncoded $sourceLabelText)</span></summary>"
  Add-SectionLine $builder "              <pre class=""doc-pre"">$encodedMarkdown</pre>"
  Add-SectionLine $builder '            </details>'
  Add-SectionLine $builder '          </article>'
  Add-SectionLine $builder '        </section>'
}

if ($graphInfo) {
  $graphNumber = $sections.Count + 1
  $encodedGraphMarkdown = Get-HtmlEncoded $graphInfo.Markdown
  Add-SectionLine $builder "        <section id=""repo-graph-graphml"" class=""reveal"">"
  Add-SectionLine $builder "          <h3>$graphNumber. Render tecnico repo_graph.graphml</h3>"
  Add-SectionLine $builder "          <p class=""docs-note"">Fuente: <code>analysis\repo_graph.graphml</code> · Vista adicional para comparar la fuente estructural GraphML contra los diagramas Mermaid. Se normalizaron $($graphInfo.UniqueNodes) nodos unicos, $($graphInfo.Edges) relaciones y $($graphInfo.DuplicateIds) IDs duplicados del archivo original.</p>"
  Add-SectionLine $builder "          <article class=""repo-content-block"">"
  Add-SectionLine $builder "            <details class=""doc-item"" data-render-diagrams=""true"">"
  Add-SectionLine $builder "              <summary><span class=""doc-name"">GraphML global renderizado</span><span class=""doc-path"">analysis\repo_graph.graphml → Mermaid tecnico</span></summary>"
  Add-SectionLine $builder "              <pre class=""doc-pre"">$encodedGraphMarkdown</pre>"
  Add-SectionLine $builder "            </details>"
  Add-SectionLine $builder "          </article>"
  Add-SectionLine $builder "        </section>"
}

Add-SectionLine $builder '      </main>'
Add-SectionLine $builder '    </div>'
Add-SectionLine $builder '  </div>'
Add-SectionLine $builder '  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>'
Add-SectionLine $builder "  <script src=""RESUMEN_EJECUTIVO_4_REPOSITORIOS.js?v=$AssetVersion""></script>"
Add-SectionLine $builder "</body>"
Add-SectionLine $builder "</html>"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($OutputPath, $builder.ToString(), $utf8NoBom)
if ($AliasOutputPath) {
  [IO.File]::WriteAllText($AliasOutputPath, $builder.ToString(), $utf8NoBom)
}
