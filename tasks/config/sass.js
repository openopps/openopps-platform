var _ = require('underscore');


module.exports = function(grunt) {

  grunt.config.set('sass', {
    dev: {
      files: [{
        expand: true,
        cwd: 'assets/styles/',
        loadPath: [
          'assets/styles',
          'assets/styles/vendor',
          'node_modules',
        ],
        src: ['main.scss'],
        dest: '.tmp/public/styles/',
        ext: '.css',
      }]
    }
  });

  grunt.loadNpmTasks('grunt-sass');
};
