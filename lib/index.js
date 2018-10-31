/**
 * 管理项目中的外部模块
 *
 * 目前仅支持cdn模块
 *
 * 功能：
 * 1. 多页面下可以配置页面级别的externals
 * 2. 根据配置自动去重配置webpack externals
 * 3. 将外部模块的cdn自动注入生成的html中
 *
 * 思路：
 * 配置在vue.config.js中，可配置的地方：
 * 1. pages里面某个页面配置的externals字段，作为某一个页面的外部模块
 * 2. pluginOptions externals字段，作为所有页面的通用外部模块
 *
 * pluginOptions和page里的externals的类型相同，都为Module[]
 * Module的数据结构参考html-webpack-externals-plugin的externals配置
 * https://www.npmjs.com/package/html-webpack-externals-plugin
 *
 * 优先级：
 * pages中的externals优先级高于pluginOptions中的externals
 *
 * 模块去重思路：
 * 根据Module.module来进行去重
 *
 * 执行流程：
 * 1. 解析好pages和pluginOptions中指定的模块配置
 * 2. 判断是否是单页还是多页应用
 * 3. 合并去重，将模块externals信息添加到webpack externals模块
 * 4. 根据配置添加html-webpack-externals-plugin插件实例至webpack plugin
 */
const _ = require('lodash');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

/**
 * 是否是单页应用
 * @param pageOptions
 * @return {boolean}
 */
function isSPA(pageOptions) {
    return Object.keys(pageOptions).length === 0;
}
function hasExternals(pageOption) {
    return 'externals' in pageOption && Array.isArray(pageOption.externals) && pageOption.externals.length > 0;
}
/**
 * 判断页面配置不包含externals字段
 * @param pageOptions
 * @return {boolean}
 */
function withoutExternals(pageOptions) {
    return Object.keys(pageOptions).every((pageName) => hasExternals(pageOptions[pageName]));
}

module.exports = (api, projectOptions) => {
    // 页面配置
    const pageOptions = projectOptions.pages || {};
    // 通用外部模块配置
    let commonExternals = _.get(projectOptions, 'pluginOptions.externals', []);
    
    if (isSPA(pageOptions)) {
        // 如果为单页应用，且通用externals为空，则什么都不做
        if (!commonExternals.length) {
            return;
        }
    } else {
        // 如果为多页应用，且页面级配置以及通用externals为空，则什么都不做
        if (withoutExternals(pageOptions) && !commonExternals.length) {
            return;
        }
    }
    
    if (isSPA(pageOptions)) {
        api.chainWebpack((config) => {
            config.plugin('externals-modules')
                .use(HtmlWebpackExternalsPlugin, [
                    {
                        externals: commonExternals
                    }
                ]);
            
            config.externals(
                commonExternals.reduce((webpackExternals, moduleOption) => {
                    webpackExternals[moduleOption.module] = moduleOption.global;
                }, {})
            );
        });
    } else {
        // 通用外部模块
        const commonModules = new Set();
        // 页面级别外部模块
        const pageModules = new Map();
        // 所有外部模块
        const allModules = new Map();
        // 将所有通用外部模块添加至commonModules中
        // 方便在多页应用时去重
        if (commonExternals.length > 0) {
            commonExternals.forEach((moduleOption) => {
                // 将名字添加至外部模块集合
                commonModules.set(moduleOption.module);
                // 注册至全部模块
                allModules.set(moduleOption.module, moduleOption);
            });
        }
        
        Object.keys(pageOptions)
        // 筛选出含有externals配置的页面配置
            .filter((pageName) => hasExternals(pageOptions[pageName]))
            // 根据通用外部模块将每一个页面配置的外部模块进行去重
            .forEach((pageName) => {
                const externals = pageOptions[pageName].externals;
                pageModules.set(pageName, []);
                externals.forEach((moduleOption) => {
                    // 判断公共externals是否含有模块，如果有，则不添加module
                    if (!commonModules.has(moduleOption.module)) {
                        pageModules.get(pageName).push(moduleOption);
                        allModules.set(moduleOption.module, moduleOption);
                    }
                })
            });
        
        api.chainWebpack((config) => {
            if (commonModules.size > 0) {
                config.plugin('externals-modules')
                    .use(HtmlWebpackExternalsPlugin, [
                        {
                            externals: commonExternals
                        }
                    ]);
            }
            
            for (let [pageName, moduleOptions] of pageModules) {
                let pageOption = pageOptions[pageName];
                console.log(moduleOptions);
                config.plugin(`${pageName}-externals-modules`)
                    .use(HtmlWebpackExternalsPlugin, [
                        {
                            externals: moduleOptions,
                            files: [pageOption.filename || pageName + '.html']
                        }
                    ]);
            }
            // 生成webpack externals配置对象
            let webpackExternals = {};
            allModules.forEach((moduleOption, moduleGlobalName) => {
                webpackExternals[moduleOption.module] = moduleGlobalName
            });
            config.externals(webpackExternals);
        });
    }
};
