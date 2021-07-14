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

...and run with middleman:

```bash
bundle exec middleman serve --port 4567
```



test
