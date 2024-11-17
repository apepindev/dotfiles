#!/bin/sh

echo "Setting up your Mac..."

# Check for Oh My Zsh and install if we don't have it
if test ! $(which omz); then
  /bin/sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/HEAD/tools/install.sh)"
fi

# Check if we have Powerlevel10k and install if we don't have it
if test ! $(which p10k); then
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git $HOME/.dotfiles/omz/themes/powerlevel10k
fi

# Check for Homebrew and install if we don't have it
if test ! $(which brew); then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> $HOME/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Removes .zshrc from $HOME (if it exists) and symlinks the .zshrc file from the .dotfiles
rm -rf $HOME/.zshrc
ln -sw $HOME/.dotfiles/.zshrc $HOME/.zshrc

# And do the same for the Powerlevel10k config
rm -rf $HOME/.p10k.zsh
ln -sw $HOME/.dotfiles/.p10k.zsh $HOME/.p10k.zsh

# Update Homebrew recipes
brew update

# Install all our dependencies with bundle (See Brewfile)
brew tap homebrew/bundle
brew bundle --file ./Brewfile

# Create directories
mkdir $HOME/Code

# Create Code subdirectories
mkdir $HOME/Code/apepindev

# Clone Github repositories
./clone.sh

# Symlink the Mackup config file to the home directory
# ln -s ./.mackup.cfg $HOME/.mackup.cfg

# Set macOS preferences - we will run this last because this will reload the shell
# source ./.macos

# Reload shell
source $HOME/.zshrc
