// "browserify": "browserify assets/js/backbone/app.js -o assets/js/bundle.js -t [ html-browserify ] -t [ babelify --presets [ es2015 stage-0 ] ] -t [ brfs ]",

module.exports = function ( grunt ) {

  grunt.config.set( 'browserify', {

    browserify: {
      files: {
        'assets/js/bundle.js': [ 'assets/js/backbone/app.js' ],
      },
      options: {
        transform: [
          [ 'html-browserify' ],
          [ 'babelify', { presets: [ 'es2015', 'stage-0' ] } ],
          [ 'brfs' ],
        ]
      },
    },

  } );

  grunt.loadNpmTasks('grunt-browserify');

};

