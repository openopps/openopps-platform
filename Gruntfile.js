/**
 * Gruntfile
 *
 * If you created your Sails app with `sails new foo --linker`,
 * the following files will be automatically injected (in order)
 * into the EJS and HTML files in your `views` and `assets` folders.
 *
 * At the top part of this file, you'll find a few of the most commonly
 * configured options, but Sails' integration with Grunt is also fully
 * customizable.  If you'd like to work with your assets differently
 * you can change this file to do anything you like!
 *
 * More information on using Grunt to work with static assets:
 * http://gruntjs.com/configuring-tasks
 */

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    browserify = require('browserify'),
    stringify = require('stringify');

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-browserify');

  // Get path to core grunt dependencies from Sails
  var depsPath = grunt.option('gdsrc') || 'node_modules/sails/node_modules';
  grunt.loadTasks(depsPath + '/grunt-contrib-clean/tasks');
  grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');
  grunt.loadTasks(depsPath + '/grunt-contrib-concat/tasks');
  grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');

  grunt.initConfig({

    browserify: {
      prod: {
        src: 'assets/js/backbone/app.js',
        dest: 'assets/build/js/bundle.min.js',
        options: {
          browserifyOptions: { debug: false },
          transform: ['stringify', ['uglifyify', { global: true }]],
          require: ['./assets/js/vendor/jquery-shim.js:jquery'],
        }
      },
      dev: {
        src: 'assets/js/backbone/app.js',
        dest: 'assets/build/js/bundle.js',
        options: {
          browserifyOptions: { debug: true },
          transform: ['stringify'],
          require: ['./assets/js/vendor/jquery-shim.js:jquery'],
        }
      }
    },

    cssmin: {
      combine: {
        files: {
          'assets/build/css/midas.css': [
            'node_modules/bootstrap/dist/css/bootstrap.css',
            'assets/styles/font-awesome/css/font-awesome.min.css',
            'assets/styles/font-custom/css/style.css',
            'node_modules/bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css',
            'node_modules/timepicker/jquery.timepicker.css',
            'node_modules/blueimp-file-upload/css/jquery.fileupload.css',
            'node_modules/Select2/select2.css',
            'assets/styles/application.css',
            'assets/styles/theme.css'
          ]
        },
        options: {
          report: 'min'
        }
      },
      minify: {
        expand: true,
        cwd: 'assets/build/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'assets/build/css/',
        ext: '.min.css',
        extDot: 'last',
        options: {
          report: 'min'
        }
      }
    },

    pkg: grunt.file.readJSON('package.json'),

    copy: {
      prod: {
        files: [
        {
          expand: true,
          cwd: './assets',
          src: ['build/**/*', 'js/vendor/**/*', 'images/**/*', 'locales/**/*', 'data/**/*'],
          dest: '.tmp/public'
        }
        ]
      },
      font: {
        files: [
        {
          expand: true,
          flatten: true,
          cwd: './assets',
          src: ['styles/font-awesome/fonts/*'],
          dest: 'assets/build/fonts'
        },
        {
          expand: true,
          flatten: true,
          cwd: './assets',
          src: ['styles/font-custom/fonts/*'],
          dest: 'assets/build/fonts'
        },
        {
          expand: true,
          flatten: true,
          cwd: './assets',
          src: ['fonts/*'],
          dest: 'assets/build/fonts'
        }
        ]
      },
      csssupport: {
        files: [
        {
          expand: true,
          flatten: true,
          cwd: './',
          src: ['node_modules/Select2/*.png', 'node_modules/Select2/*.gif'],
          dest: 'assets/build/css'
        }
        ]
      }
    },

    clean: {
      prod: ['.tmp/public/**']
    },

    jsonlint : {
      sample: {
        src:['assets/locales/**/*.json']
      }
    },

    watch: {
      api: {

        // API files to watch:
        files: ['api/**/*']
      },
      assets: {

        // Assets to watch:
        files: ['assets/**/*'],

        // When assets are changed:
        tasks: [
          'clean:prod',
          // Check validity of JSON files.
          'jsonlint',
          // build js bundle
          'browserify:dev',
          // compile the css
          'cssmin',
          // copy fonts
          'copy:font',
          // copy css-support images (images that css expects to be in the css directory)
          'copy:csssupport',
          // copy assets
          'copy:prod'
        ]
      }
    }
  });

  // When Sails is lifted:
  grunt.registerTask('default', [
    'build',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean:prod',
    // Check validity of JSON files.
    'jsonlint',
    // build js bundle
    'browserify',
    // compile the css
    'cssmin',
    // copy fonts
    'copy:font',
    // copy css-support images (images that css expects to be in the css directory)
    'copy:csssupport',
    // copy assets
    'copy:prod'
  ]);

  // When sails is lifted in production
  // clean and only copy the production files
  grunt.registerTask('prod', [
    'clean:prod',
    // copy fonts
    'copy:font',
    // copy css-support images (images that css expects to be in the css directory)
    'copy:csssupport',
    // copy assets
    'copy:prod'
  ]);

  grunt.registerTask('initTags', 'load tag data', function() {
    var done = this.async();
    var toolPath = "tools/tagtool";
    fs.readdir(toolPath, function (err, files) {
      if (err) {
          throw err;
      }
      files.map(function (file) {
          return path.join(toolPath, file);
      }).filter(function (file) {
          return fs.statSync(file).isFile() &&
                 path.extname(file) === ('.txt');
      }).forEach(function (file) {
          var cmd = 'node ' + toolPath + '/tagtool.js ' + path.basename(file, '.txt') + ' ' +  file;
          grunt.log.write('Adding tags from ' + file).ok();
          exec(cmd);
      });
      done();
    });
  });
};
