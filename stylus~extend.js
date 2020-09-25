'use strict';

const path = require('path');
const {Transform} = require('stream');

const utils = require('fepper-utils');
const fs = require('fs-extra');
const gulp = global.gulp || require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('stylus');
const Vinyl = require('vinyl');

const gulpStylus = require('./lib/gulp-stylus');

const conf = global.conf;
const pref = global.pref;

// Set up pref.stylus.
pref.stylus = pref.stylus || {};

// Opt for line comments by default.
if (pref.stylus.linenos !== false) {
  pref.stylus.linenos = true;
}

const cssBldDir = conf.ui.paths.source.cssBld; // Do not save .cssSrc because it might be overridden for tests.
const variablesStylPath = conf.ui.paths.source.jsSrc + '/variables.styl';
let vinylPath; // Defined in streamUntouched() to be used in handleError().

const streamUntouched = () => new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(file, enc, cb) {
    vinylPath = file.path;
    this.push(file);
    cb();
  }
});

function getSourcemapDest() {
  if (pref.stylus.sourcemap && !pref.stylus.sourcemap.inline) {
    return '.';
  }

  return;
}

function getSourceRoot() {
  if (pref.stylus.sourcemap) {
    let sourceRoot;

    if (pref.stylus.sourcemap.sourceRoot) {
      sourceRoot = pref.stylus.sourcemap.sourceRoot;
    }
    else {
      const uiSourceDirRel = conf.ui.pathsRelative.source.root;
      const cssSrcDirRel = conf.ui.pathsRelative.source.cssSrc;

      if (cssSrcDirRel.indexOf(uiSourceDirRel) === 0) {
        const nestedDirs = cssSrcDirRel.slice(uiSourceDirRel.length);
        let i = nestedDirs.split('/').length;
        sourceRoot = '';

        while (i--) {
          sourceRoot += '../';
        }

        sourceRoot += `${cssSrcDirRel}/stylus`;
      }
    }

    return sourceRoot;
  }

  return;
}

function testForComments() {
  const cssFilesBld = fs.readdirSync(cssBldDir);
  let hasComments = false;
  let i = cssFilesBld.length;

  while (i--) {
    const cssFileBld = `${cssBldDir}/${cssFilesBld[i]}`;

    /* istanbul ignore if */
    if (!fs.existsSync(cssFileBld)) {
      continue;
    }

    const stat = fs.statSync(cssFileBld);

    if (!stat.isFile()) {
      continue;
    }

    const cssOld = fs.readFileSync(cssFileBld, conf.enc);

    hasComments = (/^\/\* line \d+ : /m.test(cssOld) && /\.styl \*\/$/m.test(cssOld)) ||
      /^\/\*# sourceMappingURL=/m.test(cssOld);

    if (hasComments) {
      break;
    }
  }

  return hasComments;
}

