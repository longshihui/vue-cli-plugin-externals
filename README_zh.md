# vue-cli-plugin-externals

> 管理项目中的外部模块

**目前仅支持cdn模块**

## 使用

vue-cli 3.x

```bash
vue add externals
```

yarn

```bash
yarn add vue-cli-plugin-externals --dev
```

npm

```bash
npm install vue-cli-plugin-externals --dev
```

## 功能：

1. 配置外部模块页面级别、所有页面级别
2. 自动注入webpack externals配置
3. 将外部模块的cdn自动注入生成的html中

## 思路：

插件配置的命名空间为externals，插件配置项由以下两个部分组成：

1. pages配置的页面级别的外部模块
2. common配置的所有页面级别的外部模块

当应用为单页应用时，只需配置common字段即可

外部模块配置的数据结构为**Module**，数据结构如下

```javascript
// Module
{
    id: string, // Module唯一标识符
    assets: string | string[],  // 资源路径
    global: string // 模块暴露的全局变量的名字
}
```

整体的插件配置数据结构如下：

```nodejs
//vue.config.js
module.exports = {
    pluginOptions: {
        externals: {
            common: Module[],
            pages: {
                pageName: Module[]
            }
        }
    }
}
```

## 优先级：

通用模块 > 页面摸块(主要被webpack externals限制)

## 模块去重思路：

根据Module.id来进行去重

## 执行流程：

1. 解析好模块配置
2. 判断是否是单页还是多页应用
3. 合并去重，将模块externals信息添加到webpack externals模块
4. 根据配置添加html-webpack-externals-plugin插件实例至webpack plugin

## 例子

在单页应用中：

```javascript
// vue.config.js
{
    pluginOptions: {
        externals: {
            common: [
                {
                    id: 'jquery',
                    assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                    global: 'jQuery',
                },
            ]
        }
    }
}
```

多页应用中：

```
{
    pages: {
        index: './src/index.js'
    }
    pluginOptions: {
        externals: {
            common: [
                {
                    id: 'jquery',
                    assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                    global: 'jQuery',
                },
            ],
            pages: {
                index: [
                        {
                            id: 'cdnModule1',
                            assets: [
                                '//pkg.cdn.com/cdnModule1.css',
                                '//pkg.cdn.com/cdnModule1.js'
                            ],
                            global: 'cdnModule1'
                        },
                        {
                            id: 'cdnModule2',
                            assets: [
                                '//pkg.cdn.com/cdnModule2.js'
                            ],
                            global: 'cdnModule1'
                        }
                ]
            }
        }
    }
}
```
## 问题

如果本插件执行之后添加了html-webpack-plugin，会导致本插件失效，具体原因如下:

https://github.com/jantimon/html-webpack-plugin/issues/1031


