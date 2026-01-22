## hub.getdbt.com

Package hub for [dbt](https://www.getdbt.com).

## Adding a new package

The `hubcap.py` script which generates PRs for new versions of packages is hosted at https://github.com/dbt-labs/hubcap and runs hourly on Heroku. To add a new package to the hub index, create a PR which adds the package name to [this file](https://github.com/dbt-labs/hubcap/blob/master/hub.json).

## Rename a package

Renaming a package involves two steps:
1. Redirecting from the old name to the new name
1. Removing the old name from the hub homepage

To notify users of a new package name, add a `"redirectname"` key to `data/packages/ORG_NAME/OLD_PACKAGE_NAME/index.json`.

To remove an old package name from the hub homepage, add it to [blocklist.json](data/blocklist.json).

See [#1539](https://github.com/dbt-labs/hub.getdbt.com/pull/1539/files) for an example of both steps. 

## JSON data

Structure unlikely to change, but not guaranteed!
- All packages (including hidden/redirected ones): <https://hub.getdbt.com/api/v1/index.json>
- All versions of a single package: <https://hub.getdbt.com/api/v1/dbt-labs/dbt_utils.json>