function diffThenComment(cb) {
  const hasComments = testForComments();

  if (hasComments) {
    gulp.runSeq(
      'stylus:write-tmp',
      'stylus',
      cb
    );

    return;
  }

  const stylDir = `${conf.ui.paths.source.cssSrc}/stylus`;

  if (!fs.existsSync(stylDir)) {
    cb();
    return;
  }

  const stylFiles = fs.readdirSync(stylDir);
  let i = stylFiles.length;

  if (i === 0) {
    cb();
    return;
  }

  while (i--) {
    const stylFile = `${stylDir}/${stylFiles[i]}`;

    /* istanbul ignore if */
    if (!fs.existsSync(stylFile)) {
      if (i === 0) {
        cb();
        return;
      }

      continue;
    }

    const stat = fs.statSync(stylFile);

    if (!stat.isFile()) {
      if (i === 0) {
        cb();
        return;
      }

      continue;
    }

    const stylFileObj = path.parse(stylFile);

    if (stylFileObj.ext !== '.styl') {
      /* istanbul ignore if */
      if (i === 0) {
        cb();
        return;
      }

      continue;
    }

    const stylFileStr = fs.readFileSync(stylFile, conf.enc);

    stylus(stylFileStr)
      .set('filename', stylFile)
      .set('linenos', false)
      .render(
        ((iteration) => {
          return (err, cssNew) => {
            if (err) {
              /* istanbul ignore next */
              utils.error(err);

              /* istanbul ignore next */
              if (iteration === 0) {
                cb();
              }
            }
            else {
              // Declare bld file.
              const cssFileBld = `${cssBldDir}/${stylFileObj.name}.css`;
              const cssFileBldExists = fs.existsSync(cssFileBld);
              // Declare tmp file for diffing.
              const cssFileTmp = `${conf.ui.paths.source.cssSrc}/.tmp/${stylFileObj.name}.css`;
              let cssFileTmpStr;

              // If cssFileBld does not exist (quite possibly on a fresh install where it isn't version controlled),
              // we need to render and write it. In this case, keep cssFileTmpStr empty even if cssFileTmp exists.
              if (cssFileBldExists) {
                // For cases where it does exist, set cssFileTmpStr.
                // In cases where cssFileTmp exists, set cssFileTmpStr to the contents of that file.
                if (fs.existsSync(cssFileTmp)) {
                  cssFileTmpStr = fs.readFileSync(cssFileTmp, conf.enc);
                }
                // In cases where cssFileTmp does not exist, output cssFileTmp for future diffing.
                else {
                  // Set cssFileTmpStr == cssNew to skip overwriting cssFileBld.
                  fs.outputFileSync(cssFileTmp, cssNew);
                  // Exit this iteration in next block.
                  cssFileTmpStr = cssNew;
                }
              }

              // Diff newly rendered css against the contents of the tmp file.
              // Exit if there has been no change. This is the case for users who only edit bld css and do not modify
              // Stylus files.
              if (cssFileTmpStr === cssNew) {
                /* istanbul ignore if */
                if (iteration === 0) {
                  cb();
                }

                return;
              }

              // Output tmp file for future diffing.
              fs.outputFileSync(cssFileTmp, cssNew);

              // Now, diff tmp css against bld css.
              const prefStylusClone = Object.assign({}, pref.stylus, {filename: stylFile});
              let stat;

              if (cssFileBldExists) {
                stat = fs.statSync(cssFileBld);
              }

              /* istanbul ignore else */
              if (!cssFileBldExists || stat.isFile()) {
                let cssOld = '';

                if (cssFileBldExists) {
                  cssOld = fs.readFileSync(cssFileBld, conf.enc);
                }

                // Only overwrite bld css if tmp css and bld css differ.
                /* istanbul ignore else */
                if (cssNew !== cssOld) {
                  const style = stylus(stylFileStr, prefStylusClone);

                  style.render(
                    ((iteration1) => {
                      return (err1, cssNew1) => {
                        if (err1) {
                          /* istanbul ignore next */
                          utils.error(err1);
                        }
                        else {
                          fs.outputFileSync(cssFileBld, cssNew1);

                          // Only write sourcemap if not printing line comments and not writing the sourcemap inline.
                          if (style.sourcemap && !prefStylusClone.linenos && !prefStylusClone.sourcemap.inline) {
                            fs.outputFileSync(`${cssFileBld}.map`, JSON.stringify(style.sourcemap));
                          }
                        }

                        /* istanbul ignore if */
                        if (iteration1 === 0) {
                          cb();
                        }
                      };
                    })(iteration)
                  );
                }
                else if (iteration === 0) {
                  cb();
                }
              }
              else if (iteration === 0) {
                cb();
              }
            }
          };
        })(i)
      );
  }
}

function handleError(err) {
  utils.error(err);

  let errorForBrowserInjection = err.toString();
  errorForBrowserInjection = errorForBrowserInjection.slice(errorForBrowserInjection.indexOf('\n') + 1);
  errorForBrowserInjection = errorForBrowserInjection.replace(/\\/g, '/'); // Render Windows file paths.
  errorForBrowserInjection = errorForBrowserInjection.replace(/\n/g, '\\A '); // Render line feeds.
  errorForBrowserInjection = errorForBrowserInjection.replace(/'/g, '\\\''); // Escape internal single-quotes.
  errorForBrowserInjection = 'body::before{background-color:white;color:red;content:\'' + errorForBrowserInjection +
    '\';white-space:pre;}\n';

  const cwd = global.rootDir;
  const vPath = (vinylPath.slice(0, vinylPath.lastIndexOf('.')) + '.css').replace(cwd, '');
  const base = path.dirname(vPath);
  const file = new Vinyl({
    cwd,
    base,
    path: vPath,
    contents: Buffer.from(errorForBrowserInjection)
  });

  this.emit('data', file);
  this.emit('end');
}

// Declare gulp tasks.

gulp.task('stylus', function () {
  const sourceRoot = getSourceRoot();
  let sourcemapsInit = sourcemaps.init;
  let sourcemapsWrite = sourcemaps.write;

  // Do not write sourcemaps if pref.stylus.sourcemap is falsy.
  // Do not write sourcemaps if linenos === true, as the sourcemaps may be inaccurate and the linenos redundant.
  if (!pref.stylus.sourcemap || pref.stylus.linenos) {
    sourcemapsInit = () => {
      return streamUntouched();
    };
    sourcemapsWrite = () => {
      return streamUntouched();
    };
  }

  return gulp.src(conf.ui.paths.source.cssSrc + '/stylus/*.styl')
    .pipe(sourcemapsInit())
    .pipe(gulpStylus(pref.stylus))
    .on('error', handleError)
    .pipe(sourcemapsWrite(getSourcemapDest(), {sourceRoot}))
    .pipe(gulp.dest(cssBldDir));
});

