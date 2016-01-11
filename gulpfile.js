var gulp = require("gulp"),
    gutil = require('gulp-util'),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify")
    ;

gulp.task("default", function () {
    gulp.src("./dist/lightrest-ng.js")
        .pipe(uglify().on('error', gutil.log))
        .pipe(rename('lightrest-ng.min.js'))
        .pipe(gulp.dest('dist'));
});

