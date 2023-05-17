## hub.getdbt.com

Package hub for [dbt](https://www.getdbt.com).

## Adding a new package

The `hubcap.py` script which generates PRs for new versions of packages is hosted at https://github.com/dbt-labs/hubcap and runs hourly on Heroku. To add a new package to the hub index, create a PR which adds the package name to [this file](https://github.com/dbt-labs/hubcap/blob/master/hub.json).

## Removing/redirecting a package

To remove a package from the hub, add it to [blocklist.json](data/blocklist.json). To notify users of a redirected package name, add a `"redirectname"` key to `data/packages/ORG_NAME/OLD_PACKAGE_NAME/index.json`. See [#1539](https://github.com/dbt-labs/hub.getdbt.com/pull/1539/files) for an example. 
