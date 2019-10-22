var fs = require('fs');

// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var eslint = require('gulp-eslint');
var sass = require('gulp-sass');
var bro = require('gulp-bro');
var stringify = require('stringify');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify-es').default;
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var bourbon 	= require('bourbon').includePaths;
var neat		= require('bourbon-neat').includePaths;

var releaseFiles = [
  '**/*',
  '!.nyc_output/**/*',
  '!./{assets,assets/**}',
  '!./{bin,bin/**}',
  '!./{coverage,coverage/**}',
  '!dist/js/{maps,maps/**}',
  '!./{docs,docs/**}',
  '!./{node_modules,node_modules/**}',
  '!./{test,test/**}',
];

var versionBumps = {
  '--patch': 'patch',
  '--minor': 'minor',
  '--major': 'major',
};

// Lint Task
gulp.task('lint', function () {
  return gulp.src('js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Compile Our Sass
gulp.task('sass', function () {
  return gulp.src('assets/styles/main.scss')
    .pipe(sass({
      includePaths: [bourbon, neat],
    }))
    .pipe(gulp.dest('dist/styles'));
});

// Concatenate & Minify JS
gulp.task('scripts', function () {
  return gulp.src('assets/js/backbone/app.js')
    .pipe(babel())
    .pipe(bro({ transform: stringify }))
    .pipe(rename('bundle.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('dist/js'));
});

// Move additional resources
gulp.task('move', function (done) {
  gulp.src(['./assets/files/**'])
    .pipe(gulp.dest('dist/files'));
  gulp.src(['./assets/fonts/**'])
    .pipe(gulp.dest('dist/fonts'));
  gulp.src(['./assets/images/**'])
    .pipe(gulp.dest('dist/images'));
  gulp.src(['./assets/img/**'])
    .pipe(gulp.dest('dist/img'));
  gulp.src(['./assets/locales/**'])
    .pipe(gulp.dest('dist/locales'));
  gulp.src(['./assets/*.*'])
    .pipe(gulp.dest('dist'));
  gulp.src(['./assets/js/vendor/fontawesome-all.js'])
    .pipe(gulp.dest('dist/js'));
  done();
});

// Watch Files For Changes
gulp.task('watch', function () {
  gulp.watch('assets/js/backbone/**', gulp.series('lint', 'scripts'));
  gulp.watch('assets/js/utils/**', gulp.series('lint', 'scripts'));
  gulp.watch('assets/styles/**', gulp.series('sass'));
});

// Build task
gulp.task('build', gulp.series('lint', 'sass', 'scripts', 'move'));

// Bump package version number
gulp.task('bump', function () {
  var type = versionBumps[process.argv[3]];
  if(!type) {
    throw new Error('When calling `gulp bump` you must specify one of these options: ' + Object.keys(versionBumps));
  }
  var bump = require('gulp-bump');
  return gulp.src('./package.json')
    .pipe(bump({ type: type }))
    .pipe(gulp.dest('./'));
});

// Clean bin directory
gulp.task('clean', function () {
  const clean = require('gulp-clean');
  return gulp.src('./bin', { read: false, allowEmpty: true }).pipe(clean());
});

// TFS build task
gulp.task('tfs-build', gulp.series('clean', 'build', function (done) {
  const octo = require('@octopusdeploy/gulp-octo');
  const git = require('gulp-git');
  git.exec({ args: 'describe --tags --abbrev=0', maxBuffer: Infinity }, (err, tag) => {
    if(err) { throw(err); }
    gulp.src(releaseFiles)
      .pipe(octo.pack('zip', { version: tag.replace(/\r?\n?/g, '').replace('v', '') }))
      .pipe(gulp.dest('./bin').on('finish', done).on('error', done));
  });
}));

// Build an octopus release
gulp.task('create-release', function (done) {
  const octo = require('@octopusdeploy/gulp-octo');
  const git = require('gulp-git');
  git.revParse({args:'--abbrev-ref HEAD'}, function (err, branch) {
    if (err) {
      throw(err);
    } else if (branch != 'dev') {
      throw(new Error('You currently have the ' + branch + ' branch checked out. You must checkout the dev branch.'))
    } else {
      git.status({args: '--ahead-behind'}, function (err, stdout) {
        if (err) {
          throw(err);
        } else if (stdout.indexOf('Your branch is up to date') < 0) {
          throw(new Error('Your copy of the dev branch is not current. Please pull latest version and try again.'))
        } else {
          git.exec({ args: 'describe --tags --abbrev=0', maxBuffer: Infinity }, (err, tag) => {
            if(err) { throw(err); }
            var pack = gulp.src(releaseFiles)
              .pipe(octo.pack('zip', { version: tag.replace(/\r?\n?/g, '').replace('v', '') }));
            if(process.env.OctoHost && process.env.OctoKey) {
              pack.pipe(octo.push({
                host: process.env.OctoHost,
                apiKey: process.env.OctoKey,
              })).on('finish', done).on('error', done);
            } else {
              pack.pipe(gulp.dest('./bin').on('finish', done).on('error', done));
            }
          });
        }
      });
    }
  });
});

gulp.task('publish', gulp.series('build', 'create-release', function (done) {
  const git = require('gulp-git');
  const octopusApi = require('octopus-deploy');
  octopusApi.initializeApi({
    host: process.env.OctoHost,
    apiKey: process.env.OctoKey,
  });
  git.exec({ args: 'tag --sort=creatordate', maxBuffer: Infinity }, (err, results) => {
    if(err) { throw(err); }
    var tags = results.split('\n').reverse().filter(Boolean).splice(0,2);
    var logCMD = 'log ' + tags[1] + '..' + tags[0] + ' --no-merges ' +
      '--pretty=format:"[%h](http://github.com/openopps/openopps-platform/commit/%H): %s%n"';
    git.exec({ args: logCMD, maxBuffer: Infinity }, (err, releaseNotes) => {
      if(err) { throw(err); }
      const releaseParams = {
        projectSlugOrId: 'openopps',
        version: tags[0].replace('v', ''),
        packageVersion: tags[0].replace('v', ''),
        releaseNotes: releaseNotes,
      };
      octopusApi.octopusApi.releases.create(releaseParams).then((release) => {
        console.log('Octopus release created:', release);
        done();
      }, (error) => {
        console.log('Octopus release creation failed!', error);
        done();
      });
    });
  });
}));

// Build an octopus patch release
gulp.task('patch-release', function (done) {
  const octo = require('@octopusdeploy/gulp-octo');
  const git = require('gulp-git');
  git.revParse({args:'--abbrev-ref HEAD'}, function (err, branch) {
    if (err) {
      throw(err);
    } else if (branch != 'staging') {
      throw(new Error('You currently have the ' + branch + ' branch checked out. You must checkout the staging branch.'))
    } else {
      git.status({args: '--ahead-behind'}, function (err, stdout) {
        if (err) {
          throw(err);
        } else if (stdout.indexOf('Your branch is up to date') < 0) {
          throw(new Error('Your copy of the staging branch is not current. Please pull latest version and try again.'))
        } else {
          git.exec({ args: 'describe --tags --abbrev=0', maxBuffer: Infinity }, (err, tag) => {
            if(err) { throw(err); }
            var pack = gulp.src(releaseFiles)
              .pipe(octo.pack('zip', { version: tag.replace(/\r?\n?/g, '').replace('v', '') }));
            if(process.env.OctoHost && process.env.OctoKey) {
              pack.pipe(octo.push({
                host: process.env.OctoHost,
                apiKey: process.env.OctoKey,
              })).on('finish', done).on('error', done);
            } else {
              pack.pipe(gulp.dest('./bin').on('finish', done).on('error', done));
            }
          });
        }
      });
    }
  });
});

gulp.task('patch', gulp.series('build', 'patch-release', function (done) {
  const git = require('gulp-git');
  const octopusApi = require('octopus-deploy');
  octopusApi.initializeApi({
    host: process.env.OctoHost,
    apiKey: process.env.OctoKey,
  });
  git.exec({ args: 'describe --tags --abbrev=0', maxBuffer: Infinity }, (err, tag) => {
    if(err) { throw(err); }
    const releaseParams = {
      projectSlugOrId: 'openopps',
      version: tag.replace('v', ''),
      packageVersion: tag.replace('v', ''),
      releaseNotes: 'Patch release ' + tag.replace('v', '').split('-')[0],
    };
    octopusApi.octopusApi.releases.create(releaseParams).then((release) => {
      console.log('Octopus release created:', release);
      done();
    }, (error) => {
      console.log('Octopus release creation failed!', error);
      done();
    });
  });
}));

//Default task
gulp.task('default', gulp.series('lint', 'sass', 'scripts', 'move', 'watch'));
