'use strict';

const fs = require('fs-extra');
const {basename, dirname, extname} = require('path');

const expect = require('chai').expect;

// Instantiate gulp and assign it to the fp const.
process.env.ROOT_DIR = __dirname;
const fp = require('fepper/tasker');
require('../stylus~extend');

const conf = global.conf;
const pref = global.pref;

const srcCssBldDir = conf.ui.paths.source.cssBld;
const srcCssSrcDir = conf.ui.paths.source.cssSrc;

const cssHtml = 'html {\n  font-size: 62.5%;\n}\n';
const cssBody = `body {
  background: #fff;
  font: 1.6em/1.5 Helvetica, "Nimbus Sans L", "Liberation Sans", Roboto, sans-serif;
  color: #333;
  min-height: 100vh;
  padding-bottom: 5rem;
  position: relative;
}
`;
const cssA = `a {
  color: #333;
}
`;
const cssPseudoClass = `a:hover,
a:focus {
  color: #808080;
}
`;
const enc = 'utf8';
const styleBack = `${__dirname}/backend/docroot/styles/bld/style.css`;
const styleBld = `${srcCssBldDir}/style.css`;
const styleStylus = `${srcCssSrcDir}/stylus/style.styl`;
const styleTmp = `${srcCssSrcDir}/.tmp/style.css`;
const styleWatchCss = `${srcCssBldDir}/watch-fixture.css`;
const styleWatchStylus = `${srcCssSrcDir}/stylus/watch-fixture.styl`;
const styleWatchTmp = `${srcCssSrcDir}/.tmp/watch-fixture.css`;
const sourcemap = `${styleBld}.map`;
const stylusHtml = 'html\n  font-size: 62.5%\n';

function rmSrcCssBldFiles(files) {
  for (let file of files) {
    if (extname(file) === '.css') {
      fs.unlinkSync(`${srcCssBldDir}/${file}`);
    }
  }
}

function rmSrcCssMapFiles(files) {
  for (let file of files) {
    if (extname(file) === '.map') {
      fs.unlinkSync(`${srcCssBldDir}/${file}`);
    }
  }
}

