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
 * 根据Module.id来进行去重
 *
 * 执行流程：
 * 1. 解析好pages和pluginOptions中指定的模块配置
 * 2. 判断是否是单页还是多页应用
 * 3. 合并去重，将模块externals信息添加到webpack externals模块
 * 4. 根据配置添加html-webpack-externals-plugin插件实例至webpack plugin
 */
const _ = require('lodash');
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');

function module2HtmlWebpackExternalsPluginOptions(modules) {
    const options = [];
    modules.forEach(module => {
        options.push({
            module: module.id,
            entry: module.assets,
            global: module.global
        })
    });
    return options;
}

function appendWebpackExternalsConfig(config, modules) {
    // 生成webpack externals配置对象
    let webpackExternals = {};
    modules.forEach((module, moduleId) => {
        webpackExternals[moduleId] = module.global;
    });
    config.externals(webpackExternals);
}

module.exports = (api, projectOptions) => {
    const modules = new Map();
    const commonModules = new Map();
    const pagesModules = new Map();
    // 页面配置
    const pages = projectOptions.pages || {};
    // 通用外部模块配置
    const commonOptions = _.get(projectOptions, 'pluginOptions.externals.common', []);
    const pagesOptions = _.get(projectOptions, 'pluginOptions.externals.pages', {});
    if (Array.isArray(commonOptions)) {
        commonOptions.forEach(module => {
            modules.set(module.id, module);
            commonModules.set(module.id, module);
        })
    }
    
    if (_.isPlainObject(pagesOptions)) {
        Object.keys(pages).forEach(pageName => {
            if (pageName in pagesOptions) {
                const pageModules = new Map();
                pagesOptions[pageName].forEach(module => {
                    if (!commonModules.has(module.id)) {
                        modules.set(module.id, module);
                        pageModules.set(module.id, module);
                    }
                });
                if (pageModules.size > 0) {
                    pagesModules.set(pageName, pageModules);
                }
            }
        })
    }
    
    api.chainWebpack(config => {
        if (commonModules.size) {
            config.plugin('externals-modules')
                .use(HtmlWebpackExternalsPlugin, [
                    {
                        externals: module2HtmlWebpackExternalsPluginOptions(commonModules)
                    }
                ]);
        }
        for (let [pageName, pageModules] of pagesModules) {
            let pageOption = pages[pageName];
            config.plugin(`${pageName}-externals-modules`)
                .use(HtmlWebpackExternalsPlugin, [
                    {
                        externals: module2HtmlWebpackExternalsPluginOptions(pageModules),
                        files: [pageOption.filename || pageName + '.html']
                    }
                ]);
        }
        appendWebpackExternalsConfig(config, modules);
    });
};
