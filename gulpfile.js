var gulp = require('gulp');
var bower = require('gulp-bower');
var exec = require('child_process').exec;
var open = require('gulp-open');

gulp.task('bower', function () {
    return bower({ layout: "byComponent" });
});

gulp.task('server', function (cb) {
    exec('node server/httpserver.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('app', function () {
    var options = {
        uri: 'http://localhost:1337/paged-table.html',
        app: 'chrome'
    };
    gulp.src('')
    .pipe(open(options));
});

gulp.task('default', ['server']);