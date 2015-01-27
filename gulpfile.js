var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css');

// Minify the css files and place in build directory
gulp.task('minifycss', function () {
   gulp.src('css/*.css')
      .pipe(minifyCSS())
      .pipe(gulp.dest('build/css'))
});

// Uglify the js files and place in build directory
gulp.task('uglifyjavascript', function () {
   gulp.src('js/*.js')
      .pipe(uglify())
      .pipe(gulp.dest('build/js'))
});

// Uglify the js library files and place in build directory
gulp.task('uglifylibs', function () {
   gulp.src('js/libs/*.js')
      .pipe(uglify())
      .pipe(gulp.dest('build/js/libs'))
});

// Copy the HTML files in the primary directory and put them in the build directory
gulp.task('copyhtml', function () {
   gulp.src('*.html')
      .pipe(gulp.dest('build'))
});

// Copy the image files in the images directory and put them in the build/images directory
gulp.task('copyimages', function () {
   gulp.src(['images/carrot_picked_with_face.gif', 
             'images/carrot_picked_icon.png',
             'images/magnifying_glass.png', 
             'images/list.png',  
             'images/carrot_in_ground.png'])
      .pipe(gulp.dest('build/images'))
});
