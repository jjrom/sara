module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        // Configuration variables.
        src_dir: './src',
        temp_dir: './temp',
        dist_dir: grunt.option('dist_dir') || './dist',

        // Clean output and temporary directories.
        clean: {
            options: {
                force: true
            },
            dist: '<%= dist_dir %>',
            temp: '<%= temp_dir %>'
        },

        // Analyze JavaScript code.
        jshint: {
            app: {
                options: {
                    jshintrc: true
                },
                src: [
                    '<%= src_dir %>/components/**/*.js',
                    '<%= src_dir %>/shared/**/*.js'
                ]
            }
        },

        // Copy sources, dependencies and libraries.
        copy: {
            app: {
                files: [
                    {
                        src: ['*.html', '*.jsp', '*.json'],
                        dest: '<%= dist_dir %>',
                        expand: true,
                        cwd: '<%= src_dir %>'
                    },
                    {
                        src: '**',
                        dest: '<%= dist_dir %>',
                        expand: true,
                        cwd: '<%= src_dir %>/assets'
                    }
                ]
            },
            libs: {
                files: [
                    {
                        src: [
                            './node_modules/angular/angular.min.js',
                            './node_modules/jquery/dist/jquery.min.js',
                            './node_modules/openlayers/dist/ol.js'
                        ],
                        dest: '<%= dist_dir %>/js',
                        expand: true,
                        flatten: true,
                        ext: '.min.js',
                        extDot: 'first'
                    },
                    {
                        src: [
                            './node_modules/font-awesome/css/font-awesome.min.css',
                            './node_modules/openlayers/dist/ol.css',
                            './node_modules/bootstrap/dist/css/bootstrap.min.css'
                        ],
                        dest: '<%= dist_dir %>/css',
                        expand: true,
                        flatten: true,
                        ext: '.min.css',
                        extDot: 'first'
                    },
                    {
                        src: [
                            './node_modules/font-awesome/fonts/*'
                        ],
                        dest: '<%= dist_dir %>/fonts',
                        expand: true,
                        flatten: true
                    }
                ]
            }
        },

        // Compile LESS into CSS.
        less: {
            app: {
                options: {
                    compress: true,
                    cleancss: true
                },
                files: {
                    '<%= dist_dir %>/css/app.css': '<%= src_dir %>/app.less'
                }
            }
        },

        // Transform HTML templates into an Angular module.
        html2js: {
            app: {
                options: {
                    base: '<%= src_dir %>',
                    htmlmin: {
                        removeComments: true,
                        collapseWhitespace: true
                    },
                    module: 'app.templates',
                    singleModule: true
                },
                files: {
                    '<%= temp_dir %>/app-templates.js': [
                        '<%= src_dir %>/components/**/*.html',
                        '<%= src_dir %>/shared/**/*.html'
                    ]
                }
            }
        },

        // Create a single JavaScript file.
        concat: {
            app: {
                options: {
                    banner: '(function(window, angular){\'use strict\';',
                    footer: '})(window, window.angular);'
                },
                files: {
                    '<%= dist_dir %>/js/app.js': [
                        '<%= src_dir %>/app.js',
                        '<%= src_dir %>/shared/**/*.js',
                        '<%= src_dir %>/components/**/*.js',
                        '<%= temp_dir %>/app-templates.js'
                    ]
                }
            }
        },

        // Prepare Angular code for obfuscation.
        ngAnnotate: {
            app: {
                files: {
                    '<%= dist_dir %>/js/app.js': '<%= dist_dir %>/js/app.js'
                }
            }
        },

        // Obfuscate JavaScript code.
        uglify: {
            app: {
                files: {
                    '<%= dist_dir %>/js/app.js': '<%= dist_dir %>/js/app.js'
                }
            }
        },

        // Serve the application on "localhost".
        connect: {
            options: {
                port: 9000,
                base: '<%= dist_dir %>'
            },
            default: {
                options: {
                    keepalive: false
                }
            },
            keepalive: {
                options: {
                    keepalive: true
                }
            }
        },

        // Observe source changes to automatically update the output directory.
        watch: {
            app: {
                options: {
                    spawn: false
                },
                tasks: ['update'],
                files: '<%= src_dir %>/**'
            }
        }
    });

    // Load plugins that provide tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-ng-annotate');

    // Final tasks.
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['clean:dist', 'jshint', 'copy', 'less', 'html2js', 'concat', 'ngAnnotate', 'uglify', 'clean:temp']);
    grunt.registerTask('serve', ['connect:keepalive']);
    grunt.registerTask('dev', ['clean:dist', 'jshint', 'copy', 'less', 'html2js', 'concat', 'clean:temp', 'connect:default', 'watch']);
    grunt.registerTask('update', ['jshint:app', 'copy:app', 'less:app', 'html2js:app', 'concat:app', 'clean:temp']);
};