describe('fp-stylus', function () {
  describe('fp stylus', function () {
    let styleBldExistsBefore;

    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleTmp)) {
          fs.emptyDirSync(dirname(styleTmp));
        }

        styleBldExistsBefore = fs.existsSync(styleBld);

        fp.runSequence(
          'stylus',
          done
        );
      });
    });

    it('should compile Stylus partials into a CSS file with line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.contain('/* line 1');
      expect(styleBldCss).to.contain('/* line 2');
      expect(styleBldCss).to.contain('/* line 3');
    });

    it('should not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.equal(false);
    });

    it('should accept custom options', function (done) {
      pref.stylus.compress = true;
      pref.stylus.linenos = false;

      fp.runSequence(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.contain('body{background:#fff;font:1.6em/1.5 Helvetica,"Nimbus Sans L","Liberation Sans",Roboto,sans-serif;color:#333;min-height:100vh;padding-bottom:5rem;position:relative}a{color:#333;}a:hover,a:focus{color:#808080}');

          delete pref.stylus.compress;
          pref.stylus.linenos = true;

          done();
        }
      );
    });

    describe('sourcemapping', function () {
      let sourcemapExistsBefore;

      beforeEach(function (done) {
        fs.readdir(srcCssBldDir, (err, files) => {
          rmSrcCssMapFiles(files);

          sourcemapExistsBefore = fs.existsSync(sourcemap);

          done();
        });
      });

      it('should not write a sourcemap if configured to print line comments', function (done) {
        pref.stylus.linenos = true;
        pref.stylus.sourcemap = true;

        fp.runSequence(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const styleBldCss = fs.readFileSync(styleBld, enc);

            expect(sourcemapExistsBefore).to.equal(false);
            expect(sourcemapExistsAfter).to.equal(false);
            expect(styleBldCss).to.not.contain('/*# sourceMappingURL=');

            delete pref.stylus.sourcemap;

            done();
          }
        );
      });

      it('should write a sourcemap inline if configured to so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = {
          inline: true
        };

        fp.runSequence(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const styleBldCss = fs.readFileSync(styleBld, enc);

            expect(sourcemapExistsBefore).to.equal(false);
            expect(sourcemapExistsAfter).to.equal(false);
            expect(styleBldCss).to.contain('/*# sourceMappingURL=data:application/json;');

            fs.copyFileSync(styleBld, `${conf.ui.paths.public.cssBld}/sourcemap-inline.css`);
            pref.stylus.linenos = true;
            delete pref.stylus.sourcemap;

            done();
          }
        );
      });

      it('should write a sourcemap file if configured to do so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = true;

        fp.runSequence(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const sourcemapJson = fs.readJsonSync(sourcemap);

            expect(sourcemapExistsBefore).to.equal(false);
            expect(sourcemapExistsAfter).to.equal(true);
            expect(sourcemapJson).to.have.property('version');
            expect(sourcemapJson).to.have.property('sources');
            expect(sourcemapJson).to.have.property('names');
            expect(sourcemapJson).to.have.property('mappings');
            expect(sourcemapJson).to.have.property('file');

            fs.copyFileSync(styleBld, `${conf.ui.paths.public.cssBld}/${basename(styleBld)}`);
            fs.copyFileSync(sourcemap, `${conf.ui.paths.public.cssBld}/${basename(sourcemap)}`);
            pref.stylus.linenos = true;
            delete pref.stylus.sourcemap;

            done();
          }
        );
      });

      it('should write a sourcemap file with a custom sourceRoot if configured to so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = {
          sourceRoot: '/foo/bar'
        };

        fp.runSequence(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const sourcemapJson = fs.readJsonSync(sourcemap);

            expect(sourcemapExistsBefore).to.equal(false);
            expect(sourcemapExistsAfter).to.equal(true);
            expect(sourcemapJson.sourceRoot).to.equal(pref.stylus.sourcemap.sourceRoot);

            pref.stylus.linenos = true;
            delete pref.stylus.sourcemap;

            done();
          }
        );
      });
    });
  });

  describe('fp stylus:diff-then-comment', function () {
    let sourcemapExistsBefore;
    let styleBldCssBefore;

    before(function (done) {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }

      fp.runSequence(
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, cssHtml + fs.readFileSync(styleBld, enc));

          styleBldCssBefore = fs.readFileSync(styleBld, enc);

          done();
        }
      );
    });

    beforeEach(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssMapFiles(files);

        sourcemapExistsBefore = fs.existsSync(sourcemap);

        done();
      });
    });

    after(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssMapFiles(files);

        done();
      });
    });

    it(
      'should, on first run, compile a tmp file but not overwrite the old bld file even if it differs',
      function (done)
    {
      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCssAfter = fs.readFileSync(styleBld, enc);
          const styleBldTmp = fs.readFileSync(styleTmp, enc);

          expect(styleBldCssBefore).to.contain(cssHtml);
          expect(styleBldCssBefore).to.contain(cssBody);
          expect(styleBldCssBefore).to.contain(cssA);
          expect(styleBldCssBefore).to.contain(cssPseudoClass);
          expect(styleBldCssBefore).to.not.contain('/* line ');

          expect(styleBldTmp).to.not.contain(cssHtml);
          expect(styleBldTmp).to.contain(cssBody);
          expect(styleBldTmp).to.contain(cssA);
          expect(styleBldTmp).to.contain(cssPseudoClass);
          expect(styleBldTmp).to.not.contain('/* line ');

          expect(styleBldCssBefore).to.equal(styleBldCssAfter);

          done();
        }
      );
    });

    it(
      'should, on subsequent runs, not overwrite the bld file if the new tmp file does not differ from the old tmp file',
      function (done)
    {
      const styleBldTmpBefore = fs.readFileSync(styleTmp, enc);

      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);
          const styleBldTmpAfter = fs.readFileSync(styleTmp, enc);

          expect(styleBldCss).to.contain(cssHtml);
          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.not.contain('/* line ');

          expect(styleBldTmpBefore).to.equal(styleBldTmpAfter);

          expect(styleBldTmpAfter).to.not.contain(cssHtml);
          expect(styleBldTmpAfter).to.contain(cssBody);
          expect(styleBldTmpAfter).to.contain(cssA);
          expect(styleBldTmpAfter).to.contain(cssPseudoClass);
          expect(styleBldTmpAfter).to.not.contain('/* line ');

          done();
        });
      }
    );

    it('should overwrite the bld file if the new tmp file differs from the old tmp file', function (done) {
      fs.copyFileSync(styleBld, styleTmp);

      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.not.contain(cssHtml);
          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.contain('/* line 1');
          expect(styleBldCss).to.contain('/* line 2');
          expect(styleBldCss).to.contain('/* line 3');

          done();
        }
      );
    });

    it('should compile Stylus partials into a tmp file without line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleTmpCss = fs.readFileSync(styleTmp, enc);

          expect(styleTmpCss).to.contain(cssBody);
          expect(styleTmpCss).to.contain(cssA);
          expect(styleTmpCss).to.contain(cssPseudoClass);
          expect(styleTmpCss).to.not.contain('/* line ');

          done();
        }
      );
    });

    it('should compile Stylus partials into a bld file with line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.contain('/* line 1');
          expect(styleBldCss).to.contain('/* line 2');
          expect(styleBldCss).to.contain('/* line 3');

          done();
        }
      );
    });

    it('should write a sourcemap inline if configured to so', function (done) {
      pref.stylus.linenos = false;
      pref.stylus.sourcemap = {
        inline: true
      };

      fp.runSequence(
        // Ensure there are no comments in any .css file in the bld directory.
        // The beforeEach() should unlink any .map file.
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, ''); // Ensure the bld file differs from the new tmp file.
          fs.writeFileSync(styleTmp, ''); // Ensure the old tmp file differs from the new tmp file.

          fp.runSequence(
            'stylus:diff-then-comment',
            () => {
              const sourcemapExistsAfter = fs.existsSync(sourcemap);
              const sourcemapInline = fs.readFileSync(styleBld, enc);

              expect(sourcemapExistsBefore).to.equal(false);
              expect(sourcemapExistsAfter).to.equal(false);
              expect(sourcemapInline).to.contain('/*# sourceMappingURL=data:application/json;');

              pref.stylus.linenos = true;
              delete pref.stylus.sourcemap;

              done();
            }
          );
        }
      );
    });

    it('should write a sourcemap file if configured to do so', function (done) {
      pref.stylus.linenos = false;
      pref.stylus.sourcemap = true;

      fp.runSequence(
        // Ensure there are no comments in any .css file in the bld directory.
        // The beforeEach() should unlink any .map file.
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, ''); // Ensure the bld file differs from the new tmp file.
          fs.writeFileSync(styleTmp, ''); // Ensure the old tmp file differs from the new tmp file.

          fp.runSequence(
            'stylus:diff-then-comment',
            () => {
              const sourcemapExistsAfter = fs.existsSync(sourcemap);
              const sourcemapJson = fs.readJsonSync(sourcemap);

              expect(sourcemapExistsBefore).to.equal(false);
              expect(sourcemapExistsAfter).to.equal(true);
              expect(sourcemapJson).to.have.property('version');
              expect(sourcemapJson).to.have.property('sources');
              expect(sourcemapJson).to.have.property('names');
              expect(sourcemapJson).to.have.property('mappings');
              expect(sourcemapJson).to.have.property('file');

              pref.stylus.linenos = true;
              delete pref.stylus.sourcemap;

              done();
            }
          );
        }
      );
    });
  });

  describe('fp stylus:frontend-copy', function () {
    const styleBackAlt = `${__dirname}/backend/docroot/local-pref/local-pref.css`;
    const styleBldAlt = `${__dirname}/source/_styles/bld/local-pref.css`;
    let styleBackAltExistsBefore;
    let styleBackExistsBefore;

    it(
      'should, if the bld CSS has line comments, compile Stylus without line comments and copy it to the backend',
      function (done)
    {
      if (fs.existsSync(styleBack)) {
        fs.emptyDirSync(dirname(styleBack));
      }

      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSequence(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          fp.runSequence(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBack, enc);

              expect(styleBldCss).to.contain(cssBody);
              expect(styleBldCss).to.contain(cssA);
              expect(styleBldCss).to.contain(cssPseudoClass);
              expect(styleBldCss).to.contain('/* line 1');
              expect(styleBldCss).to.contain('/* line 2');
              expect(styleBldCss).to.contain('/* line 3');

              expect(styleBackExistsBefore).to.equal(false);

              expect(styleBackCss).to.contain(cssBody);
              expect(styleBackCss).to.contain(cssA);
              expect(styleBackCss).to.contain(cssPseudoClass);
              expect(styleBackCss).to.not.contain('/* line ');

              done();
            }
          );
        }
      );
    });

    it('should, if the bld CSS has no line comments, copy it to the backend', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.emptyDirSync(dirname(styleBack));
      }

      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSequence(
        'stylus:no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          fp.runSequence(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBack, enc);

              expect(styleBldCss).to.contain(cssBody);
              expect(styleBldCss).to.contain(cssA);
              expect(styleBldCss).to.contain(cssPseudoClass);
              expect(styleBldCss).to.not.contain('/* line ');

              expect(styleBackExistsBefore).to.equal(false);

              expect(styleBackCss).to.contain(cssBody);
              expect(styleBackCss).to.contain(cssA);
              expect(styleBackCss).to.contain(cssPseudoClass);
              expect(styleBackCss).to.not.contain('/* line ');

              expect(styleBldCss).to.equal(styleBackCss);

              done();
            }
          );
        }
      );
    });

    it(
      'should, if the bld CSS has line comments, compile Stylus without line comments and copy it to an alternate backend directory',
      function (done)
    {
      if (fs.existsSync(styleBack)) {
        fs.unlinkSync(styleBackAlt);
      }

      styleBackAltExistsBefore = fs.existsSync(styleBackAlt);

      fp.runSequence(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBldAlt, enc);

          fp.runSequence(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBackAlt, enc);

              expect(styleBldCss).to.contain(cssBody);
              expect(styleBldCss).to.contain(cssA);
              expect(styleBldCss).to.contain(cssPseudoClass);
              expect(styleBldCss).to.contain('/* line 1');
              expect(styleBldCss).to.contain('/* line 2');
              expect(styleBldCss).to.contain('/* line 3');

              expect(styleBackAltExistsBefore).to.equal(false);

              expect(styleBackCss).to.contain(cssBody);
              expect(styleBackCss).to.contain(cssA);
              expect(styleBackCss).to.contain(cssPseudoClass);
              expect(styleBackCss).to.not.contain('/* line ');

              done();
            }
          );
        }
      );
    });

    it('should, if the bld CSS has no line comments, copy it to an alternate backend directory', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.unlinkSync(styleBackAlt);
      }

      styleBackAltExistsBefore = fs.existsSync(styleBackAlt);

      fp.runSequence(
        'stylus:no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBldAlt, enc);

          fp.runSequence(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBackAlt, enc);

              expect(styleBldCss).to.contain(cssBody);
              expect(styleBldCss).to.contain(cssA);
              expect(styleBldCss).to.contain(cssPseudoClass);
              expect(styleBldCss).to.not.contain('/* line ');

              expect(styleBackAltExistsBefore).to.equal(false);

              expect(styleBackCss).to.contain(cssBody);
              expect(styleBackCss).to.contain(cssA);
              expect(styleBackCss).to.contain(cssPseudoClass);
              expect(styleBackCss).to.not.contain('/* line ');

              expect(styleBldCss).to.equal(styleBackCss);

              done();
            }
          );
        }
      );
    });
  });

  describe('fp stylus:no-comment', function () {
    let styleBldExistsBefore;

    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleTmp)) {
          fs.emptyDirSync(dirname(styleTmp));
        }

        styleBldExistsBefore = fs.existsSync(styleBld);

        fp.runSequence(
          'stylus:no-comment',
          done
        );
      });
    });

    it('should compile Stylus partials into a CSS file without line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.not.contain('/* line ');
    });

    it('should not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.equal(false);
    });
  });

  describe('fp stylus:once', function () {
    let styleBldExistsBefore;

    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        styleBldExistsBefore = fs.existsSync(styleBld);

        fp.runSequence(
          'stylus:once',
          done
        );
      });
    });

    it('should be alias for `fp stylus`', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.contain('/* line 1');
      expect(styleBldCss).to.contain('/* line 2');
      expect(styleBldCss).to.contain('/* line 3');
    });
  });

  describe('fp stylus:watch', function () {
    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    after(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleTmp)) {
          fs.emptyDirSync(dirname(styleTmp));
        }
        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    it('should compile Stylus into bld CSS with line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.contain(cssHtml);
          expect(css).to.contain(cssBody);
          expect(css).to.contain(cssA);
          expect(css).to.contain(cssPseudoClass);
          expect(css).to.contain('/* line 1');
          expect(css).to.contain('/* line 2');
          expect(css).to.contain('/* line 3');

          watcher.close();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('fp stylus:watch-no-comment', function () {
    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    after(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleTmp)) {
          fs.emptyDirSync(dirname(styleTmp));
        }
        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    it('should compile Stylus into bld CSS without line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch-no-comment'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.contain(cssHtml);
          expect(css).to.contain(cssBody);
          expect(css).to.contain(cssA);
          expect(css).to.contain(cssPseudoClass);
          expect(css).to.not.contain('/* line ');

          watcher.close();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('fp stylus:watch-write-tmp', function () {
    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    after(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        if (fs.existsSync(styleTmp)) {
          fs.emptyDirSync(dirname(styleTmp));
        }
        if (fs.existsSync(styleWatchStylus)) {
          fs.unlinkSync(styleWatchStylus);
        }

        done();
      });
    });

    it(
      'should run `fp stylus` when a Stylus partial is modified, but also write a tmp file to allow direct edits to the bld file',
      function (done)
    {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch-write-tmp'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const cssBld = fs.readFileSync(styleWatchCss, enc);
          const cssTmp = fs.readFileSync(styleWatchTmp, enc);

          expect(cssBld).to.contain(cssHtml);
          expect(cssBld).to.contain(cssBody);
          expect(cssBld).to.contain(cssA);
          expect(cssBld).to.contain(cssPseudoClass);
          expect(cssBld).to.contain('/* line 1');
          expect(cssBld).to.contain('/* line 2');
          expect(cssBld).to.contain('/* line 3');

          expect(cssTmp).to.contain(cssHtml);
          expect(cssTmp).to.contain(cssBody);
          expect(cssTmp).to.contain(cssA);
          expect(cssTmp).to.contain(cssPseudoClass);
          expect(cssTmp).to.not.contain('/* line ');

          watcher.close();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('fp stylus:write-tmp', function () {
    let styleTmpExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }

      styleTmpExistsBefore = fs.existsSync(styleTmp);

      fp.runSequence(
        'stylus:write-tmp',
        done
      );
    });

    it('should compile Stylus partials into a CSS file without line comments to the .tmp directory', function () {
      const styleTmpCss = fs.readFileSync(styleTmp, enc);

      expect(styleTmpExistsBefore).to.equal(false);

      expect(styleTmpCss).to.contain(cssBody);
      expect(styleTmpCss).to.contain(cssA);
      expect(styleTmpCss).to.contain(cssPseudoClass);
      expect(styleTmpCss).to.not.contain('/* line ');
    });
  });
});
