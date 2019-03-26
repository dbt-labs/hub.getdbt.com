
import json

with open('files') as fh:
    all_files = [f for f in fh.read().split("\n") if len(f.strip()) > 0]

    for fname in all_files:
        with open(fname, 'r') as fh2:
            contents = json.loads(fh2.read().encode())
            url = contents['downloads']['tarball']
            parts = url.split("/")
            org = parts[3]
            repo = parts[4]
            version = parts[6].replace('.tar.gz', '')
            newurl = f'https://codeload.github.com/{org}/{repo}/tar.gz/{version}'
            contents['downloads']['tarball'] = newurl
            new_contents = json.dumps(contents, indent=4)
        with open(fname, 'w') as fh3:
            fh3.write(new_contents)
