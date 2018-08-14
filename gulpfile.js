const gulp = require("gulp");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");

gulp.task("build-dev", function() {
    return gulp.src([
        "src/**/*.module.js",
        "src/**/*.*.js",
    ])
        .pipe(concat("ha-http.js"))
        .pipe(babel({
            presets: ["env"]
        }))
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function() {
    return gulp.watch([
        "src/**/*.module.js",
        "src/**/*.*.js",
    ], ["build-dev"]);
});

gulp.task("build", ["build-dev"], function() {
    return gulp.src("dist/ha-http.js")
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min",
        }))
        .pipe(gulp.dest("dist"));
});
