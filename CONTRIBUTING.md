# Contributing to this repo

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

Suppose your `packages.yml` in your dbt project contains the following content:
```yml
packages:
  - package: tnalpgge/cowsay
    version: 0.3.4
```

Then `dbt deps` will use the JSON in the following locations:
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

_For mac users, if this fails for MacOS <0.16, take a look at [this thread](https://gist.github.com/fernandoaleman/868b64cd60ab2d51ab24e7bf384da1ca#gistcomment-3082045). For Big Sur users, try the following adapted from [this thread](https://github.com/shakacode/react-webpack-rails-tutorial/issues/266):_

```
env \                                                                                                                                                     master
  CXX=clang++ \
  GYPFLAGS=-Dmac_deployment_target=10.16 \  # substitute 10.16 for whatever your Mac OS version is
gem install libv8 --version 3.16.14.19  # exact version may differ on your system

gem install therubyracer -v ‘<whatever version bundler requests>’ -- --with-v8-dir=/usr/local/opt/v8@3.15
```
Note, the precise version of the `with-v8-dir` may differ from what is listed above. Do consult that directory for whatever version your homebrew installed.

Now rerun `bundle install`

#### In directory bundling

To install gems to the project repo (as opposed to your system-user-level gem folder), use the `--install-dir` flag with the gem install commands above. However, place this flag and corresponding directory path argument _before_ the `--` (this is critical).
