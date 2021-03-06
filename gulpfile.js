var gulp = require('gulp');

// gulp plugins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var react = require('gulp-react');
var plumber = require('gulp-plumber');
var filter = require("gulp-filter");
var gulpif = require('gulp-if');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var livereload = require('gulp-livereload');
var jest = require('gulp-jest-iojs');
var connect = require('gulp-connect');

// node modules
var del = require('del');
var path = require('path');
var glob = require('glob');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var open = require('open');

// External dependencies you do not want to rebundle while developing,
// but need in your application deployment
var dependencies = [
    'react',
    'react/addons',
    'react-dom'
];

// source directories
var srcDir = './src/';
var jsSrcDir = srcDir + 'js/**/*';
var jsRootFile = srcDir + 'js/main.jsx';
var cssSrcDir = srcDir + 'css/**/*';
var nodeSrcDir = './node_modules/';

// deplopment directories
var deployDir = './deploy/';
var cssDeployDir = deployDir + 'css/';
var jsDeployDir = deployDir + 'js/';

var buildSettings = {
    development: true
};

gulp.task('default', ['css', 'html', 'clean-js'], function () {
    browserifyTask({ watch: false });
});

// Starts our development workflow
gulp.task('dev', ['css', 'html', 'clean-js'], function () {        
    gulp.watch(cssSrcDir, ['css']);
    livereload.listen();
    
    browserifyTask({ watch: true });
});

// based on react-app-boilerplate: https://github.com/christianalfoni/react-app-boilerplate
var browserifyTask = function (options) {

    var appBundler = browserify({
        entries: [jsRootFile], // this js/jsx file should require everything needed by the app
        transform: [reactify], // compile JSX
        debug: buildSettings.development, // sourcemapping
        extensions: ['.jsx'], // allows us to require() jsx modules without specifying file extensions
        cache: {}, packageCache: {}, fullPaths: buildSettings.development // requirements of watchify
    });

    // set external dependencies as externals on our app bundler when developing to speed up compilation		
    (buildSettings.development ? dependencies : []).forEach(function (dep) {
        appBundler.external(dep);
    });

    var rebundle = function () {
        var start = Date.now();
        gutil.log('Browserify: Building Main.js bundle');
        appBundler.bundle()
          .pipe(plumber())
          .pipe(source('main.js'))
          // .pipe(gulp.dest('main.temp.js')) // if there's an error in uglify, you'll want this.
          .pipe(
            gulpif(
                !buildSettings.development,
                streamify(
                    uglify().on('error', function (err) {
                        gutil.log('Uglify error: ' + err);
                        throw err;
                    })
                )
            )
          )
          .pipe(gulp.dest(jsDeployDir))
          .pipe(livereload())
          .pipe(notify(function () {
              gutil.log('Browserify: Main.js bundle built in ' + (Date.now() - start) + 'ms');
          }));
    };

    // Fire up Watchify when developing
    if (buildSettings.development && options.watch) {
        appBundler = watchify(appBundler);
        appBundler.on('update', rebundle);
    }

    rebundle();

    // We create a separate bundle for our dependencies as they
    // should not rebundle on file changes. This only happens when
    // we develop. When deploying, the dependencies will be included 
    // in the application bundle
    if (buildSettings.development) {
        var vendorsBundler = browserify({
            debug: true,
            require: dependencies
        });

        // Run the vendor bundle
        var start = new Date();
        gutil.log('Browserify: Building Vendor.js bundle');
        vendorsBundler.bundle()
            .pipe(plumber())
            .pipe(source('vendors.js'))
            .pipe(
                gulpif(
                    !buildSettings.development,
                    streamify(
                        uglify().on('error', function (err) {
                            gutil.log('Uglify error: ' + err);
                            throw err;
                        })
                    )
                )
            )
            .pipe(gulp.dest(jsDeployDir))
            .pipe(notify(function () {
                gutil.log('Browserify: Vendor.js bundle built in ' + (Date.now() - start) + 'ms');
                
                // this is a bit of a hack. I'm firing up the server at this point because in this demo app, the vendors
                // bundle always finishes last because the main app is so simple.
                connect.server({
                    root: deployDir,
                    port: 8889
                });
                
                open('http://localhost:8889/index.html');
                
            }));
    }
}

gulp.task('css', ['clean-css'], function (done) {
    return gulp.src(cssSrcDir)
        .pipe(livereload())
        .pipe(gulp.dest(cssDeployDir));
});

gulp.task('clean-css', function (done) {
    clean(cssDeployDir, done);
});

gulp.task('html', ['clean-html'], function (done) {
    return gulp.src(srcDir + 'index.html')
        .pipe(gulp.dest(deployDir));
});

gulp.task('clean-html', function (done) {
    clean(deployDir + 'index.html', done);
});

gulp.task('clean-js', function (done) {
    clean(jsDeployDir, done);
});

// clean
gulp.task('clean', function (done) {
    clean(deployDir, done);
});

// helper functions
function clean(pathToClean, done) {
    gutil.log('Cleaning:', fullPath(pathToClean));
    del(pathToClean, done);
}

function fullPath(pathToFormat) {
    return gutil.colors.yellow(path.resolve(pathToFormat));
}

function unclog(error) {
    // Error handler for Plumber to prevent tasks crashing when being watched.
    // Log a very obvious, visibly ugly error to be easily noticed.
    gutil.log(gutil.colors.bold.red("Error in '" + gutil.colors.cyan(error.plugin) + "\': " + error.message));

    // Fail cleanly for watch.
    this.emit('end');
}



