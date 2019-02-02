'use strict';

const path = require('path');

const fs = require('fs-extra');
const gulp = require('gulp');
const gulpStylus = require('gulp-stylus');
const stylus = require('stylus');
const utils = require('fepper-utils');

const conf = global.conf;

const cssBldDir = conf.ui.paths.source.cssBld;
const cssSrcDir = conf.ui.paths.source.cssSrc;

function diffThenRender(commentBool, cb) {
  const cssFilesBld = fs.readdirSync(cssBldDir);
  let hasComments = false;
  let i = cssFilesBld.length;

  while (i--) {
    const cssFileBld = `${cssBldDir}/${cssFilesBld[i]}`;
    const stat = fs.statSync(cssFileBld);

    if (!stat.isFile()) {
      continue;
    }

    const cssOld = fs.readFileSync(cssFileBld, conf.enc);

    hasComments = /^\/\* line \d+ : /m.test(cssOld) && /\.styl \*\/$/m.test(cssOld);

    if (hasComments) {
      break;
    }
  }

  if (hasComments) {
    if (commentBool) {
      gulp.runSequence(
        'stylus:write-tmp',
        'stylus',
        cb
      );
    }
    else {
      gulp.runSequence(
        'stylus:write-tmp',
        'stylus:no-comment',
        cb
      );
    }

    return;
  }

  const stylDir = `${cssSrcDir}/stylus`;
  const stylFiles = fs.readdirSync(stylDir);
  i = stylFiles.length;

  while (i--) {
    const stylFile = `${stylDir}/${stylFiles[i]}`;
    const stylFileObj = path.parse(stylFile);

    if (stylFileObj.ext !== '.styl') {
      if (i === 0) {
        cb();
      }

      continue;
    }

    const stat = fs.statSync(stylFile);

    if (!stat.isFile()) {
      if (i === 0) {
        cb();
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
              utils.error(err);
            }
            else {
              // Declare tmp file for comparison.
              const cssFileTmp = `${cssSrcDir}/.tmp/${stylFileObj.name}.css`;
              let cssFileTmpStr = '';

              if (fs.existsSync(cssFileTmp)) {
                cssFileTmpStr = fs.readFileSync(cssFileTmp, conf.enc);
              }
              else {
                // cssFileTmp probably doesn't exist on first run. Output for future comparison.
                fs.outputFileSync(cssFileTmp, cssNew);
                // Exit this iteration in next block.
                cssFileTmpStr = cssNew;
              }

              // Compare newly rendered css with the contents of the tmp file.
              // Exit if there has been no change. This is the case for users who only edit bld css and do not modify
              // Stylus files.
              if (cssFileTmpStr === cssNew) {
                if (iteration === 0) {
                  cb();
                }

                return;
              }

              // Output tmp file for future comparison.
              fs.outputFileSync(cssFileTmp, cssNew);

              // Now, compare tmp css against bld css.
              const cssFileBld = `${cssBldDir}/${stylFileObj.name}.css`;
              const stat = fs.statSync(cssFileBld);

              if (stat.isFile()) {
                const cssOld = fs.readFileSync(cssFileBld, conf.enc);

                // Only overwrite bld css if tmp css and bld css differ.
                if (cssNew !== cssOld) {
                  stylus(stylFileStr)
                    .set('filename', stylFile)
                    .set('linenos', commentBool)
                    .render(
                      ((iteration1) => {
                        return (err1, cssNew1) => {
                          if (err1) {
                            utils.error(err1);
                          }
                          else {
                            fs.outputFileSync(cssFileBld, cssNew1);
                          }

                          if (iteration1 === 0) {
                            cb();
                          }
                        };
                      })(iteration)
                    );
                }
              }
            }

            if (iteration === 0) {
              cb();
            }
          };
        })(i)
      );

    if (i === 0) {
      cb();
    }
  }
}

function handleError(err) {
  utils.error(err.toString());
  this.emit('end');
}

gulp.task('stylus', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: true
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

// This first checks if the old bld CSS has line comments. If so, it runs the 'stylus' task and returns.
// If there are no line comments, it compiles Stylus without line comments, to compare the new CSS with the old CSS.
// The first time it runs, it just writes the compiled CSS to a tmp file for future comparison.
// On subsequent runs, it compares against the previously written tmp CSS.
// If there's no difference, it exits for that file and moves on to the next file if there is one.
// If there is a difference, it writes the new tmp CSS file.
// It then checks for a difference between the new tmp CSS and the bld CSS.
// If there is a difference, it processes Stylus again with line comments and writes that over the bld CSS.
// The intended result is for users who use Fepper defaults never to notice Stylus being processed if they never edit
// Stylus files, and for users who do edit Stylus files to have Stylus process as expected.
// Power-users should replace this with the 'stylus:once' or 'stylus:no-comment' task for better performance.
gulp.task('stylus:diff-then-comment', function (cb) {
  diffThenRender(true, cb);
});

// Same as 'stylus:diff-then-comment' but with no line comments in rendered CSS.
gulp.task('stylus:diff-then-no-comment', function (cb) {
  diffThenRender(false, cb);
});

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comment', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: false
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:frontend-copy', function (cb) {
  gulp.runSequence(
    'stylus:diff-then-no-comment',
    'fepper:copy-styles',
    cb
  );
});

gulp.task('stylus:once', ['stylus']);

// This outputs tmp files without line comments to check for modifications to Stylus code.
gulp.task('stylus:write-tmp', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: false
    }))
    .on('error', handleError)
    .pipe(gulp.dest(`${cssSrcDir}/.tmp`));
});

gulp.task('stylus:watch', function () {
  gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus']);
});

gulp.task('stylus:watch-no-comment', function () {
  gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus:no-comment']);
});

gulp.task('stylus:watch-write-tmp', function () {
  gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus:write-tmp', 'stylus']);
});
