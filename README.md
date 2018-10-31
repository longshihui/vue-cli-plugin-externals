# vue-cli-plugin-externals

> Manage external modules in the project

**Currently only supports cdn modules**

[中文文档](./README_zh.md)

## Usage

Vue-cli 3.x

```
vue add externals
```

Yarn

```
yarn add vue-cli-plugin-externals --dev
```

Npm

```
npm install vue-cli-plugin-externals --dev
```

## Features:

1. You can configure page level externals under multiple pages.
2. Automatically deconfigure webpack externals according to configuration
3. Automatically inject the cdn of the external module into the generated html

## Ideas:

Configured in vue.config.js, configurable:

1. The externals field of a page in the page, as an external module of a page
2. pluginOptions externals field, as a generic external module for all pages

The pluginOptions are the same type as the externals in the page, both of which are ModuleOption[]
The data structure of ModuleOption is configured with reference to [html-webpack-externals-plugin's externals] (https://github.com/mmiller42/html-webpack-externals-plugin#cdn-example)

## Priority:

Externals in pages have higher priority than externals in pluginOptions

## Module deduplication:

De-weighting according to Module.module

## Implementation process:

1. Parsing the module configuration specified in pages and pluginOptions
2. Determine if it is a single-page or multi-page application
3. Merge deduplication, add module externals information to webpack externals module
4. Add the html-webpack-externals-plugin plugin instance to the webpack plugin according to the configuration.

## Configuration

In a single page application:

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

In a multi-page application:

```
{
    pages: {
        index: {
            ...other configuration items
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


