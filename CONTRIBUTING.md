# Contributing to this repo

## Overview
There are two components to the [dbt Hub](https://hub.getdbt.com/):

- **hub.getdbt.com:** Our package registry
    - https://github.com/dbt-labs/hub.getdbt.com (this repo!)
    - An indexed collection of JSON files
    - A static site, served by those same JSON files, where users can discover available packages
    - Hosted on Netlify
- **Hubcap:** The way the Hub stays up to date!
    - https://github.com/dbt-labs/hubcap
    - A script that:
        - Catches new package releases when they are available (via GitHub releases)
        - Parses out metadata—crucially, this package's dependencies on *other* Hub packages
        - Records each release in a predictable format (JSON file)
        - Automatically opens a PR against [hub.getdbt.com](http://hub.getdbt.com) to add that JSON file to its indexed collection
    - Hosted on Heroku

## Running locally

### Development

See the [installing Ruby for Mac](#installing-ruby-for-mac) and [troubleshooting](#troubleshooting) sections below as-needed.

Clone this repository and install submodules:

```
git submodule update --init
```

...then install dependencies with `bundler`:

```bash
bundle install
```

...and run with middleman:

```bash
bundle exec middleman serve --port 4567
```

### Use with `dbt deps` from dbt Core

You can set the `DBT_PACKAGE_HUB_URL` environment variable to specify where `dbt deps` should look to resolve dependencies [listed in `packages.yml`](https://docs.getdbt.com/docs/building-a-dbt-project/package-management#how-do-i-add-a-package-to-my-project):
```shell
export DBT_PACKAGE_HUB_URL=http://localhost:4567/
```

Or if you have a Netlify preview created by a pull request:
```
export DBT_PACKAGE_HUB_URL=https://deploy-preview-1717--flamboyant-mcclintock-92ba2d.netlify.app/
```

Suppose your `packages.yml` in your dbt project contains the following content:
```yml
packages:
  - package: tnalpgge/cowsay
    version: 0.3.4
```

Then `dbt deps` will use the JSON served from the following locations:
- `data/packages/tnalpgge/cowsay/index.json`
- `data/packages/tnalpgge/cowsay/versions/0.3.4.json`


### Installing Ruby for Mac

[https://antran.app/2021/m1_mac_part2/](https://antran.app/2021/m1_mac_part2/)

```bash
# Install rbenv
# Follow the printed instructions to load rbenv automatically for your shell
brew install rbenv

# Initialise rbenv
rbenv init

# Verify rbenv
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/main/bin/rbenv-doctor | bash

# Install Ruby
rbenv install 2.7.2

# Set global version
rbenv global 2.7.2

# Restart your shell
```

### Troubleshooting

Some users may get the following errors during `bundle install`:

> An error occurred while installing libv8 (3.16.14.19), and Bundler cannot continue.
Make sure that `gem install libv8 -v '3.16.14.19' --source '<https://rubygems.org/'`> succeeds before bundling.

or:

> An error occurred while installing therubyracer (0.12.3), and Bundler cannot continue.
Make sure that `gem install therubyracer -v '0.12.3' --source '<https://rubygems.org/'`> succeeds before bundling.

```bash
# Prerequisite
brew install v8

# Replace `12.1` below with macOS version
# Replace `3.16.14.19` below with the version number of libv8 in the error message
# https://gist.github.com/fernandoaleman/868b64cd60ab2d51ab24e7bf384da1ca?permalink_comment_id=3927309#gistcomment-3927309
env \
  CXX=clang++ \
  GYPFLAGS=-Dmac_deployment_target=12.1 \
gem install libv8 --version 3.16.14.19

gem install therubyracer -- --with-v8-dir=/usr/local/opt/v8
```

Try re-running:
```shell
bundle install
```

#### In directory bundling

To install gems to the project repo (as opposed to your system-user-level gem folder), use the `--install-dir` flag with the gem install commands above. However, place this flag and corresponding directory path argument _before_ the `--` (this is critical).

## Managing the `Gemfile` and `Gemfile.lock`

Bundler manages gems used in a Ruby application. A file named `Gemfile` in your project root will contain gem names and optional version ranges.

Modifying the version of a Gem used is a two-step process. Modify the reference to a gem in the `Gemfile` and run a `bundle update`.

### Steps

1. Add or modify a gem entry `gem '<gem name>', '<version range>'` in `Gemfile`
2. Execute `bundle update <gem name needing update>`
    - Special formatting in `Gemfile.lock` auto-updates
    - Try not to run a bare `bundle update` as this will possibly update several gems and break your application
3. Commit `Gemfile` and `Gemfile.lock` changes in both to the repo
