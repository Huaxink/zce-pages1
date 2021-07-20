// gulp 推荐用流的形式来做自动化构建
const { src, dest, parallel, series, watch } = require('gulp')
const path = require('path')
const babel = require('gulp-babel')
const less = require('gulp-less')
const swig = require('gulp-swig')
const image = require('gulp-imagemin')
const del = require('del')
const browser = require('browser-sync')
const uesref = require('gulp-useref')

const bs = browser.create()
const cwd = process.cwd()

let config = {
    src: 'src',
    dist: 'dist',
    public: 'public',
    temp: 'temp',
    assests: 'assests',
    datas: {
        title: 'zce-page'
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
    return src(`**/*.js`, { base: config.src, cwd: config.src })
    .pipe(babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.temp, { overwrite: true }))
    .pipe(bs.reload({ stream: true }))
}

const style = () => {
    return src(`**/*.less`, { base: config.src, cwd: config.src })
    .pipe(less())
    .pipe(dest(config.temp, { overwrite: true }))
    .pipe(bs.reload({ stream: true }))
}

const html = () => {
    return src(`*.html`, { base: config.public, cwd: config.public })
    .pipe(swig({ data: config.datas, defaults: { cache: false } })) // 加上cache： false，防止缓存，开发模式下没有覆盖
    .pipe(dest(config.temp, { overwrite: true }))
    .pipe(bs.reload({ stream: true }))
}

const images = () => {
    return src(`${config.assests}/*`, { 
        base: config.src, 
        cwd: config.src, 
        ignored: [`${config.assests}/**/*.js`, `${config.assests}/**/*.less`] 
    })
    .pipe(image())
    .pipe(dest(config.dist, { overwrite: true }))
}

const extra = () => {
    return src(`**`, { base: config.public, cwd: config.public, ignored: ['*.html'] })
    .pipe(image())
    .pipe(dest(config.dist))
}

const serve = () => {
    // 对于不需要重新编译构建的文件，直接监听变化，然后用bs.reload刷新页面
    watch([`${config.assests}/*`], { 
        cwd: config.src,
        ignored: [`${config.assests}/**/*.js`, `${config.assests}/**/*.less`]
    }, bs.reload)

    watch(`**/*.js`, { cwd: config.src }, script)
    watch(`**/*.less`, { cwd: config.src }, style)
    watch(`**`, { cwd: config.public }, html)
    
    bs.init({
        port: 1024,
        // files: 'dist/**', // 当用流进行 bs.reload时，不需要files了
        server: {
            baseDir: [config.temp, config.src, config.public]  // 服务是从左到右查找文件的
        }
    })
}

const uesrefs = () => {
    return src(`*.html`, { base: config.temp, cwd: config.temp })
    .pipe(uesref({ searchPath: [config.temp, '.'] }))
    // html js css 压缩
    // 但是需要判断当前流是哪一个类型的文件，再配对对应的插件，用gulp-if插件
    // 应为读写流同时进行，所以需要用一个临时目录文件来接受输出编译文件，最后再用useref改造资源引用再输出到dist目录
    .pipe(dest(config.dist))
}

const compile = parallel(script, style, html)

const build = series(clean, parallel(series(compile, uesrefs), images, extra))

const develop = series(compile, serve)

module.exports = {
    clean,
    build,
    develop
}