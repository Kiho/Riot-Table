var gulp = require('gulp');
var bower = require('gulp-bower');
var server = require('gulp-develop-server');

gulp.task('bower', function () {
    return bower({ layout: "byComponent" });
});

// run server 
gulp.task('server:start', function () {
    server.listen({ path: 'server/httpserver.js' });
});

gulp.task('default', ['server:start']);