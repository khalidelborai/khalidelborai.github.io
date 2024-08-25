
# Show help
alias help := default
title := "$POST_TITLE"

default:
    @just --list --justfile {{justfile()}} --unsorted

# Install dependencies
install:
    @bundle install

# New Post
post:
    @bundle exec jekyll post {{title}}

# Serve in development
serve:
    @bundle exec jekyll serve
