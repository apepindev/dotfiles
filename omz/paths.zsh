function append_path {
  case ":$PATH:" in
    *":$1:"*) :;; # already there
    *) PATH="$1:$PATH";; # or PATH="$PATH:$1"
  esac
}

# Add custom dotfiles binaries to path
append_path $DOTFILES/bin

# Add global Composer tools to path
append_path ~/.composer/vendor/bin

# Use Python 3
append_path /opt/homebrew/opt/python@3.8/bin
