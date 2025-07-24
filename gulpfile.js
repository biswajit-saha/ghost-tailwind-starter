const { src, dest, watch, series, parallel } = require("gulp");
const postcss = require("gulp-postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const rename = require("gulp-rename");
const terser = require("gulp-terser");
const sourcemaps = require("gulp-sourcemaps");
const cssnano = require("cssnano");
const browserSync = require("browser-sync").create();
const del = require("del");
const concat = require("gulp-concat");
const zip = require("gulp-zip");
const pkg = require("./package.json");

// Paths
const paths = {
  css: {
    src: "assets/css/style.css",
    dest: "assets/css/",
    watch: [
      "assets/css/**/*.css",      // watch all CSS
      "!assets/css/**/*.min.css"  // exclude minified CSS
    ]
  },
  js: {
    src: "assets/js/main.js",
    dest: "assets/js/",
     watch: [
      "assets/js/**/*.js",         // watch all JS
      "!assets/js/**/*.min.js"     // exclude minified JS
      ],
      concat: [
         "assets/js/plugins/**/*.js"
     ]
  },
    hbs: "./**/*.hbs",
  plugins: {
    src: [
      "node_modules/jquery/dist/jquery.min.js",
      "node_modules/some-library/dist/some-library.min.js"
    ],
    dest: "assets/js/plugins/"
  },
  build: {
    dest: "build/",
    include: [
      "./**/*",
      "!./node_modules/**",
      "!./build/**",
      "!./.git/**",
      "!./gulpfile.js",
      "!./package-lock.json",
      "!./.DS_Store"
    ]
  }
};

// CSS Task
function css() {
  return src(paths.css.src)
    .pipe(sourcemaps.init())
    .pipe(postcss([tailwindcss(), autoprefixer(), cssnano()]))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.css.dest))
    .pipe(browserSync.stream());
}

// JS Task
function js() {
  return src(paths.js.concat, paths.js.src)
    .pipe(sourcemaps.init())
    .pipe(terser())
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.js.dest))
    .pipe(browserSync.stream());
}
function copyPlugins() {
  return src(paths.plugins.src, { allowEmpty: true })
    .pipe(dest(paths.plugins.dest));
}

// Clean build folder
function cleanBuild() {
  return del([paths.build.dest]);
}

// Copy theme files to build folder
function copyToBuild() {
  return src(paths.build.include, { dot: true })
    .pipe(dest(paths.build.dest));
}

// Zip the build folder contents to dist/{theme-name}.zip
function zipTask() {
  return src("build/**/*")
    .pipe(zip(`${pkg.name}.zip`))
    .pipe(dest("dist"));
}

// Watch files and serve with BrowserSync
function serve() {
  browserSync.init({
    proxy: "http://localhost:2368",
    open: false,
    notify: false
  });

  watch(paths.css.watch, css);
  watch(paths.js.watch, js);
  watch(paths.hbs).on("change", browserSync.reload);
}

// Exported tasks
exports.css = css;
exports.js = js;
exports.clean = cleanBuild;
exports.copy = copyToBuild;
exports.build = series(cleanBuild, parallel(css, js, copyPlugins), copyToBuild);
exports.zip = series(exports.build, zipTask);
exports.watch = series(css, js, copyPlugins, serve);
exports.default = exports.watch;
