'use strict';

const fs = require('fs-extra');
const {basename, dirname, extname, normalize} = require('path');

const {expect} = require('chai');

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

        fp.runSeq(
          'stylus',
          done
        );
      });
    });

    it('compiles Stylus partials into a CSS file with line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.be.false;

      expect(styleBldCss).to.have.string(cssBody);
      expect(styleBldCss).to.have.string(cssA);
      expect(styleBldCss).to.have.string(cssPseudoClass);
      expect(styleBldCss).to.have.string('/* line 1');
      expect(styleBldCss).to.have.string('/* line 2');
      expect(styleBldCss).to.have.string('/* line 3');
    });

    it('does not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.be.false;
    });

    it('accepts custom options', function (done) {
      pref.stylus.compress = true;
      pref.stylus.linenos = false;

      fp.runSeq(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.have.string('body{background:#fff;font:1.6em/1.5 Helvetica,"Nimbus Sans L","Liberation Sans",Roboto,sans-serif;color:#333;min-height:100vh;padding-bottom:5rem;position:relative}a{color:#333}a:hover,a:focus{color:#808080}');

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

      it('does not write a sourcemap if configured to print line comments', function (done) {
        pref.stylus.linenos = true;
        pref.stylus.sourcemap = true;

        fp.runSeq(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const styleBldCss = fs.readFileSync(styleBld, enc);

            expect(sourcemapExistsBefore).to.be.false;
            expect(sourcemapExistsAfter).to.be.false;
            expect(styleBldCss).to.not.have.string('/*# sourceMappingURL=');

            delete pref.stylus.sourcemap;

            done();
          }
        );
      });

      it('writes a sourcemap inline if configured to so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = {
          inline: true
        };

        fp.runSeq(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const styleBldCss = fs.readFileSync(styleBld, enc);

            expect(sourcemapExistsBefore).to.be.false;
            expect(sourcemapExistsAfter).to.be.false;
            expect(styleBldCss).to.have.string('/*# sourceMappingURL=data:application/json;');

            fs.copyFileSync(styleBld, `${conf.ui.paths.public.cssBld}/sourcemap-inline.css`);
            pref.stylus.linenos = true;
            delete pref.stylus.sourcemap;

            done();
          }
        );
      });

      it('writes a sourcemap file if configured to do so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = true;

        fp.runSeq(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const sourcemapJson = fs.readJsonSync(sourcemap);

            expect(sourcemapExistsBefore).to.be.false;
            expect(sourcemapExistsAfter).to.be.true;
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

      it('writes a sourcemap file with a custom sourceRoot if configured to so', function (done) {
        pref.stylus.linenos = false;
        pref.stylus.sourcemap = {
          sourceRoot: '/foo/bar'
        };

        fp.runSeq(
          'stylus',
          () => {
            const sourcemapExistsAfter = fs.existsSync(sourcemap);
            const sourcemapJson = fs.readJsonSync(sourcemap);

            expect(sourcemapExistsBefore).to.be.false;
            expect(sourcemapExistsAfter).to.be.true;
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

      fp.runSeq(
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

    it('on first run, compiles a tmp file but not overwrite the old bld file even if it differs', function (done) {
      fp.runSeq(
        'stylus:diff-then-comment',
        () => {
          const styleBldCssAfter = fs.readFileSync(styleBld, enc);
          const styleBldTmp = fs.readFileSync(styleTmp, enc);

          expect(styleBldCssBefore).to.have.string(cssHtml);
          expect(styleBldCssBefore).to.have.string(cssBody);
          expect(styleBldCssBefore).to.have.string(cssA);
          expect(styleBldCssBefore).to.have.string(cssPseudoClass);
          expect(styleBldCssBefore).to.not.have.string('/* line ');

          expect(styleBldTmp).to.not.have.string(cssHtml);
          expect(styleBldTmp).to.have.string(cssBody);
          expect(styleBldTmp).to.have.string(cssA);
          expect(styleBldTmp).to.have.string(cssPseudoClass);
          expect(styleBldTmp).to.not.have.string('/* line ');

          expect(styleBldCssBefore).to.equal(styleBldCssAfter);

          done();
        }
      );
    });

    it('on subsequent runs, does not overwrite the bld file if the new tmp file does not differ from the old tmp file\
', function (done) {
      const styleBldTmpBefore = fs.readFileSync(styleTmp, enc);

      fp.runSeq(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);
          const styleBldTmpAfter = fs.readFileSync(styleTmp, enc);

          expect(styleBldCss).to.have.string(cssHtml);
          expect(styleBldCss).to.have.string(cssBody);
          expect(styleBldCss).to.have.string(cssA);
          expect(styleBldCss).to.have.string(cssPseudoClass);
          expect(styleBldCss).to.not.have.string('/* line ');

          expect(styleBldTmpBefore).to.equal(styleBldTmpAfter);

          expect(styleBldTmpAfter).to.not.have.string(cssHtml);
          expect(styleBldTmpAfter).to.have.string(cssBody);
          expect(styleBldTmpAfter).to.have.string(cssA);
          expect(styleBldTmpAfter).to.have.string(cssPseudoClass);
          expect(styleBldTmpAfter).to.not.have.string('/* line ');

          done();
        }
      );
    });

    it('overwrites the bld file if the new tmp file differs from the old tmp file', function (done) {
      fs.copyFileSync(styleBld, styleTmp);

      fp.runSeq(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.not.have.string(cssHtml);
          expect(styleBldCss).to.have.string(cssBody);
          expect(styleBldCss).to.have.string(cssA);
          expect(styleBldCss).to.have.string(cssPseudoClass);
          expect(styleBldCss).to.have.string('/* line 1');
          expect(styleBldCss).to.have.string('/* line 2');
          expect(styleBldCss).to.have.string('/* line 3');

          done();
        }
      );
    });

    it('compiles Stylus partials into a tmp file without line comments', function (done) {
      fp.runSeq(
        'stylus:diff-then-comment',
        () => {
          const styleTmpCss = fs.readFileSync(styleTmp, enc);

          expect(styleTmpCss).to.have.string(cssBody);
          expect(styleTmpCss).to.have.string(cssA);
          expect(styleTmpCss).to.have.string(cssPseudoClass);
          expect(styleTmpCss).to.not.have.string('/* line ');

          done();
        }
      );
    });

    it('compiles Stylus partials into a bld file with line comments', function (done) {
      fp.runSeq(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.have.string(cssBody);
          expect(styleBldCss).to.have.string(cssA);
          expect(styleBldCss).to.have.string(cssPseudoClass);
          expect(styleBldCss).to.have.string('/* line 1');
          expect(styleBldCss).to.have.string('/* line 2');
          expect(styleBldCss).to.have.string('/* line 3');

          done();
        }
      );
    });

    it('writes a sourcemap inline if configured to so', function (done) {
      pref.stylus.linenos = false;
      pref.stylus.sourcemap = {
        inline: true
      };

      fp.runSeq(
        // Ensure there are no comments in any .css file in the bld directory.
        // The beforeEach() should unlink any .map file.
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, ''); // Ensure the bld file differs from the new tmp file.
          fs.writeFileSync(styleTmp, ''); // Ensure the old tmp file differs from the new tmp file.

          fp.runSeq(
            'stylus:diff-then-comment',
            () => {
              const sourcemapExistsAfter = fs.existsSync(sourcemap);
              const sourcemapInline = fs.readFileSync(styleBld, enc);

              expect(sourcemapExistsBefore).to.be.false;
              expect(sourcemapExistsAfter).to.be.false;
              expect(sourcemapInline).to.have.string('/*# sourceMappingURL=data:application/json;');

              pref.stylus.linenos = true;
              delete pref.stylus.sourcemap;

              done();
            }
          );
        }
      );
    });

    it('writes a sourcemap file if configured to do so', function (done) {
      pref.stylus.linenos = false;
      pref.stylus.sourcemap = true;

      fp.runSeq(
        // Ensure there are no comments in any .css file in the bld directory.
        // The beforeEach() should unlink any .map file.
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, ''); // Ensure the bld file differs from the new tmp file.
          fs.writeFileSync(styleTmp, ''); // Ensure the old tmp file differs from the new tmp file.

          fp.runSeq(
            'stylus:diff-then-comment',
            () => {
              const sourcemapExistsAfter = fs.existsSync(sourcemap);
              const sourcemapJson = fs.readJsonSync(sourcemap);

              expect(sourcemapExistsBefore).to.be.false;
              expect(sourcemapExistsAfter).to.be.true;
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

    it('if the bld CSS has line comments, compiles Stylus without line comments and copy it to the backend\
', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.emptyDirSync(dirname(styleBack));
      }

      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSeq(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          fp.runSeq(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBack, enc);

              expect(styleBldCss).to.have.string(cssBody);
              expect(styleBldCss).to.have.string(cssA);
              expect(styleBldCss).to.have.string(cssPseudoClass);
              expect(styleBldCss).to.have.string('/* line 1');
              expect(styleBldCss).to.have.string('/* line 2');
              expect(styleBldCss).to.have.string('/* line 3');

              expect(styleBackExistsBefore).to.be.false;

              expect(styleBackCss).to.have.string(cssBody);
              expect(styleBackCss).to.have.string(cssA);
              expect(styleBackCss).to.have.string(cssPseudoClass);
              expect(styleBackCss).to.not.have.string('/* line ');

              done();
            }
          );
        }
      );
    });

    it('if the bld CSS has no line comments, copies it to the backend', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.emptyDirSync(dirname(styleBack));
      }

      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSeq(
        'stylus:no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          fp.runSeq(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBack, enc);

              expect(styleBldCss).to.have.string(cssBody);
              expect(styleBldCss).to.have.string(cssA);
              expect(styleBldCss).to.have.string(cssPseudoClass);
              expect(styleBldCss).to.not.have.string('/* line ');

              expect(styleBackExistsBefore).to.be.false;

              expect(styleBackCss).to.have.string(cssBody);
              expect(styleBackCss).to.have.string(cssA);
              expect(styleBackCss).to.have.string(cssPseudoClass);
              expect(styleBackCss).to.not.have.string('/* line ');

              expect(styleBldCss).to.equal(styleBackCss);

              done();
            }
          );
        }
      );
    });

    it('if the bld CSS has line comments, compiles Stylus without line comments and copy it to an alternate backend \
directory', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.unlinkSync(styleBackAlt);
      }

      styleBackAltExistsBefore = fs.existsSync(styleBackAlt);

      fp.runSeq(
        'stylus',
        () => {
          const styleBldCss = fs.readFileSync(styleBldAlt, enc);

          fp.runSeq(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBackAlt, enc);

              expect(styleBldCss).to.have.string(cssBody);
              expect(styleBldCss).to.have.string(cssA);
              expect(styleBldCss).to.have.string(cssPseudoClass);
              expect(styleBldCss).to.have.string('/* line 1');
              expect(styleBldCss).to.have.string('/* line 2');
              expect(styleBldCss).to.have.string('/* line 3');

              expect(styleBackAltExistsBefore).to.be.false;

              expect(styleBackCss).to.have.string(cssBody);
              expect(styleBackCss).to.have.string(cssA);
              expect(styleBackCss).to.have.string(cssPseudoClass);
              expect(styleBackCss).to.not.have.string('/* line ');

              done();
            }
          );
        }
      );
    });

    it('if the bld CSS has no line comments, copies it to an alternate backend directory', function (done) {
      if (fs.existsSync(styleBack)) {
        fs.unlinkSync(styleBackAlt);
      }

      styleBackAltExistsBefore = fs.existsSync(styleBackAlt);

      fp.runSeq(
        'stylus:no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBldAlt, enc);

          fp.runSeq(
            'stylus:frontend-copy',
            'frontend-copy',
            () => {
              const styleBackCss = fs.readFileSync(styleBackAlt, enc);

              expect(styleBldCss).to.have.string(cssBody);
              expect(styleBldCss).to.have.string(cssA);
              expect(styleBldCss).to.have.string(cssPseudoClass);
              expect(styleBldCss).to.not.have.string('/* line ');

              expect(styleBackAltExistsBefore).to.be.false;

              expect(styleBackCss).to.have.string(cssBody);
              expect(styleBackCss).to.have.string(cssA);
              expect(styleBackCss).to.have.string(cssPseudoClass);
              expect(styleBackCss).to.not.have.string('/* line ');

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

        fp.runSeq(
          'stylus:no-comment',
          done
        );
      });
    });

    it('compiles Stylus partials into a CSS file without line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.be.false;

      expect(styleBldCss).to.have.string(cssBody);
      expect(styleBldCss).to.have.string(cssA);
      expect(styleBldCss).to.have.string(cssPseudoClass);
      expect(styleBldCss).to.not.have.string('/* line ');
    });

    it('does not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.be.false;
    });
  });

  describe('fp stylus:once', function () {
    let styleBldExistsBefore;

    before(function (done) {
      fs.readdir(srcCssBldDir, (err, files) => {
        rmSrcCssBldFiles(files);

        styleBldExistsBefore = fs.existsSync(styleBld);

        fp.runSeq(
          'stylus:once',
          done
        );
      });
    });

    it('is an alias for `fp stylus`', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.be.false;

      expect(styleBldCss).to.have.string(cssBody);
      expect(styleBldCss).to.have.string(cssA);
      expect(styleBldCss).to.have.string(cssPseudoClass);
      expect(styleBldCss).to.have.string('/* line 1');
      expect(styleBldCss).to.have.string('/* line 2');
      expect(styleBldCss).to.have.string('/* line 3');
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

    it('compiles Stylus into bld CSS with line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.have.string(cssHtml);
          expect(css).to.have.string(cssBody);
          expect(css).to.have.string(cssA);
          expect(css).to.have.string(cssPseudoClass);
          expect(css).to.have.string('/* line 1');
          expect(css).to.have.string('/* line 2');
          expect(css).to.have.string('/* line 3');

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

    it('compiles Stylus into bld CSS without line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch-no-comment'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.have.string(cssHtml);
          expect(css).to.have.string(cssBody);
          expect(css).to.have.string(cssA);
          expect(css).to.have.string(cssPseudoClass);
          expect(css).to.not.have.string('/* line ');

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

    it('runs `fp stylus` when a Stylus partial is modified, but also write a tmp file to allow direct edits to the bld \
file', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch-write-tmp'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const cssBld = fs.readFileSync(styleWatchCss, enc);
          const cssTmp = fs.readFileSync(styleWatchTmp, enc);

          expect(cssBld).to.have.string(cssHtml);
          expect(cssBld).to.have.string(cssBody);
          expect(cssBld).to.have.string(cssA);
          expect(cssBld).to.have.string(cssPseudoClass);
          expect(cssBld).to.have.string('/* line 1');
          expect(cssBld).to.have.string('/* line 2');
          expect(cssBld).to.have.string('/* line 3');

          expect(cssTmp).to.have.string(cssHtml);
          expect(cssTmp).to.have.string(cssBody);
          expect(cssTmp).to.have.string(cssA);
          expect(cssTmp).to.have.string(cssPseudoClass);
          expect(cssTmp).to.not.have.string('/* line ');

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

      fp.runSeq(
        'stylus:write-tmp',
        done
      );
    });

    it('compiles Stylus partials into a CSS file without line comments to the .tmp directory', function () {
      const styleTmpCss = fs.readFileSync(styleTmp, enc);

      expect(styleTmpExistsBefore).to.be.false;

      expect(styleTmpCss).to.have.string(cssBody);
      expect(styleTmpCss).to.have.string(cssA);
      expect(styleTmpCss).to.have.string(cssPseudoClass);
      expect(styleTmpCss).to.not.have.string('/* line ');
    });
  });

  describe('fp stylus:help', function () {
    it('prints help text', function (done) {
      fp.runSeq(
        'stylus:help',
        done
      );
    });
  });

  describe('error handling', function () {
    it('broken top-level Stylus files log error messages to browser', function (done) {
      const styleBrokenBld = `${srcCssBldDir}/broken.css`;
      const styleBrokenBldExistsBefore = fs.existsSync(styleBrokenBld);

      fp.runSeq(
        'stylus:test-broken',
        () => {
          const styleBrokenCss = fs.readFileSync(styleBrokenBld, enc);

          expect(styleBrokenBldExistsBefore).to.be.false;

          expect(styleBrokenCss).to.include('body::before{background-color:white;color:red;content:\'Message:\\A     ');
          expect(styleBrokenCss).to.include('broken.styl:3:1\\A    1| body\\A    2| color: black\\A    3| \\A ------^\\A \\A expected "indent", got "eos"\\A \';white-space:pre;}\n');

          done();
        }
      );
    });

    it('broken Stylus partials log error messages to browser', function (done) {
      const styleBrokenBld = `${srcCssBldDir}/broken-partial.css`;
      const styleBrokenBldExistsBefore = fs.existsSync(styleBrokenBld);

      fp.runSeq(
        'stylus:test-broken-partial',
        () => {
          const styleBrokenCss = fs.readFileSync(styleBrokenBld, enc);

          expect(styleBrokenBldExistsBefore).to.be.false;

          expect(styleBrokenCss).to.include('body::before{background-color:white;color:red;content:\'Message:\\A     ');
          expect(styleBrokenCss).to.include('broken-partial.styl:1:9\\A    1| @import \\\'missing/partial\\\'\\A --------------^\\A    2| \\A \\A failed to locate @import file missing/partial.styl\\A \\A Details:\\A     lineno: 1\\A     column: 9\\A     filename: ');
          expect(styleBrokenCss).to.include('broken-partial.styl\\A     stylusStack: \\A \';white-space:pre;}\n');

          done();
        }
      );
    });

    // The following tests must run last.
    it('exits gracefully if `stylus` directory is missing', function (done) {
      global.conf.ui.paths.source.cssSrc = normalize(`${conf.ui.paths.source.cssSrc}/../missing-stylus-dir`);

      global.gulp.runSeq(
        'stylus',
        'stylus:diff-then-comment',
        'stylus:frontend-copy',
        'stylus:no-comment',
        'stylus:write-tmp',
        done
      );
    });

    it('exits gracefully if `.styl` files are missing', function (done) {
      global.conf.ui.paths.source.cssSrc = normalize(`${conf.ui.paths.source.cssSrc}/../missing-styl-files`);

      global.gulp.runSeq(
        'stylus',
        'stylus:diff-then-comment',
        'stylus:frontend-copy',
        'stylus:no-comment',
        'stylus:write-tmp',
        done
      );
    });
  });
});
