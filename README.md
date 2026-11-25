## hub.getdbt.com

Package Hub for [dbt](https://www.getdbt.com).

## Adding a new package

The `hubcap.py` script which generates PRs for new versions of packages is hosted at https://github.com/dbt-labs/hubcap and runs hourly on Heroku. To add a new package to the hub index, create a PR which adds the package name to [this file](https://github.com/dbt-labs/hubcap/blob/master/hub.json).

## Archiving, redirecting, or removing a package

These changes span this repo and [hubcap](https://github.com/dbt-labs/hubcap), which publishes new versions for every repo in its [`hub.json`](https://github.com/dbt-labs/hubcap/blob/main/hub.json).

### Archive a package

The package stays installable, and its page stays up with all its versions, listed as archived. It's hidden from the homepage and the org's page, and stops getting new releases.

1. Add `ORG_NAME/PACKAGE_NAME` to the `packages` list in [blocklist.json](data/blocklist.json). To hide every package in an org, add the org to the `organizations` list instead.
2. Remove the repo from hubcap's [`hub.json`](https://github.com/dbt-labs/hubcap/blob/main/hub.json). If you skip this step, any new tag still gets published.

### Redirect to a new name

If the package was renamed, archive it as above. Then add `"redirectname": "NEW_PACKAGE_NAME"` to `data/packages/ORG_NAME/OLD_PACKAGE_NAME/index.json`. The old package page then shows a banner linking to the new name, and `dbt deps` warns anyone still installing the old name.

### Remove a package or version

Removing a package or version takes it off the hub entirely. Be mindful that `dbt deps` will fail for anyone who still depends on it.

- **Whole package:** first remove the repo from hubcap's `hub.json`, then delete `data/packages/ORG_NAME/PACKAGE_NAME/`. If you do it in the other order, hubcap re-adds any versions whose tags still exist.
- **Single version:** the package maintainer deletes the git tag first. Then delete `data/packages/ORG_NAME/PACKAGE_NAME/versions/VERSION.json`. If the tag still exists, hubcap re-adds the version on its next run.

## JSON data

Structure unlikely to change, but not guaranteed!
- All packages (including hidden/redirected ones): <https://hub.getdbt.com/api/v1/index.json>
- All versions of a single package: <https://hub.getdbt.com/api/v1/dbt-labs/dbt_utils.json>
