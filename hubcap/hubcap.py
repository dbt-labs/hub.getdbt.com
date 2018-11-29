
import dbt.clients.git
import dbt.clients.system
import dbt.config
import dbt.exceptions

import collections
import os
import time
import datetime
import json

import io
import hashlib
import requests


"""
    TODO:
        - [ ] make a PR if everything checks out
        - [ ] clean up the code
"""

NOW = int(time.time())
NOW_ISO = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()

CWD = os.path.dirname(os.path.realpath(__file__))
ROOT_DIR = os.path.dirname(CWD)

TMP_DIR = os.path.join(CWD, "git-tmp")
dbt.clients.system.make_directory(TMP_DIR)

INDEX_DIR = os.path.join(ROOT_DIR, "data")
indexed_files = dbt.clients.system.find_matching(INDEX_DIR, ['packages'], '*.json')

config = {}
with open("config.json", "r") as fh:
    config = json.loads(fh.read())

TRACKED_REPOS = config['tracked_repos']
ONE_BRANCH_PER_REPO = config['one_branch_per_repo']
PUSH_BRANCHES = config['push_branches']
REMOTE = config['remote']

index = collections.defaultdict(lambda : collections.defaultdict(list))
for path in indexed_files:
    abs_path = path['absolute_path']
    filename = os.path.basename(abs_path)

    if filename == 'index.json':
        continue

    pop_1 = os.path.dirname(abs_path)
    pop_2 = os.path.dirname(pop_1)
    pop_3 = os.path.dirname(pop_2)

    repo_name = os.path.basename(pop_2)
    org_name = os.path.basename(pop_3)

    version = filename[:-5]
    info = {"path": abs_path, "version": version}
    index[org_name][repo_name].append(info)


try:
    dbt.clients.git.clone_and_checkout(REMOTE, cwd=TMP_DIR, dirname="ROOT")
except dbt.exception.CommandResultError as e:
    print(e.stderr.decode())
    raise

dbt.clients.system.run_cmd(ROOT_DIR, ['git', 'submodule', 'init'])
dbt.clients.system.run_cmd(ROOT_DIR, ['git', 'submodule', 'update'])

def download(url):
    response = requests.get(url)

    file_buf = b""
    for block in response.iter_content(1024*64):
        file_buf += block

    return file_buf

def get_sha1(url):
    print("    downloading: {}".format(url))
    contents = download(url)
    hasher = hashlib.sha1()
    hasher.update(contents)
    digest = hasher.hexdigest()
    print("      SHA1: {}".format(digest))
    return digest

def make_spec(org, repo, version, git_path):
    tarball_url = "https://github.com/{}/{}/archive/{}.tar.gz".format(org, repo, version)
    sha1 = get_sha1(tarball_url)

    project = dbt.config.Project.from_project_root(git_path, {})
    packages = project.packages.packages

    return {
        "id": "{}/{}/{}".format(org, repo, version),
        "name": repo,
        "version": version,
        "published_at": NOW_ISO,
        "packages": packages,
        "works_with": [],
        "_source": {
            "type": "github",
            "url": "https://github.com/{}/{}/tree/{}/".format(org, repo, version),
            "readme": "https://raw.githubusercontent.com/{}/{}/{}/README.md".format(org, repo, version)
        },
        "downloads": {
            "tarball": tarball_url,
            "format": "tgz",
            "sha1": sha1
        }
    }


def make_index(org_name, repo, existing, tags):
    description = "dbt models for {}".format(repo)
    assets = {
        "logo": "logos/placeholder.svg".format(repo)
    }

    if isinstance(existing, dict):
        description = existing.get('description', description)
        assets = existing.get('assets', assets)

    import dbt.semver
    version_tags = []
    for tag in tags:
        if tag.startswith('v'):
            tag = tag[1:]

        version_tag = dbt.semver.VersionSpecifier.from_version_string(tag)
        version_tags.append(version_tag)

    # find latest tag which is not a prerelease
    latest = version_tags[0]
    for version_tag in version_tags:
        if version_tag > latest and not version_tag.prerelease:
            latest = version_tag

    return {
        "name": repo,
        "namespace": org_name,
        "description": description,
        "latest": latest.to_version_string().replace("=", ""), # LOL
        "assets": assets,
    }

