function append_path {
  case ":$PATH:" in
    *":$1:"*) :;; # already there
    *) PATH="$1:$PATH";; # or PATH="$PATH:$1"
  esac
}

# Add custom dotfiles binaries to path
append_path $DOTFILES/bin

# Add locally installed binaries
append_path $HOME/.local/bin

# Add global Composer tools to path
append_path $HOME/.composer/vendor/bin

append_path $HOME/.bun/bin

append_path /opt/homebrew/share/google-cloud-sdk/bin
