// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global module */

module.exports = function(grunt) {
    var mochaTestGrep = grunt.option('mocha-test-grep') || '';
    var mochaTestSrc = grunt.option('mocha-test-src') || 'src/test/server/*.js';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            files: ['Gruntfile.js', 'src/main/server/*.js', 'src/test/server/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    require: true,
                    exports: true
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'list',
                    grep: mochaTestGrep
                },
                src: [mochaTestSrc]
            }
        },
        
        watch: {
            scripts: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint'],
                options: {
                    spawn: false
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