new_branches = {}
for org_name, repos in TRACKED_REPOS.items():
    for repo in repos:
        try:
            clone_url = 'https://github.com/{}/{}.git'.format(org_name, repo)
            git_path = os.path.join(TMP_DIR, repo)

            print("Cloning repo {}".format(clone_url))
            dbt.clients.git.clone_and_checkout(clone_url, cwd=TMP_DIR, dirname=repo)

            tags = dbt.clients.git.list_tags(git_path)

            existing_tags = [i['version'] for i in index[org_name][repo]]
            print("  Found Tags: {}".format(sorted(tags)))
            print("  Existing Tags: {}".format(sorted(existing_tags)))

            new_tags = set(tags) - set(existing_tags)

            if len(new_tags) == 0:
                print("    No tags to add. Skipping")
                continue

            # check out a new branch for the changes
            if ONE_BRANCH_PER_REPO:
                branch_name = 'bump-{}-{}-{}'.format(org_name, repo, NOW)
            else:
                branch_name = 'bump-{}'.format(NOW)

            index_path = os.path.join(TMP_DIR, "ROOT")
            print("    Checking out branch {} in meta-index".format(branch_name))

            try:
                out, err = dbt.clients.system.run_cmd(index_path, ['git', 'checkout', branch_name])
            except dbt.exceptions.CommandResultError as e:
                dbt.clients.system.run_cmd(index_path, ['git', 'checkout', '-b', branch_name])

            new_branches[branch_name] = {"org": org_name, "repo": repo}
            index_file_path = os.path.join(index_path, 'data', 'packages', org_name, repo, 'index.json')

            if os.path.exists(index_file_path):
                existing_index_file_contents = dbt.clients.system.load_file_contents(index_file_path)
                try:
                    existing_index_file = json.loads(existing_index_file_contents)
                except:
                    existing_index_file = []
            else:
                existing_index_file = {}

            new_index_entry = make_index(org_name, repo, existing_index_file, set(tags) | set(existing_tags))
            repo_dir = os.path.join(index_path, 'data', 'packages', org_name, repo, 'versions')
            dbt.clients.system.make_directory(repo_dir)
            dbt.clients.system.write_file(index_file_path, json.dumps(new_index_entry, indent=4))

            for i, tag in enumerate(sorted(new_tags)):
                print("    Adding tag: {}".format(tag))

                version_path = os.path.join(repo_dir, "{}.json".format(tag))

                package_spec = make_spec(org_name, repo, tag, git_path)
                dbt.clients.system.write_file(version_path, json.dumps(package_spec, indent=4))

                msg = "hubcap: Adding tag {} for {}/{}".format(tag, org_name, repo)
                print("      running `git add`")
                res = dbt.clients.system.run_cmd(repo_dir, ['git', 'add', '-A'])
                if len(res[1]):
                    print("ERROR" + res[1].decode())
                print("      running `git commit`")
                res = dbt.clients.system.run_cmd(repo_dir, ['git', 'commit', '-am', '{}'.format(msg)])
                if len(res[1]):
                    print("ERROR" + res[1].decode())

            # good house keeping
            dbt.clients.system.run_cmd(index_path, ['git', 'checkout', 'master'])
            print()

        except dbt.exceptions.SemverException as e:
            print("Semver exception. Skipping\n  {}".format(e))

        except Exception as e:
            print("Unhandled exception. Skipping\n  {}".format(e))

        except RuntimeError as e:
            print("Unhandled exception. Skipping\n  {}".format(e))

def make_pr(ORG, REPO, head):
    url = 'https://api.github.com/repos/fishtown-analytics/hub.getdbt.com/pulls'
    body = {
        "title": "HubCap: Bump {}/{}".format(ORG, REPO),
        "head": head,
        "base": "master",
        "body": "Auto-bumping from new release at https://github.com/{}/{}/releases".format(ORG, REPO),
        "maintainer_can_modify": True
    }
    body = json.dumps(body)

    user = config['user']['name']
    token = config['user']['token']
    req = requests.post(url, data=body, headers={'Content-Type': 'application/json'}, auth=(user, token))

# push new branches, if there are any
print("Push branches? {} - {}".format(PUSH_BRANCHES, list(new_branches.keys())))
if PUSH_BRANCHES and len(new_branches) > 0:
    hub_dir = os.path.join(TMP_DIR, "ROOT")
    try:
        dbt.clients.system.run_cmd(hub_dir, ['git', 'remote', 'add', 'hub', REMOTE])
    except dbt.exceptions.CommandResultError as e:
        print(e.stderr.decode())

    for branch, info in new_branches.items():
        try:
            dbt.clients.system.run_cmd(index_path, ['git', 'checkout', branch])
            try:
                dbt.clients.system.run_cmd(hub_dir, ['git', 'fetch', '--unshallow', 'hub'])
            except dbt.exceptions.CommandResultError as e:
                print(e.stderr.decode())
            res = dbt.clients.system.run_cmd(hub_dir, ['git', 'push', 'hub', branch])
            print(res[1].decode())
            make_pr(info['org'], info['repo'], branch)
        except Exception as e:
            print(e)
