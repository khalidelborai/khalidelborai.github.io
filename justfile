title := "$POST_TITLE"

# Show help
alias help := default

default:
    @just --list --justfile {{justfile()}} --unsorted


# New Post
post:
    @bundle exec jekyll post {{title}}

# Serve in development
serve:
    @bundle exec jekyll serve
