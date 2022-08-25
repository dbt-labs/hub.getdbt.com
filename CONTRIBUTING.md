# Contributing to this repo

## Table of contents
- [Overview](#overview)
- [Running locally](#running-locally)
    - [Using Docker](#using-docker)
- [Use with `dbt deps` from dbt Core](#use-with--dbt-deps--from-dbt-core)
- [Managing the `Gemfile` and `Gemfile.lock`](#managing-the--gemfile--and--gemfilelock-)
    - [Steps](#steps)

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

### Using Docker
```shell
docker-compose build
docker-compose up -d
```

Either of the following should launch the website in your default web browser:
- http://127.0.0.1:4567
- http://localhost:4567

When finished:
```shell
docker-compose down
```

## Use with `dbt deps` from dbt Core

**Note:** Make sure to remember to unset any environment variables that you set once you are done! `unset YOUR_VARIABLE_NAME_HERE` should work in bash/zsh. [`direnv`](https://direnv.net/) is one option for loading/unloading environment variables automatically when entering/exiting a directory.

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

## Managing the `Gemfile` and `Gemfile.lock`

Bundler manages gems used in a Ruby application. A file named `Gemfile` in your project root will contain gem names and optional version ranges.

Modifying the version of a Gem used is a two-step process. Modify the reference to a gem in the `Gemfile` and run a `bundle update`.

### Steps

If using Docker, start an interactive shell on the running container first:
```shell
docker exec -it dbt-hub sh
```
And `exit` when finished performing the bundle update outlined below.

1. Add or modify a gem entry in `Gemfile` with the following syntax:
    - `gem '<gem name>', '<version range>'`
2. Update `Gemfile.lock` with:
    - `bundle update <gem name needing update>` or just `bundle update`
    - Running a bare `bundle update` may update multiple gems
    - Either way, testing will be needed to verify the application still works as intended afterwards
3. Commit `Gemfile` and `Gemfile.lock` changes in both to the repo
