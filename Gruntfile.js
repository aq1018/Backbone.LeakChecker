'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      lib: {
        src: [
          'Backbone.LeakChecker.js',
          'Gruntfile.js'
        ]
      },
      spec: {
        src: ['spec/**/*.js']
      }
    },

    mochaTest: {
      unit: {
        src: ['spec/unit/*.spec.js']
      }
    }
  });

  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('ci', ['jshint', 'test']);
  grunt.registerTask('default', 'ci');
};
