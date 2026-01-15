/********************************************************************
 * gulpfile.js – ESM, Node 22+
 * develop/* →  view/* (mirrored, no raw sources copied)
 *******************************************************************/
import gulp from 'gulp';
const { src, dest, watch, series, parallel } = gulp;

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import terser from 'gulp-terser';
import htmlmin from 'gulp-htmlmin';
import ejs from 'gulp-ejs';
import imagemin from 'gulp-imagemin';
import newer from 'gulp-newer';
import cache from 'gulp-cache';
import rename from 'gulp-rename';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import { deleteAsync } from 'del';
import { readFileSync, writeFileSync, rmSync, access, constants } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import browserSync from 'browser-sync';
import { readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const accessAsync = promisify(access);

const sass = gulpSass(dartSass);

const cfg = {
  src: 'develop',
  dist: 'view',
  isDev: process.env.NODE_ENV !== 'production',
  lib: {
    src: 'develop/assets/lib/**/*',
    dest: 'view/assets/lib/'
  },
  html: {
    src: ['develop/**/*.{html,ejs,xhtml}'],
    dest: 'view/'
  },
  styles: {
    src: 'develop/assets/css/**/*.scss',
    base: 'develop/assets/css',
    dest: 'view/assets/css/'
  },
  scripts: {
    src: 'develop/assets/js/**/*.js',
    base: 'develop/assets/js',
    dest: 'view/assets/js/'
  },
  images: {
    src: 'develop/assets/images/**/*.{png,jpg,jpeg,gif,svg,webp}',
    dest: 'view/assets/images/'
  },
  static: {
    src: [
      'develop/**/*',
      '!develop/assets/css/**/*',
      '!develop/assets/js/**/*',
      '!develop/**/*.{html,ejs,xhtml}',
      '!develop/**/*.{png,jpg,jpeg,gif,svg,webp}',
      '!develop/data.json'
    ],
    dest: 'view/'
  }
};

/* ------------------------------------------------------------------ */
/* 1. CLEAN                                                         */
/* ------------------------------------------------------------------ */
const clean = () => deleteAsync([cfg.dist, 'index.html']);

/* ------------------------------------------------------------------ */
/* 2. TASKS                                                         */
/* ------------------------------------------------------------------ */
/* SCSS → minified CSS (no .map in prod) */
const styles = () => {
  // Always use compressed output and cssnano for minification
  const sassOptions = {
    outputStyle: 'compressed',
    precision: 10
  };

  const plugins = [
    autoprefixer(),
    cssnano({
      preset: ['default', {
        discardComments: {
          removeAll: true
        }
      }]
    })
  ];

  return src(cfg.styles.src, { 
    base: cfg.styles.base
  })
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(rename({ extname: '.css' }))
    .pipe(dest(cfg.styles.dest))
    .pipe(browserSync.stream());
};

/* JS → minified JS (no source maps) */
const scripts = () => {
  return src(cfg.scripts.src, { 
    base: cfg.scripts.base
  })
    .pipe(terser({
      compress: true,
      mangle: true,
      format: {
        comments: false
      }
    }))
    .pipe(rename({ extname: '.js' }))
    .pipe(dest(cfg.scripts.dest))
    .pipe(browserSync.stream());
};

/* Images → optimised images with caching */
const images = () =>
  src(cfg.images.src, { since: gulp.lastRun(images) })
    .pipe(newer(cfg.images.dest))
    .pipe(cache(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ 
        quality: 75,
        progressive: true,
        arithmetic: false
      }),
      imagemin.optipng({ 
        optimizationLevel: 3,
        bitDepthReduction: true,
        colorTypeReduction: true,
        paletteReduction: true
      }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: false },
          { cleanupIDs: false },
          { removeUselessDefs: false },
          { cleanupNumericValues: { floatPrecision: 1 } }
        ]
      })
    ], {
      verbose: false,
      silent: true
    }), {
      name: 'imagemin',
      fileCache: new cache.Cache({ cacheDirName: '.imagecache' })
    }))
    .pipe(dest(cfg.images.dest));

