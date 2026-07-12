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
    Brewfile               # packages installed on every machine
    git/gitignore_global   # global gitignore (core.excludesfile)
    oh-my-zsh/             # shared ZSH_CUSTOM (custom plugins/themes)
  env/                     # machine profiles (contents gitignored)
    current                # active profile: "personal" | "work"
    personal/              # ← its own private repo
    work/                  # ← its own private repo
```

## How it works

`~/.zshrc` (symlinked to `home/.zshrc`) keeps oh-my-zsh for plugins/completions
but uses [starship](https://starship.rs) for the prompt (`ZSH_THEME=""`). On load it:

1. Reads `env/current` to find the active profile.
2. Builds `plugins=(...)` from a shared base plus the profile's `plugins.zsh`
   (this must happen **before** `oh-my-zsh.sh` is sourced).
3. Sources oh-my-zsh, then the shared `home/.{exports,aliases,functions}`.
4. Sources the profile's remaining `*.zsh` files and adds `env/<profile>/bin` to `PATH`.

## Machine profiles

Each machine's aliases, paths, functions, `bin/` scripts, extra oh-my-zsh plugins,
and Homebrew packages live in `env/<profile>/`, which is **its own private git repo**
so it can be version-controlled separately from this public one. This repo only tracks
the empty `env/` directory; everything under it is gitignored.

A profile mirrors this layout:

```
env/<profile>/
  plugins.zsh    # plugins+=(...)   (sourced before oh-my-zsh.sh)
  aliases.zsh
  exports.zsh
  paths.zsh
  functions.zsh
  Brewfile       # packages beyond config/Brewfile
  bin/           # machine-specific scripts (added to PATH)
  clone.sh       # optional: repos to clone during bootstrap
```

## Install (new machine)

```sh
git clone git@github.com:apepindev/dotfiles.git ~/.dotfiles
~/.dotfiles/bin/install
```

`bin/install` will:

- install oh-my-zsh and Homebrew if missing,
- symlink `~/.zshrc`, the Ghostty and starship configs, and the global gitignore,
- prompt for the machine profile (`personal`/`work`) and record it in `env/current`,
- clone that profile's private repo into `env/<profile>` (prompts for the URL),
- run `brew bundle` for `config/Brewfile` and the profile's `Brewfile`,
- run the profile's `clone.sh` if present.

Re-running is safe and idempotent.
