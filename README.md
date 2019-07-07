# Stylus extension for Fepper

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

### Install

```shell
cd extend
npm install --save-dev fp-stylus
```

### Use

Add these tasks to `extend/custom.js`:

* Under gulp task `'custom:frontend-copy'`
  * `'stylus:frontend-copy'`
* Under gulp task `'custom:once'`
  * `'stylus:once'`
* Under gulp task `'custom:watch'`
  * `'stylus:watch'`

On the command line:

```shell
fp stylus[:subtask]
```

The <a href="https://github.com/electric-eloquence/fepper" target="_blank">
main Fepper distribution</a> ships with a `source/_styles/src/stylus` directory 
by default. Create one if there isn't one, and put all Stylus code there.

This extension will read one directory deep for files with a `.styl` extension. 
Partials must be nested deeper. Stylus code will be preprocessed into CSS and 
built into the `paths.source.cssBld` directory as declared in 
`patternlab-config.json`.

This extension defaults toward the printing of line comments for debugging 
purposes. Doing so provides an unambiguous indication that the CSS was 
preprocessed and that direct edits to the CSS should be avoided. If a project 
decision is made to style with Stylus, it would be a good idea to have version 
control ignore CSS builds in the `source` directory. This would avoid committing 
line comments, which could otherwise lead to a morass of conflicts.

Another debugging alternative is writing CSS sourcemaps. (However, this will not 
work if line comments are enabled.) Add the following to 
your `pref.yml` file:

```yaml
stylus:
  linenos: false
  sourcemap: true
```

The `stylus.sourcemap` setting in `pref.yml` allows any of the 
<a href="http://stylus-lang.com/docs/sourcemaps.html" target="_blank">
documented Stylus sourcemap options</a>. Just configure `stylus.sourcemap` as an 
object, and set its properties as desired. Similarly, any 
<a href="https://github.com/stevelacy/gulp-stylus" target="_blank">
documented gulp-stylus option</a> can be configured in `pref.yml` under the 
`stylus` setting.

### Tasks

#### `'stylus'`
* Builds Stylus into CSS.
* Overwrites CSS whether or not it has direct edits.
* Respects the `stylus.linenos` setting in `pref.yml`.
* If `stylus.linenos` is not set, will default to printing line comments.

#### `'stylus:diff-then-comment'`
* Usually under gulp task `'custom:once'`.
* Checks if the Stylus code was modified before overwriting CSS.
* Allows direct edits to CSS without triggering Stylus builds.
* Allows the choice of using Stylus exclusively or not using Stylus exclusively.
* Respects the `stylus.linenos` setting in `pref.yml`.
* If `stylus.linenos` is not set, will default to printing line comments.

#### `'stylus:frontend-copy'`
* Usually under gulp task `'custom:frontend-copy'`.
* Checks if the CSS has line comments or not.
* If it does, it builds Stylus without line comments and copies the CSS to the backend.
* If it does not, it just copies the CSS to the backend.

#### `'stylus:no-comment'`
* Like 'stylus'` and `'stylus:once'` but without line comments.
* Ignores any `stylus.linenos` setting in `pref.yml`.

#### `'stylus:once'`
* Usually under gulp task `'custom:once'`.
* Same as `'stylus'`.

#### `'stylus:watch'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for file modifications.
* Triggers `stylus` and overwrites CSS whether or not it has direct edits.

#### `'stylus:watch-no-comment'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for file modifications.
* Triggers `stylus:no-comment` and overwrites CSS whether or not it has direct 
  edits.

#### `'stylus:watch-write-tmp'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for file modifications.
* Triggers `stylus` and overwrites CSS whether or not it has direct edits.
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.

#### `'stylus:write-tmp'`
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.

[snyk-image]: https://snyk.io/test/github/electric-eloquence/fp-stylus/master/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/fp-stylus/master

[travis-image]: https://img.shields.io/travis/electric-eloquence/fp-stylus.svg?label=mac%20%26%20linux
[travis-url]: https://travis-ci.org/electric-eloquence/fp-stylus

[appveyor-image]: https://img.shields.io/appveyor/ci/e2tha-e/fp-stylus.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/e2tha-e/fp-stylus

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/fp-stylus/master.svg
[coveralls-url]: https://coveralls.io/r/electric-eloquence/fp-stylus

[license-image]: https://img.shields.io/github/license/electric-eloquence/fp-stylus.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/fp-stylus/master/LICENSE
