var gulp = require('gulp');
var gulp_jstransform = require('gulp-jstransform');

gulp.task('transform', function() {
  return gulp.src(['src/**/*.js', '!src/**/__tests__/*'])
    .pipe(gulp_jstransform())
    .pipe(gulp.dest('dist/'));
});
