var gulp           = require('gulp'),// Подключаем Gulp
		gutil          = require('gulp-util' ),// Подключаем официальный инструмент для gulp.js(https://github.com/gulpjs/gulp-util)
		sass           = require('gulp-sass'),//Подключаем Sass пакет
		browserSync    = require('browser-sync'),// Подключаем Browser Sync(разворачивает локальный сервер + автообновление страницы во всех браузерах на всех устройствах)
		concat         = require('gulp-concat'),// Подключаем gulp-concat (для конкатенации файлов)
		uglify         = require('gulp-uglify'),// Подключаем gulp-uglifyjs (для сжатия JS)
		cleanCSS       = require('gulp-clean-css'), // Подключаем плагин минификации CSS, используя CLEAN-CSS (https://www.npmjs.com/package/gulp-clean-css)
		rename         = require('gulp-rename'),// Подключаем библиотеку для переименования файлов
		del            = require('del'),// Подключаем библиотеку для удаления файлов и папок
		imagemin       = require('gulp-imagemin'),// Подключаем библиотеку для работы с изображениями
		pngquant       = require('imagemin-pngquant'),// Подключаем библиотеку для работы с png
		cache          = require('gulp-cache'),// Подключаем библиотеку кеширования
		autoprefixer   = require('gulp-autoprefixer'),// Подключаем библиотеку для автоматического добавления префиксов
		fileinclude    = require('gulp-file-include'), // Подключаем плагин для возможности импортировать различные файлы куда угодно
		gulpRemoveHtml = require('gulp-remove-html'),// Подключаем плагин, который удаляет HTML код, когда выаодим файлы в продакшн(https://www.npmjs.com/package/gulp-remove-html)
		bourbon        = require('node-bourbon'),// Подключаем библиотеку Bourbon для Sass(http://bourbon.io/)
		ftp            = require('vinyl-ftp'),// Подключаем плагин, который делает копирование файлов на сервер(deploy)(https://www.npmjs.com/package/vinyl-ftp)
		notify         = require("gulp-notify"),//Подключаем плагин, который выводит ошибки в виде системных сообщений(https://www.npmjs.com/package/gulp-notify)
		plumber     = require('gulp-plumber'); // Отслеживание ошибок в Gulp, без его остановки(https://www.npmjs.com/package/gulp-plumber) 


gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false
	});
});

gulp.task('sass', ['headersass'], function() {
	return gulp.src('app/sass/**/*.sass')
		.pipe(plumber())
		.pipe(sass({
			includePaths: bourbon.includePaths
		}).on("error", notify.onError()))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS())
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('headersass', function() {
	return gulp.src('app/header.sass')
		.pipe(plumber())
		.pipe(sass({
			includePaths: bourbon.includePaths
		}).on("error", notify.onError()))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS())
		.pipe(gulp.dest('app'))
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('libs', function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/libs/magnific-popup/dist/magnific-popup.min.js',
		'app/libs/modernizr/modernizr.js',
		'app/libs/html5shiv/dist/html5shiv.min.js',
		'app/libs/html5shiv/dist/html5shiv-printshiv.min.js',
		'app/libs/waypoints/lib/jquery.waypoints.min.js',
		])
		.pipe(concat('libs.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('app/js'));
});

gulp.task('watch', ['sass', 'libs', 'browser-sync'], function() {
	gulp.watch('app/header.sass', ['headersass']);
	gulp.watch('app/sass/**/*.sass', ['sass']);
	gulp.watch('app/*.html', browserSync.reload);
	gulp.watch('app/js/**/*.js', browserSync.reload);
});

gulp.task('imagemin', function() {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin({
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('dist/img')); 
});

gulp.task('buildhtml', function() {
  gulp.src(['app/*.html'])
    .pipe(fileinclude({
      prefix: '@@'
    }))
    .pipe(gulpRemoveHtml())
    .pipe(gulp.dest('dist/'));
});

gulp.task('removedist', function() { return del.sync('dist'); });

gulp.task('build', ['removedist', 'buildhtml', 'imagemin', 'sass', 'libs'], function() {   //сборка проекта в папку dist (очистка, сжатие картинок, удаление всего лишнего)

	var buildCss = gulp.src([
		'app/css/fonts.min.css',
		'app/css/main.min.css'
		]).pipe(gulp.dest('dist/css'));

	var buildFiles = gulp.src([
		'app/.htaccess'
	]).pipe(gulp.dest('dist'));

	var buildFonts = gulp.src('app/fonts/**/*').pipe(gulp.dest('dist/fonts'));

	var buildJs = gulp.src('app/js/**/*').pipe(gulp.dest('dist/js'));

});

gulp.task('deploy', function() {    //выгрузка проекта на рабочий сервер из папки dist по FTP

	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('clearcache', function () { return cache.clearAll(); });     //очистка кеша gulp. Полезно для очистки кеш картинок и закешированных путей

gulp.task('default', ['watch']); // запуск дефолтного gulp таска (sass, js, watch, browserSync) для разработки
