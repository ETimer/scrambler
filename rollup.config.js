import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import {terser} from "rollup-plugin-terser";
import {eslint} from "rollup-plugin-eslint";
import babel from "rollup-plugin-babel";
import pkg from './package.json';
import dts from "rollup-plugin-dts";
import fs from "fs";
import path from "path";

const config = [
    {
        input: 'lib/index.ts', // 打包入口
        output: { // 打包出口
            file: pkg.browser, // 最终打包出来的文件路径和文件名
            format: 'umd', // umd是兼容amd/cjs/iife的通用打包格式，适合浏览器
            name: 'index',  // umd必填，否则报错
        },
        plugins: [ // 打包插件
            clean('dist'),   // 清空dist文件夹
            resolve(), // 查找和打包node_modules中的第三方模块
            commonjs(), // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理
            typescript(), // 解析TypeScript
            eslint({   // 代码检测
                throwOnError: true,
                throwOnWarning: true,
                include: ['lib/**'],
                exclude: ['node_modules/**']
            }),
            babel({  // 将ES6新特性转换为ES5
                exclude: 'node_modules/**', // 防止打包node_modules下的文件
                runtimeHelpers: true, // 使plugin-transform-runtime生效
            }),
            terser(),  // 压缩JS代码
        ]
    }
]

if (process.env.NODE_ENV === 'production') {
    config.push({
        // 生成 .d.ts 类型声明文件
        input: 'lib/index.ts',
        output: { // 打包出口
            file: 'dist/index.d.ts', // 最终打包出来的文件路径和文件名
            format: "es"
        },
        plugins: [dts()],
    })
}

/**
 * 清空文件夹内容
 *
 * @param dir 路径名称
 * */
function clean(dir) {
    let files = fs.readdirSync(dir)
    for (let i = 0; i < files.length; i++) {
        let newPath = path.join(dir, files[i]);
        let stat = fs.statSync(newPath)
        if (stat.isDirectory()) {
            //如果是文件夹就递归下去
            clean(newPath);
        } else {
            //删除文件
            fs.unlinkSync(newPath);
        }
    }
}

export default config