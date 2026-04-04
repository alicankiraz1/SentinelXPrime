# Installing SentinelXPrime for Codex

Enable SentinelXPrime skills in Codex via native skill discovery.

## Prerequisites

- Git

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.codex/sentinelxprime
   ```

2. Expose the skills to Codex:

   ```bash
   mkdir -p ~/.agents/skills
   for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
     ln -sfn "$HOME/.codex/sentinelxprime/skills/$name" "$HOME/.agents/skills/$name"
   done
   ```

3. Restart Codex.

## Windows

Use junctions instead of symlinks:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills" | Out-Null
$skills = @("sentinelx-prime", "sentinelx-plan-gap", "sentinelx-review-gate", "sentinelx-test-rig", "using-sentinelx", "shared")
foreach ($name in $skills) {
  cmd /c mklink /J "$env:USERPROFILE\.agents\skills\$name" "$env:USERPROFILE\.codex\sentinelxprime\skills\$name" | Out-Null
}
```

## Verify

```bash
ls -la ~/.agents/skills/sentinelx-prime
```

## Updating

```bash
cd ~/.codex/sentinelxprime && git pull
```

## Uninstall

```bash
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  rm -f "$HOME/.agents/skills/$name"
done
```
