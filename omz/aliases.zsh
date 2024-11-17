# .dotfiles
alias dotfiles="z ~/.dotfiles"

# Reload ZSH
alias zshreload="source ~/.zshrc"

# Zed
alias z="zed -n"

# DNS flush
alias flsuhdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder; echo \"DNS flushed\""

# Docker
alias docker-stop-all='docker stop $(docker ps -q)'
alias docker-rm-containers='docker rm $(docker ps -aq)'
alias docker-rm-images='docker rmi $(docker images -q)'
alias docker-nuke='docker-stop-all && docker-rm-containers'

# PHPStorm
alias phpstorm='open -na "PhpStorm.app" --args "$@"'

# Run php with Xdebug in CLI
alias phpd="php -dxdebug.mode=debug -dxdebug.start_with_request=yes -dxdebug.client_host=127.0.0.1 -dxdebug.client_port=9003"

# Laravel
alias laravel-new='curl -s "https://laravel.build/$@" | bash'
alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'
