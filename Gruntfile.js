// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global module */

module.exports = function(grunt) {
  var mochaTestGrep = grunt.option('mocha-test-grep') || '';
  var mochaTestSrc = grunt.option('mocha-test-src') || 'src/test/*/*.js';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', '!src/main/client/bower_components/**'],
      options: {
        jshintrc: true
      }
      //options: {
      //  esnext: true,
      //  strict: false,
      //  undef: true,
      //  unused: true,
      //  '-W033': true,
      //  '-W119': true,
      //  '-W116': true,
      //  curly: false,
      //  eqeqeq: true,
      //  eqnull: true,
      //  browser: true,
      //  node: true,
      //  globals: {
      //    jQuery: true
      //  }
      //}
    },

    mochaTest: {
      test: {
        options: {
          harmony: true,
          reporter: 'list',
          grep: mochaTestGrep,
          timeout: '10s' /* yahoo api call takes about 6s */
        },
        src: [mochaTestSrc]
      }
    },

    watch: {
      scripts: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint'],
        options: {
          spawn: false,
          interrupt: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jshint', "mochaTest"]);
  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('debug', 'Debug unit test', function() {
    grunt.task.run('mochaTest');
  });
};
