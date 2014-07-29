module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist/'],
    // See: http://www.jshint.com/docs/
    jshint: {
      all: {
        src: ['src/js/**.js'],
        options: {
          browser: true,
          bitwise: false,
          camelcase: false,
          curly: true,
          eqeqeq: true,
          forin: true,
          immed: true,
          ignores: ['src/vendor/**.js'],
          indent: 2,
          latedef: true,
          newcap: false,
          noarg: true,
          noempty: true,
          nonew: true,
          quotmark: 'single',
          regexp: true,
          undef: true,
          unused: false,
          trailing: true,
          withstmt: true,
          maxlen: 520,
          globals: {
            $: false,
            jQuery: false,
            Error: false,
            Window: false,
            log: false,
            require: false,
            exports: false,
            console: false,
            escape: false,
            unescape: false
          }
        }
      }
    },
    copy: {
      main: {
        files: [
          { src: 'src/vendor/jquery/jquery.min.js', dest: 'dist/jquery.min.js'},
          { src: 'src/index.html', dest: 'dist/index.html'}
        ]
      }
    },
    concat: {
      options: {
        separator: "\n", //add a new line after each file
        banner: "", //added before everything
        footer: "" //added after everything
      },
      p: {
        src: ['src/vendor/pjs/src/p.js', 'src/js/commonjs/p_post.js'],
        dest: 'dist/p.js'
      },
      parsimmon: {
        src: ['src/js/commonjs/parsimmon_pre.js', 'src/vendor/parsimmon/src/parsimmon.js', 'src/js/commonjs/parsimmon_post.js'],
        dest: 'dist/parsimmon.js'
      },
      objects: {
        src: ['src/js/commonjs/objects_pre.js', 'src/js/objects.js', 'src/js/commonjs/objects_post.js'],
        dest: 'dist/objects.js'
      },
      tests: {
        src: ['src/js/commonjs/tests_pre.js', 'src/js/tests.js', 'src/js/commonjs/tests_post.js'],
        dest: 'dist/tests.js'
      },
      parser: {
        src: ['src/js/commonjs/parser_pre.js', 'src/js/parser.js', 'src/js/commonjs/parser_post.js'],
        dest: 'dist/parser.js'
      },
      trs: {
        src: ['src/js/commonjs/trs_pre.js', 'src/js/trs.js', 'src/js/commonjs/trs_post.js'],
        dest: 'dist/trs.js'
      }
    },
    watch: {
      files: ['src/js/**.js'],
      tasks: ['clean', 'jshint', 'copy', 'concat']
    },
    connect: {
      server: {
        options: {
          port: 8888,
          hostname: '0.0.0.0',
          base: 'dist'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'jshint', 'copy', 'concat', 'connect', 'watch']);

}
