# vue-cli-plugin-externals

> Manage external modules in the project

** Currently only supports cdn module**

[中文文档](./README_zh.md)

## Use

Vue-cli 3.x

```bash
Vue add externals
```

Yarn

```bash
Yarn add vue-cli-plugin-externals --dev
```

Npm

```bash
Npm install vue-cli-plugin-externals --dev
```

## Features

1. Configure external module page level, all page levels
2. Automatically inject webpack externals configuration
3. Automatically inject the cdn of the external module into the generated html

## Ideas

The namespace of the plugin configuration is externals, and the plugin configuration item consists of the following two parts:

1.page-configured page-level external module
2. Commonly configured all page level external modules

When the app is a single-page app, just configure the common field.

The data structure of the external module configuration is **Module**, and the data structure is as follows

```javascript
// Module
{
    Id: string, // Module unique identifier
    Assets: string | string[], // resource path
    Global: string // the name of the global variable exposed by the module
}
```

The overall plugin configuration data structure is as follows:

```nodejs
//vue.config.js
Module.exports = {
    pluginOptions: {
        Externals: {
            Common: Module[],
            Pages: {
                pageName: Module[]
            }
        }
    }
}
```

## Priority

External modules in pages have higher priority than external modules in common

## Module to de-thinking ideas:

De-weighting according to Module.id

## Implementation process:

1. Analyze the module configuration
2. Determine if it is a single-page or multi-page application
3. Merge deduplication, add module externals information to the webpack externals module
4. Add the html-webpack-externals-plugin plugin instance to the webpack plugin according to the configuration.

## Example

In a single page application:

```javascript
// vue.config.js
{
    pluginOptions: {
        Externals: {
            Common: [
                {
                    Id: 'jquery',
                    Assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                    Global: 'jQuery',
                },
            ]
        }
    }
}
```

In a multi-page application:

```
{
    Pages: {
        Index: './src/index.js'
    }
    pluginOptions: {
        Externals: {
            Common: [
                {
                    Id: 'jquery',
                    Assets: 'https://unpkg.com/jquery@3.2.1/dist/jquery.min.js',
                    Global: 'jQuery',
                },
            ],
            Pages: {
                Index: [
                        {
                            Id: 'cdnModule1',
                            Assets: [
                                '//pkg.cdn.com/cdnModule1.css',
                                '//pkg.cdn.com/cdnModule1.js'
                            ]
                        },
                        {
                            Id: 'cdnModule2',
                            Assets: [
                                '//pkg.cdn.com/cdnModule2.js'
                            ]
                        }
                ]
            }
        }
    }
}
```
## problem

If the html-webpack-plugin is added after the plugin is executed, the plugin will be invalid. The specific reasons are as follows:

Https://github.com/jantimon/html-webpack-plugin/issues/1031

