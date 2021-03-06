/*!
 *
 * grunt-develop
 * http://github.com/edwardhotchkiss/grunt-develop
 *
 * Copyright (c) 2013 Edward Hotchkiss
 * Licensed under the MIT license.
 *
 */

'use strict';

module.exports = function(grunt) {

  var child
    , fs = require('fs')
    , util = require('util');

  var running = false;

  // kills child process (server)
  grunt.event.on('develop.kill', function() {
    grunt.log.warn('kill process');
    child.kill('SIGHUP');
  });

  // watches server and broadcasts restart on change
  grunt.event.on('develop.watch', function(filename) {
    fs.watchFile(filename, { interval: 250 }, function(change) {
      grunt.log.warn('file changed');
      grunt.event.emit('develop.kill');
    });
  });

  // starts server
  grunt.event.on('develop.start', function(filename, nodeArgs, args) {
    if (running) {
      return grunt.event.emit('develop.kill');
    }
    child = grunt.util.spawn({
      cmd: process.argv[0],
      args: nodeArgs.concat([filename], args),
      opts: {
        stdio: 'inherit'
      }
    }, function(error, result, code) {
    });
    running = true;
    grunt.log.ok(util.format('started application "%s".', filename));
    child.on('exit', function(code, signal) {
      running = false;
      if (signal !== null) {
        grunt.log.warn(util.format('application exited with signal %s',
          signal));
      } else {
        grunt.log.warn(util.format('application exited with code %s', code));
      }
      if('SIGHUP' === signal ) {
        grunt.event.emit('develop.start', filename, nodeArgs, args);
      }
    });
    grunt.event.emit('develop.watch', filename);
  });

  // TASK. perform setup
  grunt.registerMultiTask('develop', 'init', function() {
    var done, filename = this.data.file, nodeArgs = this.data.nodeArgs || [], args = this.data.args || [];
    if (!grunt.file.exists(filename)) {
      grunt.fail.warn(util.format('application file "%s" not found!', filename));
      return false;
    }
    done = this.async();
    grunt.event.emit('develop.start', filename, nodeArgs, args);
    done();
  });

  process.on("exit", function() {
    if (running) {
      child.kill('SIGINT');
    }
  });

};

/* EOF */