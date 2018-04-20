const gulp = require('gulp');
const changed = require('gulp-changed');
const eslint = require('gulp-eslint');

gulp.task('lint', function () {
  return gulp.src('src/**/*.js')
    //.pipe(changed('lib'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['lint']);
});

gulp.task('default', ['watch', 'lint']);
