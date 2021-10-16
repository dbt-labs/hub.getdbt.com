## hub.getdbt.com

Package hub for [dbt](https://www.getdbt.com).

## Adding a new package

The `hubcap.py` script which generates PRs for new versions of packages is hosted at https://github.com/fishtown-analytics/hubcap and runs hourly on Heroku. To add a new package to the hub index, create a PR which adds the package name to [this file](https://github.com/fishtown-analytics/hubcap/blob/master/hub.json).

### Development

Clone this repository and install submodules:

```
git submodule update --init
```

...then install dependencies with `bundler`:

```bash
bundle install
```
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

...and run with middleman:

```bash
bundle exec middleman serve --port 4567
```

### In directory bundling

To install gems to the project repo (as opposed to your system-user-level gem folder), use the `--install-dir` flag with the gem install commands above. However, place this flag and corresponding directory path argument _before_ the `--` (this is critical).
