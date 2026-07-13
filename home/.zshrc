fastfetch

# Path to .dotfiles
export DOTFILES="$HOME/.dotfiles"

# Path to your oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Starship provides the prompt, so no oh-my-zsh theme
ZSH_THEME=""

# Shared custom oh-my-zsh plugins/themes
ZSH_CUSTOM="$DOTFILES/config/oh-my-zsh"

# Which machine profile is active (e.g. personal | work). Written by bin/install.
[ -r "$DOTFILES/profiles/current" ] && PROFILE="$(cat "$DOTFILES/profiles/current")"

# Plugins: shared base + per-machine additions.
# NOTE: the plugins array MUST be set before sourcing oh-my-zsh.sh, so the
# profile's plugins.zsh is sourced here (it appends with `plugins+=(...)`).
plugins=(git macos docker)
[ -n "$PROFILE" ] && [ -r "$DOTFILES/profiles/$PROFILE/plugins.zsh" ] && source "$DOTFILES/profiles/$PROFILE/plugins.zsh"

source "$ZSH/oh-my-zsh.sh"

# Shared modular config
for file in "$DOTFILES"/home/.{exports,aliases,functions}; do
  [ -r "$file" ] && source "$file"
done

# Per-machine profile config (plugins.zsh already sourced above, so skip it)
if [ -n "$PROFILE" ]; then
  for file in "$DOTFILES/profiles/$PROFILE"/*.zsh; do
    [ "$file" = "$DOTFILES/profiles/$PROFILE/plugins.zsh" ] && continue
    [ -r "$file" ] && source "$file"
  done
  append_path "$DOTFILES/profiles/$PROFILE/bin"
fi

# Start Starship (always at the end)
eval "$(starship init zsh)"
