# Contributing to this repo

## Table of contents
- [Contributing to this repo](#contributing-to-this-repo)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Running locally](#running-locally)
    - [Using Docker](#using-docker)
  - [Use with `dbt deps` from dbt Core](#use-with-dbt-deps-from-dbt-core)
    - [Using the dbt CLI in Docker](#using-the-dbt-cli-in-docker)
    - [Using dbt CLI installed locally](#using-dbt-cli-installed-locally)
  - [Managing the `Gemfile` and `Gemfile.lock`](#managing-the-gemfile-and-gemfilelock)
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

See [local-ruby-environment.md](local-ruby-environment.md) for non-Docker instructions.

### Using Docker

docker compose will spin up three containers:
* `dbt-hub`: the package hub app
* `dbt-fusion`: dbt Fusion CLI
* `dbt-core`: dbt core CLI
It also add `tests/sample_project` directory to the `dbt-fusion` and `dbt-core` containers.

To build and start:
```shell
docker-compose build
docker-compose up -d
```

To view package Hub, either of the following should launch the website in your default web browser:
- http://127.0.0.1:4567
- http://localhost:4567

Both `dbt-fusion` and `dbt-core` are set up to use the `dbt-hub` container as the package hub URL, so to test your local hub with `dbt deps`, use these commands:
- `docker-compose run dbt-core deps`
- `docker-compose run dbt-fusion deps`
These will use the project in `tests/sample_project`. If you want to use a different project, you can overwrite the project in that directory or change the `volumes` in `docker-compose.yml` to point to your own directory.

When finished:
```shell
docker-compose down
```

## Use with `dbt deps` from dbt Core

### Using the dbt CLI in Docker

If you're using the `docker-compose` setup described in the "Using Docker" section, you can run `docker-compose run dbt-core deps` to run deps on the project in the `tests/sample_project` directory.

### Using dbt CLI installed locally

**Note:** Make sure to remember to unset any environment variables that you set once you are done! `unset YOUR_VARIABLE_NAME_HERE` should work in bash/zsh. [`direnv`](https://direnv.net/) is one option for loading/unloading environment variables automatically when entering/exiting a directory.

You can set the `DBT_PACKAGE_HUB_URL` environment variable to specify where `dbt deps` should look to resolve dependencies [listed in `packages.yml`](https://docs.getdbt.com/docs/building-a-dbt-project/package-management#how-do-i-add-a-package-to-my-project):
```shell
export DBT_PACKAGE_HUB_URL=http://localhost:4567/
```

Or if you have a Netlify preview created by a pull request:
```
export DBT_PACKAGE_HUB_URL=https://deploy-preview-1717--hub-getdbt-com.netlify.app/
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
