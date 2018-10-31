# vue-cli-plugin-externals

> 管理项目中的外部模块

**目前仅支持cdn模块**

## 使用

vue-cli 3.x

```
vue add externals
```

yarn

```
yarn add vue-cli-plugin-externals --dev
```

npm

```
npm install vue-cli-plugin-externals --dev
```

## 功能：

1. 多页面下可以配置页面级别的externals
2. 根据配置自动去重配置webpack externals
3. 将外部模块的cdn自动注入生成的html中

## 思路：

配置在vue.config.js中，可配置的地方：

1. pages里面某个页面配置的externals字段，作为某一个页面的外部模块
2. pluginOptions externals字段，作为所有页面的通用外部模块

pluginOptions和page里的externals的类型相同，都为ModuleOption[]
ModuleOption的数据结构参考[html-webpack-externals-plugin的externals](https://github.com/mmiller42/html-webpack-externals-plugin#cdn-example)配置

## 优先级：

pages中的externals优先级高于pluginOptions中的externals

## 模块去重思路：

根据Module.module来进行去重

## 执行流程：

1. 解析好pages和pluginOptions中指定的模块配置
2. 判断是否是单页还是多页应用
3. 合并去重，将模块externals信息添加到webpack externals模块
4. 根据配置添加html-webpack-externals-plugin插件实例至webpack plugin

## 配置

在单页应用中：

```
// vue.config.js
{
    pluginOptions: {
        externals: [
            {
                module: 'jquery',
                entry: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                global: 'jQuery',
            },
        ]
    }
}
```

多页应用中：

```
{
    pages: {
        index: {
            ...其他配置项
            externals: [
                {
                    module: 'cdnModule1',
                    entry: [
                        '//pkg.cdn.com/cdnModule1.css',
                        '//pkg.cdn.com/cdnModule1.js'
                    ]
                },
                {
                    module: 'cdnModule2',
                    entry: [
                        '//pkg.cdn.com/cdnModule2.js'
                    ]
                }
            ]
        }
    }
    pluginOptions: {
        externals: [
            {
                module: 'jquery',
                entry: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                global: 'jQuery',
            },
        ]
    }
}
```
## 问题

如果本插件执行之后添加了HTML-的WebPack-插件，会导致本插件失效，具体原因如下:

https://github.com/jantimon/html-webpack-plugin/issues/1031