/* EJS / XHTML / HTML → .html */
const html = () => {
  const data = {};
  const dataPath = join(cfg.src, 'data.json');
  
  try {
    if (existsSync(dataPath)) {
      Object.assign(data, JSON.parse(readFileSync(dataPath, 'utf8')));
    }
  } catch (e) {
    console.error('Error reading data.json:', e.message);
  }

  return src(cfg.html.src, { base: cfg.src })
    .pipe(ejs(data, {}, { ext: '.html' }))
    .pipe(rename((path) => {
      // Convert .ejs and .xhtml to .html
      if (path.extname === '.ejs' || path.extname === '.xhtml') {
        path.extname = '.html';
      }
    }))
    .pipe(htmlmin({
      collapseWhitespace: !cfg.isDev,
      removeComments: !cfg.isDev,
      minifyJS: !cfg.isDev,
      minifyCSS: !cfg.isDev
    }))
    .pipe(dest(cfg.html.dest));
};

/* Copy library files (Swiper, etc.) */
const copyLib = () => {
  return src(cfg.lib.src, { dot: true })
    .pipe(dest(cfg.lib.dest));};

/* Copy everything else (fonts, videos, manifest files, etc.) */
const staticFiles = () =>
  src([
    'develop/assets/**/*',
    '!develop/assets/{css,js,images,lib}/**/*', // Exclude lib as we handle it separately
    'develop/assets/images/*.{ico,png,svg,webmanifest,json,webp}' // Explicitly include manifest files
  ], { 
    dot: true, 
    base: cfg.src,
    allowEmpty: true
  })
    .pipe(newer(cfg.dist))
    .pipe(dest(cfg.dist))
    .pipe(browserSync.stream());

/* Clean up any empty folders that might have been created */
const cleanupEmptyFolders = (done) => {
  const walkAndRemove = (dir) => {
    let files = readdirSync(dir);
    if (files.length === 0) {
      rmSync(dir, { recursive: true, force: true });
    } else {
      for (const file of files) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
          walkAndRemove(fullPath);
        }
      }
    }
  };
  
  walkAndRemove(cfg.dist);
  done();
};

