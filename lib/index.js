// gulp 推荐用流的形式来做自动化构建
const { src, dest, parallel, series, watch } = require('gulp')
const path = require('path')
const babel = require('gulp-babel')
const less = require('gulp-less')
const swig = require('gulp-swig')
const image = require('gulp-imagemin')
const del = require('del')
const browser = require('browser-sync')

const bs = browser.create()
const cwd = process.cwd()

let config = {
    src: path.join(cwd, 'src'),
    dist: path.join(cwd, 'dist'),
    public: path.join(cwd, 'public'),
    temp: path.join(cwd, 'temp'),
    datas: {
        name: require(path.join(cwd, 'package.json')).name
    }
}

try {
    // 参数合并
    const _config = require(path.join(cwd, 'pages.config.js'))
    config = Object.assign({}, config, _config)
} catch(e) {}

const clean = () => {
    return del([config.dist, config.temp])
}

const script = () => {
    return src(`${config.src}/**/*.js`, { base: config.src })
    .pipe(babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.temp))
    .pipe(bs.reload({ stream: true }))
}

const style = () => {
    return src(`${config.src}/**/*.less`, { base: config.src })
    .pipe(less())
    .pipe(dest(config.temp))
    .pipe(bs.reload({ stream: true }))
}

const html = () => {
    return src(`${config.public}/*.html`)
    .pipe(swig({ data: config.datas}))
    .pipe(dest(config.temp))
    .pipe(bs.reload({ stream: true }))
}

const images = () => {
    return src(`${config.src}/assests/*`, { base: config.src, ignored: [`${config.src}/assests/**/*.js`, `${config.src}/assests/**/*.less`] })
    .pipe(image())
    .dest(dest(config.temp))
}

const serve = () => {
    // 对于不需要重新编译构建的文件，直接监听变化，然后用bs.reload刷新页面
    watch([`${config.src}/assests/*`], { ignored: [`${config.src}/assests/**/*.js`, `${config.src}/assests/**/*.less`] }, bs.reload)

    watch(`${config.src}/**/*.js`, script)
    watch(`${config.src}/**/*.less`, style)
    watch(`${config.public}/*`, html)
    
    bs.init({
        port: 1024,
        // files: 'dist/**', // 当用流进行 bs.reload时，不需要files了
        server: {
            baseDir: [config.temp, config.src, config.public]  // 服务是从左到右查找文件的
        }
    })
}

const uesrefs = () => {
    return src(`${config.temp}/*.html`, { base: config.temp })
    .pipe(uesref({ searchPath: [config.temp, cwd] }))
    // html js css 压缩
    // 但是需要判断当前流是哪一个类型的文件，再配对对应的插件，用gulp-if插件
    // 应为读写流同时进行，所以需要用一个临时目录文件来接受输出编译文件，最后再用useref改造资源引用再输出到dist目录
    .pipe(dest(config.dist))
}

const compile = parallel(script, style, html)

const build = series(clean, parallel(series(compile, uesrefs), images))

const develop = series(compile, serve)

module.exports = {
    clean,
    build,
    develop
}