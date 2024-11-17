#!/bin/sh

echo "Cloning repositories..."

CODE=$HOME/Code
APEPINDEV=$CODE/apepindev

# GitHub Pages site
git clone git@github.com:apepindev/apepindev.github.io.git $APEPINDEV/apepin.dev

# Jigsaw Blog Plus
git clone git@github.com:apepindev/jigsaw-blog-plus.git $APEPINDEV/jigsaw-blog-plus
