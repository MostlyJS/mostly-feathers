const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
const eslint = require('gulp-eslint');

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    //.pipe(changed('lib'))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});

gulp.task('compile', () => {
  return gulp.src('src/**/*.js')
    .pipe(changed('lib'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'));
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['lint', 'compile']);
});

gulp.task('default', ['watch', 'lint', 'compile']);