/* Root index.html – list all .html files inside view/ */
const generateRootIndex = () => {
  const htmlFiles = [];
  const viewPath = join(process.cwd(), 'view');
  
  const walk = (dir, base = '') => {
    try {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = join(dir, item.name);
        const relPath = join(base, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.')) {
          walk(fullPath, relPath);
        } else if (item.name.endsWith('.html')) {
          htmlFiles.push({
            path: relPath,
            name: item.name,
            url: join('view', relPath).replace(/\\/g, '/') // Convert to forward slashes for URLs
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error generating index:', error);
      }
    }
  };

  // Start walking from the view directory
  walk(viewPath);

  // Sort files alphabetically
  htmlFiles.sort((a, b) => a.name.localeCompare(b.name));

  // Generate the HTML using the template
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Files</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;margin:0;padding:20px;background:#fafafa;color:#333;max-width:1200px;margin:0 auto;}
    h1{text-align:center;margin:20px 0 30px;color:#2c3e50;}
    .container{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;padding:15px;}
    .item{padding:12px;background:#fff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.05);transition:transform 0.2s, box-shadow 0.2s;}
    .item:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.1);}
    a{color:#3498db;text-decoration:none;display:block;}
    a:hover{color:#2980b9;text-decoration:underline;}
    .path{font-family:monospace;font-size:0.85em;color:#7f8c8d;margin-top:5px;word-break:break-all;}
    .file-icon{color:#95a5a6;margin-right:8px;}
  </style>
</head>
<body>
  <h1>Project Files</h1>
  <div class="container">
    ${htmlFiles.length > 0 ? htmlFiles.map(file => `
      <div class="item">
        <a href="${file.url}" target="_blank">
          <span class="file-icon">📄</span>
          ${file.name}
        </a>
        <div class="path">${file.path}</div>
      </div>
    `).join('') : '<p>No HTML files found in the view directory.</p>'}
  </div>
</body>
</html>`;

  // Write to the root index.html
  writeFileSync(join(process.cwd(), 'index.html'), template);
  return Promise.resolve();
};

/* ------------------------------------------------------------------ */
/* 3. PIPELINE                                                      */
/* ------------------------------------------------------------------ */
const build = series(
  clean,
  parallel(
    styles,
    scripts,
    images,
    html,
    copyLib,
    staticFiles
  ),
  cleanupEmptyFolders,
  generateRootIndex
);

const dev = series(build, () => {
  const bs = browserSync.create();
  
  // Initialize BrowserSync with more robust configuration
  bs.init({
    server: {
      baseDir: '.',
      serveStaticOptions: {
        extensions: ['html'],
        index: 'index.html'
      },
      // Simple middleware for static files
      middleware: [
        (req, res, next) => {
          // Skip for file requests
          if (req.url.match(/\.(css|js|gif|jpg|jpeg|png|svg|webp|woff|woff2|ttf|eot|html?)$/i)) {
            next();
            return;
          }
          // For all other requests, serve index.html for SPA routing
          req.url = '/index.html';
          next();
        }
      ]
    },
    port: 3000,
    // Force port 3000 instead of auto-incrementing
    ui: {
      port: 3001
    },
    open: true,
    notify: true,
    logLevel: 'debug',
    ghostMode: false,
    injectChanges: true,
    watch: true,
    watchEvents: ['add', 'change', 'unlink', 'addDir', 'unlinkDir'],
    // Don't try to inject, do a full page reload
    reloadOnRestart: true,
    // Don't try to inject, do a full page reload
    injectFileTypes: ['css', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp']
  });

  // Watch SCSS files with error handling
  const watchSCSS = () => watch(cfg.styles.src, {
    ignoreInitial: false
  })
  .on('error', function(err) {
    console.error('Sass Error:', err.message);
    this.emit('end');
  })
  .on('change', series(styles, () => {
    bs.reload('*.css');
  }));

  // Watch JS files with error handling
  const watchJS = () => watch(cfg.scripts.src, {
    ignoreInitial: false
  })
  .on('error', function(err) {
    console.error('JS Error:', err.message);
    this.emit('end');
  })
  .on('change', series(scripts, () => {
    bs.reload();
  }));

  // Watch images
  const watchImages = () => watch(cfg.images.src, {
    ignoreInitial: false
  })
  .on('change', series(images, () => {
    bs.reload();
  }));

  // Watch EJS/HTML templates and data
  const watchTemplates = () => watch([
    ...cfg.html.src,
    `${cfg.src}/**/data.json`,
    `${cfg.src}/**/*.ejs`,
    `${cfg.src}/**/*.html`
  ], {
    ignoreInitial: false
  })
  .on('change', series(html, generateRootIndex, () => {
    bs.reload();
  }));

  // Watch static files (fonts, etc.)
  const watchStatic = () => watch([
    'develop/assets/**/*',
    '!develop/assets/{css,js,images,lib}/**/*',
    '!develop/**/*.{ejs,html,scss,js,png,jpg,jpeg,gif,svg,webp}'
  ], {
    ignoreInitial: false
  })
  .on('change', series(staticFiles, () => {
    bs.reload();
  }));

  // Watch library files
  const watchLib = () => watch(cfg.lib.src, {
    ignoreInitial: false
  })
  .on('change', series(copyLib, () => {
    bs.reload();
  }));

  // Initialize all watchers
  watchSCSS();
  watchJS();
  watchImages();
  watchTemplates();
  watchStatic();
  watchLib();

  // Watch the root index.html
  watch('index.html')
    .on('change', () => {
      bs.reload();
    });
});

export { clean, styles, scripts, images, build, dev };
export default dev;