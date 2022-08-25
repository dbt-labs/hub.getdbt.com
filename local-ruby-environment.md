### Using local Ruby environment

See the [installing Ruby for Mac](#installing-ruby-for-mac) and [troubleshooting](#troubleshooting) sections below as-needed.

Install dependencies with `bundler` and run with middleman:
```bash
bundle install
bundle exec middleman serve --port 4567
```

### Installing Ruby for Mac

[These](https://antran.app/2021/m1_mac_part2/) instructions are summarized below. They were written with a M1 Mac in mind, but might work for other Macs too. Your mileage may vary.

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
