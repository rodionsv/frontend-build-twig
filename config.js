module.exports = {

  // Локальный сервер будет открываться в localhost:xxxx, где xxxx указанный порт
  PORT: 8000,

  // Настройки Autoprefixer, для кроссбраузерности
  COMPATIBILITY: [
    'last 2 versions',
    'ie >= 9',
    'ios >= 7'
  ],

  // Настройки для UnCSS
  // Путь где именно должен искать неиспользуемые классы, точнее во всех файлах .html в папке dist
  UNCSS_OPTIONS_HTML:  [
    'dist/**/*.html'
  ],

  // Путь для папки dist

  PATHS_DIST: 'dist',

  // Путь для папки assets, где находятся все картинки, CSS и JavaScript файлы

  PATHS_ASSETS: [
    'src/assets/**/*',
    '!src/assets/{img,js,scss}/**/*'
  ],

  // Sass

  // Пути для Sass библиотек, который могут быть загружены с помощью @import

  PATHS_SASS: [
    'scss',
    'node_modules/normalize-scss',
    'node_modules/perfect-scrollbar',
    'node_modules/owl.carousel',
    'node_modules/slick-carousel'
  ],

  // JavaScript

  // Путь для JavaScript, где начинает работать Webpack, чтобы собирать модули

  PATHS_JS: [
    'src/assets/js/app.js'
  ]
};