// This first checks if the old bld CSS has line comments. If so, it runs the 'stylus' task.
// It then renders Stylus into tmp CSS files without line comments for future diffing, and returns.
// If the bld CSS has no line comments, it renders Stylus without line comments to diff the new CSS against the old.
// The first time it runs, it just writes the rendered CSS to a tmp file for future diffing.
// On subsequent runs, it diffs against the previously written tmp CSS.
// If there's no difference, it exits for that file and moves on to the next file if there is one.
// If there is a difference, it writes the new tmp CSS file.
// It then checks for a difference between the new tmp CSS and the bld CSS.
// If there is a difference, it renders Stylus again with line comments and writes that over the bld CSS.
// The intent is for users who use Fepper defaults to never render Stylus if they never edit Stylus files,
// and for users who do edit Stylus files to have Stylus render as expected.
// Power-users should replace this with the 'stylus:once' or 'stylus:no-comment' task for better performance.
gulp.task('stylus:diff-then-comment', diffThenComment);

// 'stylus:frontend-copy' checks if there are line comments in the bld CSS.
// If there are, it renders Stylus without line comments for the full 'frontend-copy' task to copy to the backend.
// If there are not, it does nothing and allows the full 'frontend-copy' task to copy the bld CSS to the backend.
gulp.task('stylus:frontend-copy', function (cb) {
  const hasComments = testForComments();

  if (hasComments) {
    gulp.runSeq(
      'stylus:no-comment',
      cb
    );
  }
  else {
    cb();
  }
});

// This renders Stylus without printing line comments. It also never writes sourcemaps.
// You probably want this to preprocess CSS destined for production.
gulp.task('stylus:no-comment', function () {
  const prefStylusClone = Object.assign({}, pref.stylus, {linenos: false});

  return gulp.src(conf.ui.paths.source.cssSrc + '/stylus/*.styl')
    .pipe(streamUntouched())
    .pipe(gulpStylus(prefStylusClone))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:once', ['stylus']);

gulp.task('stylus:watch', function () {
  /* istanbul ignore if */
  if (fs.existsSync(variablesStylPath)) {
    gulp.watch(variablesStylPath, ['stylus']);
  }

  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: conf.ui.paths.source.cssSrc}, ['stylus']);
});

gulp.task('stylus:watch-no-comment', function () {
  /* istanbul ignore if */
  if (fs.existsSync(variablesStylPath)) {
    gulp.watch(variablesStylPath, ['stylus:no-comment']);
  }

  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: conf.ui.paths.source.cssSrc}, ['stylus:no-comment']);
});

gulp.task('stylus:watch-write-tmp', function () {
  /* istanbul ignore if */
  if (fs.existsSync(variablesStylPath)) {
    gulp.watch(variablesStylPath, ['stylus']);
  }

  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: conf.ui.paths.source.cssSrc}, ['stylus:write-tmp', 'stylus']);
});

// This outputs tmp files without line comments to check for modifications to Stylus code.
gulp.task('stylus:write-tmp', function () {
  return gulp.src(conf.ui.paths.source.cssSrc + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: false
    }))
    .on('error', function () /* istanbul ignore next */ {this.emit('end');})
    .pipe(gulp.dest(`${conf.ui.paths.source.cssSrc}/.tmp`));
});

gulp.task('stylus:help', function (cb) {
  let out = `
Fepper Stylus Extension

Use:
    <task> [<additional args>...]

Tasks:
    fp stylus                       Build Fepper's Stylus files into frontend CSS.
    fp stylus:diff-then-comment     Only build if there is a diff against tmp file. Line comment CSS by default.
    fp stylus:frontend-copy         Copy Stylus-built frontend CSS to backend.
    fp stylus:no-comment            Like 'fp stylus' but without line comments.
    fp stylus:once                  Same as 'fp stylus'.
    fp stylus:watch                 Watch for modifications to Stylus files and build when modified.
    fp stylus:watch-no-comment      Like 'fp stylus:watch' but without line comments.
    fp stylus:watch-write-tmp       Like 'fp stylus:watch' but write tmp file for diffing against future builds.
    fp stylus:write-tmp             Write tmp file for diffing against future builds.
    fp stylus:help                  Print fp-stylus tasks and descriptions.
`;

  utils.info(out);
  cb();
});

if (fs.existsSync(conf.ui.paths.source.cssSrc + '/broken')) {
  gulp.task('stylus:test-broken', function () {
    return gulp.src(conf.ui.paths.source.cssSrc + '/broken/broken.styl')
      .pipe(streamUntouched())
      .pipe(gulpStylus(pref.stylus))
      .on('error', handleError)
      .pipe(gulp.dest(cssBldDir));
  });

  gulp.task('stylus:test-broken-partial', function () {
    return gulp.src(conf.ui.paths.source.cssSrc + '/broken/broken-partial.styl')
      .pipe(streamUntouched())
      .pipe(gulpStylus(pref.stylus))
      .on('error', handleError)
      .pipe(gulp.dest(cssBldDir));
  });
}
