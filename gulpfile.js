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

//gulp.task('server', function (cb) {
//    exec('node server/httpserver.js', function (err, stdout, stderr) {
//        console.log(stdout);
//        console.log(stderr);
//        cb(err);
//    });
//});

//gulp.task('app', function () {
//    var options = {
//        uri: 'http://localhost:1337/paged-table.html',
//        app: 'chrome'
//    };
//    gulp.src('')
//    .pipe(open(options));
//});

gulp.task('default', ['server:start']);