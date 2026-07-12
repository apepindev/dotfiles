fastfetch

# Path to .dotfiles
export DOTFILES="$HOME/.dotfiles"

# Path to your oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Starship provides the prompt, so no oh-my-zsh theme
ZSH_THEME=""

# Shared custom oh-my-zsh plugins/themes
ZSH_CUSTOM="$DOTFILES/config/oh-my-zsh"

# Which machine profile is active (personal | work). Written by bin/install.
[ -r "$DOTFILES/env/current" ] && PROFILE="$(cat "$DOTFILES/env/current")"

# Plugins: shared base + per-machine additions.
# NOTE: the plugins array MUST be set before sourcing oh-my-zsh.sh, so the
# profile's plugins.zsh is sourced here (it appends with `plugins+=(...)`).
plugins=(git macos docker)
[ -n "$PROFILE" ] && [ -r "$DOTFILES/env/$PROFILE/plugins.zsh" ] && source "$DOTFILES/env/$PROFILE/plugins.zsh"

source "$ZSH/oh-my-zsh.sh"

# Shared modular config
for file in "$DOTFILES"/home/.{exports,aliases,functions}; do
  [ -r "$file" ] && source "$file"
done

# Per-machine profile config (plugins.zsh already sourced above, so skip it)
if [ -n "$PROFILE" ]; then
  for file in "$DOTFILES/env/$PROFILE"/*.zsh; do
    [ "$file" = "$DOTFILES/env/$PROFILE/plugins.zsh" ] && continue
    [ -r "$file" ] && source "$file"
  done
  append_path "$DOTFILES/env/$PROFILE/bin"
fi

# Start Starship (always at the end)
eval "$(starship init zsh)"
