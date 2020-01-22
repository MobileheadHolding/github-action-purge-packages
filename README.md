# purge packages for the current repository

Github Action to purge items from the github registry - determined by age, package name and version.

## Options

This action supports the following options.

### owner:

* description: name of the owner/organization of the github registry
* default: owner of the repo the workflow is checked in
* required: `false`
* type: `string`
  
### repo:

* description: name of the repo of the github registry. 
* default: the repo the workflow is checked in
* required: `false`
* type: `string`

### days-old:

* description: number of days the package has to be old to be purged
* required: false
* default: 30

### package-name-query:

* description: 'string to be contained in the package name.'
* required: false
* default: ''

### version-regex:

* description: 'string to be contained in the version. default: *'
* required: false
* default: '*'
  
### package-limit:

* description: 'limit the max number of packages to purge'
* default: 100
  
### version-limit:

* description: 'limit the max number of versions to purge per package'
* default: 10

```yaml
name: package cleanup
on:
  schedule:
    - cron:  '33 * * * *'

jobs:
  try_purging_semantic:
    runs-on: ubuntu-latest
    steps:
      - name: clean packages
        uses: MobileheadHolding/github-action-purge-packages@master
        with:
          owner: github
          repo: semantic
          version-regex: 'sha*'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## build and release

1. run `npm run build`
2. bump version number in `package.json`
3. check in, including compiled `dist/index.js`
4. `git push`
5. `git tag -a "your version" -m "your release message"`
6. `git push origin --tags`

## License ##

MIT License

Copyright (c) 2020-01-20 - Mobilehead Holding GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
