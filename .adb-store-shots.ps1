# Driverless store-shot capture: drives the deterministic first-session journey
# via uiautomator dump + input tap (fallback for when Maestro's driver won't
# start on a software-GPU emulator). Mirrors .maestro-store-shots.yaml.
param(
  [Parameter(Mandatory = $true)][string]$Serial,
  [Parameter(Mandatory = $true)][string]$OutDir
)
$ErrorActionPreference = 'Stop'
$pkg = 'com.hala.emirati.arabic'

function Get-UiXml {
  adb -s $Serial shell uiautomator dump /sdcard/ui.xml *> $null
  adb -s $Serial pull /sdcard/ui.xml "$env:TEMP\hala-ui.xml" *> $null
  return (Get-Content "$env:TEMP\hala-ui.xml" -Raw)
}

function Find-Center([string]$text) {
  $xml = Get-UiXml
  $pat = 'text="' + [regex]::Escape($text) + '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
  $m = [regex]::Match($xml, $pat)
  if (-not $m.Success) { return $null }
  return @{
    X = [int](([int]$m.Groups[1].Value + [int]$m.Groups[3].Value) / 2)
    Y = [int](([int]$m.Groups[2].Value + [int]$m.Groups[4].Value) / 2)
  }
}

function Wait-Text([string]$text, [int]$tries = 12) {
  for ($i = 0; $i -lt $tries; $i++) {
    if (Find-Center $text) { return }
    Start-Sleep -Milliseconds 700
  }
  throw "never appeared: $text"
}

function Tap-Text([string]$text) {
  for ($i = 0; $i -lt 8; $i++) {
    $c = Find-Center $text
    if ($c) {
      adb -s $Serial shell input tap $c.X $c.Y
      Start-Sleep -Milliseconds 900
      return
    }
    Start-Sleep -Milliseconds 700
  }
  throw "not found to tap: $text"
}

function Capture([string]$name) {
  adb -s $Serial shell screencap -p /sdcard/s.png *> $null
  adb -s $Serial pull /sdcard/s.png (Join-Path $OutDir "$name.png") *> $null
  Write-Output "captured $name"
}

# Fresh state -> onboarding -> home
adb -s $Serial shell pm clear $pkg *> $null
adb -s $Serial shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 *> $null
Start-Sleep -Seconds 5
Wait-Text 'Start learning'
Tap-Text 'Start learning'
Wait-Text 'Daily practice'
Start-Sleep -Milliseconds 1000
Capture 'raw_home'

# Practice session: q1 + correct reveal
Tap-Text 'Start'
Wait-Text '1 / 8'
Capture 'raw_question'
Tap-Text 'Peace be upon you'
Wait-Text 'Correct!'
Capture 'raw_correct'

# q2..q8 (curriculum order on a fresh install), then summary
$answers = @(
  'And peace be upon you',
  'Hi / Welcome (warm)',
  'Welcome to you',
  'May God give you life',
  'Good morning',
  'Morning of light',
  'Good evening'
)
foreach ($a in $answers) {
  Tap-Text 'Next'
  Tap-Text $a
}
Tap-Text 'Finish'
Wait-Text 'Session complete'
Start-Sleep -Milliseconds 800
Capture 'raw_summary'
Tap-Text 'Done'
Wait-Text 'Daily practice'

# Search with results, keyboard dismissed (ESC, not BACK)
Tap-Text 'Search English, transliteration, or Arabic'
adb -s $Serial shell input text 'morning'
Start-Sleep -Milliseconds 1000
adb -s $Serial shell input keyevent 111
Start-Sleep -Milliseconds 800
Wait-Text 'Good morning'
Capture 'raw_search'

Write-Output 'ADB CAPTURE DONE'
