# Installing SentinelXPrime for OpenCode

SentinelXPrime uses OpenCode's native skills directories in v1.

## Prerequisites

- OpenCode installed
- Git

## Personal Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.config/opencode/sentinelxprime
   ```

2. Expose the skills:

   ```bash
   mkdir -p ~/.config/opencode/skills
   for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
     ln -sfn "$HOME/.config/opencode/sentinelxprime/skills/$name" "$HOME/.config/opencode/skills/$name"
   done
   ```

3. Restart OpenCode.

## Project-Local Installation

From a project root:

```bash
mkdir -p .opencode/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "/absolute/path/to/SentinelXPrime/skills/$name" ".opencode/skills/$name"
done
```

## Verify

Ask OpenCode to list available skills, then confirm `sentinelx-prime` is visible.

## Updating

```bash
cd ~/.config/opencode/sentinelxprime && git pull
```
