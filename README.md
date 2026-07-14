# Dotfiles

A minimal, public core with machine-specific config split into per-machine
private repos. Inspired by [Freek Murze's dotfiles](https://github.com/freekmurze/dotfiles)
and his [tour](https://freek.dev/3054-a-tour-of-my-dotfiles).

## Layout

```
~/.dotfiles/
  bin/install              # idempotent bootstrap (safe to re-run)
  home/
    .zshrc                 # oh-my-zsh + sources shared files and the active profile
    .exports               # shared env vars, PATH, guarded tool inits
    .aliases               # shared aliases
    .functions             # shared functions
  config/
    ghostty/config
    starship/starship.toml
    zed/settings.json
    Brewfile               # packages installed on every machine
    git/gitconfig          # shared git config (symlinked to ~/.gitconfig)
    git/gitignore_global   # global gitignore
    oh-my-zsh/             # shared ZSH_CUSTOM (custom plugins/themes)
  profiles/                # machine profiles (contents gitignored)
    current                # active profile: "personal" | "work"
    personal/              # ← its own private repo
    work/                  # ← its own private repo
```

## How it works

`~/.zshrc` (symlinked to `home/.zshrc`) keeps oh-my-zsh for plugins/completions
but uses [starship](https://starship.rs) for the prompt (`ZSH_THEME=""`). On load it:

1. Reads `profiles/current` to find the active profile.
2. Builds `plugins=(git macos docker)` plus the profile's `plugins.zsh`
   (this must happen **before** `oh-my-zsh.sh` is sourced).
3. Sources oh-my-zsh, then the shared `home/.{exports,aliases,functions}`.
4. Sources the profile's remaining `*.zsh` files and adds `profiles/<profile>/bin` to `PATH`.

## Machine profiles

Each machine's aliases, paths, functions, `bin/` scripts, extra oh-my-zsh plugins,
and Homebrew packages live in `profiles/<profile>/`, which is **its own private git repo**
so it can be version-controlled separately from this public one. This repo only tracks
the empty `profiles/` directory; everything under it is gitignored.

A profile mirrors this layout:

```
profiles/<profile>/
  plugins.zsh    # plugins+=(...)   (sourced before oh-my-zsh.sh)
  aliases.zsh
  exports.zsh
  paths.zsh
  functions.zsh
  Brewfile       # packages beyond config/Brewfile
  bin/           # machine-specific scripts (added to PATH)
  install.sh     # optional bootstrap hook — symlinks, extra clones, other setup
```

`install.sh` is the single machine-specific bootstrap hook. `bin/install` runs it
last (after brew, so brew tools are available) with `$DOTFILES` exported. There are
no constraints on what it does — plain `ln -sfn` symlinks, cloning extra repos, etc.

### Git identity & signing

`config/git/gitconfig` is symlinked to `~/.gitconfig` and holds the shared git
config (delta pager, GPG signing on, sensible defaults). Email and the GPG signing
key are machine-specific, so the shared config ends with `[include] path =
~/.gitconfig.local`. Each profile's `install.sh` symlinks its own `gitconfig.local`
into place; being last, it overrides the shared identity block, and a missing file
is ignored.

## Install (new machine)

```sh
git clone git@github.com:apepindev/dotfiles.git ~/.dotfiles
~/.dotfiles/bin/install && exec zsh
```

`bin/install` will:

- install oh-my-zsh and Homebrew if missing,
- symlink `~/.zshrc`, the Ghostty / starship / Zed configs, and `~/.gitconfig` +
  `~/.gitignore_global`,
- prompt for the machine profile (any already present, or a new name) and record it
  in `profiles/current`,
- clone that profile's private repo into `profiles/<profile>` (prompts for the URL),
- run `brew bundle` for `config/Brewfile` and the profile's `Brewfile`,
- run the profile's `install.sh` hook if present.

Re-running is safe and idempotent. `exec zsh` reloads the shell in place once it's done.
