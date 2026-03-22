# .dotfiles
alias dotfiles="$DEFAULT_TEXT_EDITOR ~/.dotfiles"

# Reload ZSH
alias zshreload="source ~/.zshrc"

# Apps
alias storm="open -na PhpStorm.app --args $@"
alias z="zed -n $@"

# Git
alias gci="git checkout integration"

# DNS flush
alias flushdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder; echo \"DNS flushed\""

# Docker
alias dsa='docker stop $(docker ps -q)'
alias dra='docker rm $(docker ps -aq)'
alias dri='docker rmi $(docker images -q)'
alias dsre='docker-stop-all && docker-rm-containers'

# K8s
alias kctx='kubectx'
alias kns='kubens'
alias kc='kube-capacity'

# Run php with Xdebug in CLI
alias phpd="php -dxdebug.mode=debug -dxdebug.start_with_request=yes -dxdebug.client_host=127.0.0.1 -dxdebug.client_port=9003"

# Laravel
alias laravel-new='curl -s "https://laravel.build/$@" | bash'
alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'
