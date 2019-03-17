const Service = require('@vue/cli-service');
const path = require('path');
const Plugin = require('../');

const ProjectPath = path.resolve(__dirname, `./test-project`);

function getWebpackConfig(projectOptions, chainable = false) {
    const service = new Service(ProjectPath, {
        plugins: [
            {
                id: require('../package').name,
                apply: Plugin
            }
        ],
        inlineOptions: projectOptions
    });
    service.init('production');
    if (chainable) {
        return service.resolveChainableWebpackConfig();
    } else {
        return service.resolveWebpackConfig();
    }
}

function getPluginOptions(chainableConfig, name) {
    let options = null;
    chainableConfig.plugin(name).tap(optionsList => {
        options = optionsList[0] || null;
        return optionsList;
    });
    return options;
}

test('无配置，无插件实例', () => {
    const webpackConfig = getWebpackConfig({}, true);
    expect(webpackConfig.plugins.has('externals-modules')).toBe(false);
});

describe('项目为单页应用时', () => {
    it('配置common字段时，插件正常运行', () => {
        const jQueryModule = {
            id: 'jQuery',
            assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
            global: '$'
        };
        const webpackConfig = getWebpackConfig(
            {
                pluginOptions: {
                    externals: {
                        common: [jQueryModule]
                    }
                }
            },
            true
        );
        expect(webpackConfig.plugins.has('externals-modules')).toBe(true);
        let realPluginOptions = getPluginOptions(
            webpackConfig,
            'externals-modules'
        );
        expect(realPluginOptions).not.toBe(null);
        let external = realPluginOptions.externals[0];
        expect(external.module).toBe(jQueryModule.id);
        expect(external.entry).toBe(jQueryModule.assets);
        expect(external.global).toBe(jQueryModule.global);
    });
    it('配置pages字段无效', () => {
        const webpackConfig = getWebpackConfig(
            {
                pluginOptions: {
                    externals: {
                        common: [
                            {
                                id: 'jQuery',
                                assets:
                                    'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                                global: '$'
                            }
                        ],
                        pages: {
                            page1: [
                                {
                                    id: 'cdnModule1',
                                    assets: [
                                        '//pkg.cdn.com/cdnModule1.css',
                                        '//pkg.cdn.com/cdnModule1.js'
                                    ]
                                }
                            ],
                            page2: [
                                {
                                    id: 'cdnModule2',
                                    assets: ['//pkg.cdn.com/cdnModule2.js']
                                }
                            ]
                        }
                    }
                }
            },
            true
        );
        expect(webpackConfig.plugins.has('externals-modules')).toBe(true);
        expect(webpackConfig.plugins.has('page1-externals-modules')).toBe(
            false
        );
        expect(webpackConfig.plugins.has('page2-externals-modules')).toBe(
            false
        );
    });
});

describe('项目为多页应用时', () => {
    it('配置common字段时，插件正常运行', () => {
        const jQueryModule = {
            id: 'jQuery',
            assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
            global: '$'
        };
        const webpackConfig = getWebpackConfig(
            {
                pages: {
                    page1: './src/page1.js',
                    page2: './src/page2.js'
                },
                pluginOptions: {
                    externals: {
                        common: [jQueryModule]
                    }
                }
            },
            true
        );
        expect(webpackConfig.plugins.has('externals-modules')).toBe(true);
        let realPluginOptions = getPluginOptions(
            webpackConfig,
            'externals-modules'
        );
        expect(realPluginOptions).not.toBe(null);
        let external = realPluginOptions.externals[0];
        expect(external.module).toBe(jQueryModule.id);
        expect(external.entry).toBe(jQueryModule.assets);
        expect(external.global).toBe(jQueryModule.global);
    });
    it('配置的pages字段，插件正常运行', () => {
        const webpackConfig = getWebpackConfig(
            {
                pages: {
                    page1: './src/page1.js',
                    page2: './src/page2.js'
                },
                pluginOptions: {
                    externals: {
                        pages: {
                            page1: [
                                {
                                    id: 'cdnModule1',
                                    assets: [
                                        '//pkg.cdn.com/cdnModule1.css',
                                        '//pkg.cdn.com/cdnModule1.js'
                                    ],
                                    global: 'cdnModule1'
                                }
                            ],
                            page2: [
                                {
                                    id: 'cdnModule2',
                                    assets: ['//pkg.cdn.com/cdnModule2.js'],
                                    global: 'cdnModule2'
                                }
                            ]
                        }
                    }
                }
            },
            true
        );
        expect(webpackConfig.plugins.has('page1-externals-modules')).toBe(true);
        expect(webpackConfig.plugins.has('page2-externals-modules')).toBe(true);
        let page1Options = getPluginOptions(
            webpackConfig,
            'page1-externals-modules'
        ).externals[0];
        let page2Options = getPluginOptions(
            webpackConfig,
            'page2-externals-modules'
        ).externals[0];
        expect(page1Options.module).toBe('cdnModule1');
        expect(page1Options.entry).toContain('//pkg.cdn.com/cdnModule1.css');
        expect(page1Options.entry).toContain('//pkg.cdn.com/cdnModule1.js');
        expect(page1Options.global).toBe('cdnModule1');
        expect(page2Options.module).toBe('cdnModule2');
        expect(page2Options.entry).toContain('//pkg.cdn.com/cdnModule2.js');
        expect(page2Options.global).toBe('cdnModule2');
    });
    it('当页面级别的外部模块和通用模块相同时，通用模块的优先级比页面模块的优先级高', () => {
        const commonModule = {
            id: 'module',
            assets: '//pkg.cdn.com/common/module.js',
            global: 'module'
        };
        const privateModule = {
            id: 'module',
            assets: '//pkg.cdn.com/private/module.js',
            global: 'module'
        };
        const webpackConfig = getWebpackConfig(
            {
                pages: {
                    page1: './src/page1.js',
                    page2: './src/page2.js'
                },
                pluginOptions: {
                    externals: {
                        common: [commonModule],
                        pages: {
                            page1: [privateModule]
                        }
                    }
                }
            },
            true
        );

        let page1Options = getPluginOptions(
            webpackConfig,
            'page1-externals-modules'
        );
        let page2Options = getPluginOptions(
            webpackConfig,
            'page2-externals-modules'
        );
        let commonOptions = getPluginOptions(
            webpackConfig,
            'externals-modules'
        );
        expect(page1Options).toBe(null);
        expect(page2Options).toBe(null);
        expect(commonOptions).not.toBe(null);

        let commonExternals = commonOptions.externals;
        expect(commonExternals[0].module).toBe(commonModule.id);
        expect(commonExternals[0].entry).toBe(commonModule.assets);
        expect(commonExternals[0].global).toBe(commonModule.global);
    });
    it('能正确引入无导出模块', () => {
        const commonModule = {
            id: 'flexible',
            assets: '//pkg.cdn.com/common/flexible.js',
            global: null
        };
        const webpackConfig = getWebpackConfig(
            {
                pages: {
                    page1: './src/page1.js',
                    page2: './src/page2.js'
                },
                pluginOptions: {
                    externals: {
                        common: [commonModule]
                    }
                }
            },
            true
        );
        let commonOptions = getPluginOptions(
            webpackConfig,
            'externals-modules'
        );
        let commonExternals = commonOptions.externals;
        let webpackExternals = webpackConfig.get('externals');
        expect(commonExternals[0].module).toBe(commonModule.id);
        expect(commonExternals[0].entry).toBe(commonModule.assets);
        expect(commonExternals[0].global).toBe(commonModule.global);
        expect(commonModule.id in webpackExternals).toBe(false);
    });
});
