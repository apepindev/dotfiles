# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

These are macOS dotfiles: a public core (this repo) plus machine-specific config kept in
separate private repos under `env/`. There is no build/test/lint step — verify changes by
reloading a shell (`source ~/.zshrc`) and checking the shell behaves.

## Two-repo split

- **This repo** = shared core: `home/` (shell config), `config/` (app configs + shared
  `Brewfile` + shared `ZSH_CUSTOM`), `bin/install`.
- **`env/<profile>/`** = one private repo per machine (`personal`, `work`). Everything under
  `env/` is gitignored except `env/.gitkeep`; only the empty dir is tracked here. Do **not**
  add machine-specific aliases/paths/packages to the core — they belong in the profile repo,
  which mirrors the core layout (`aliases.zsh`, `exports.zsh`, `paths.zsh`, `functions.zsh`,
  `plugins.zsh`, `Brewfile`, `bin/`, `clone.sh`).
- `env/current` (one word: `personal` or `work`) selects the active profile at shell startup.

## Shell load order (`home/.zshrc`) — order is load-bearing

1. Read `env/current` → `$PROFILE`.
2. Set `plugins=(git macos docker)`, then source the profile's `plugins.zsh` (which appends via
   `plugins+=(...)`). **This must happen before `oh-my-zsh.sh` is sourced** — oh-my-zsh reads
   the array once at source time. `plugins.zsh` is the one profile file sourced here, out of band.
3. Source `oh-my-zsh.sh`.
4. Source shared `home/.{exports,aliases,functions}`.
5. Source the profile's remaining `*.zsh` (skipping the already-sourced `plugins.zsh`), then add
   `env/<profile>/bin` to PATH.
6. `starship init` last (starship is the prompt; `ZSH_THEME=""` disables the oh-my-zsh theme).

`append_path` (defined in `home/.exports`) prepends to PATH only if absent — use it instead of
raw `PATH=` assignments so re-sourcing `.zshrc` stays idempotent.

## Files are symlinked, not copied

`bin/install` symlinks `home/.zshrc` → `~/.zshrc`, the Ghostty/starship configs into `~/.config`,
and points `git core.excludesfile` at `config/git/gitignore_global`. Editing files in this repo
edits the live config directly; changes take effect on next shell reload. `bin/install` is
idempotent — re-run it after adding a new symlink or changing bootstrap steps.

## Adding packages

Shared/every-machine packages go in `config/Brewfile`; machine-specific ones in
`env/<profile>/Brewfile`. `bin/install` runs `brew bundle` against both.
