#!/usr/bin/env node

// 把gulp命令行执行的构建任务指向lib/index.js里
process.argv.push('--cwd')
process.argv.push(process.cwd())  // 指定项目工作目录为当前命令行所在的目录，一般都是再项目根目录下
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp')