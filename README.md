# grunt-sh-i18n-props

> Grunt plugin for compiling multiple *.properties files into a single JSON file.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-sh-i18n-props --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-sh-i18n-props');
```

## The "sh_i18n_props" task

### Overview
In your project's Gruntfile, add a section named `sh_i18n_props` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  sh_i18n_props: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.localeFilesExpandPatterns
Type: `Object`

This config option is **`required`**

An object value, normally it should specify the i18n/locales folder in the app source folder and where all the source files should be copied into the deployment build environment, this value normally is a pattern value which can be passed into the grunt API <a href="http://gruntjs.com/api/grunt.file#grunt.file.expandmapping" target="_blank">`grunt.file.expandMapping`</a>, one example is like below:

```javascript
localeFilesExpandPatterns: {
    src: ['**/*.properties'],
    cwd: 'app/multi-event/i18n',
    dest: '<%= buildDevPath %><%= multiFeatureI18nPath %>',
    rename: function(dest, matchedSrcPath, options) {
        return path.join(dest, matchedSrcPath);
    }
}
```
And <a href="https://sourcegraph.com/github.com/gruntjs/grunt/.CommonJSPackage/grunt/.def/commonjs/lib/grunt/file.js/-/expandMapping" target="_blank">here</a> is a detail example about how to use the `grunt.file.expandMapping` API.

#### options.implementedLocalesList
Type: `Array`

This config option is **`required`**

It specify the implemented locales list for current application.


#### options.getScriptsPropsFilePath
Type: `Function`

Returned value type: `String`, this is **`required`**

It return the generated localized javascript properties file path in deployment folder structure. 

#### options.keyPrefix
Type: `String`

This config option is **`required`**

It specify the keyPrefix in all properties files under i18n folder to make sure all the properties key have to conform to the key constrains. 

#### options.i18nPropsId
Type: `String`

This config option is **`required`**

It specify the module id of generated i18n properties file, See below exmaple:

If the options has the following config

```javascript
options: {
    ...
    i18nPropsId: 'geolocation-i18nProps'
    ...
}
```

Then the generated i18nPropsForScripts.js will be like below:
```javascript
define('geolocation-i18nProps', [], function(){
    return {
        "common.components.geolocation.defaultLink.text": "all locations",
        "common.components.geolocation.popular-in.text": "Popular events in&nbsp;",
        "common.components.geolocation.popular-near.text": "Popular events near&nbsp;"
    };
});
```

#### options.i18nPropsDeps
Type: `Array`

No default value, this is **`optional`**

It specify the module dependencies of generated i18n properties file, normally app don't need to config it.

#### options.commonPropsSrc
Type: `Array`

Default value: `['common/**/*.properties']`, this is **`optional`**

It specify where the common properties file locate, it should be relative to the locale's folder. Normally, this value should not be changed and app can just accept the default value.

#### options.scriptsPropsSrc
Type: `Array`

Default value: `['scripts/**/*.properties']`, this is **`optional`**

It specify where the scripts properties file locate, it should be relative to the locale's folder. Normally, this value should not be changed and app can just accept the default value.

#### options.scriptsPropsFileName
Type: `Array`

Default value: `'i18nPropsForScripts'`, this is **`optional`**

It specify the generated javascript properties file name.

### Usage Examples

#### Custom Options
The exmaple below is coming from `https://github.corp.ebay.com/rchavan/app-sellflow/tree/selli18n`.

```js
meventdev: {
    options: {
        localeFilesExpandPatterns: {
            src: ['**/*.properties'],
            cwd: 'app/multi-event/i18n',
            dest: '<%= buildDevPath %><%= multiFeatureI18nPath %>',
            rename: function(dest, matchedSrcPath, options) {
                return path.join(dest, matchedSrcPath);
            }
        },
        implementedLocalesList: ['en-us', 'en-gb'],
        scriptsPropsFileName: '<%= scriptsPropsFileName %>',
        getScriptsPropsFilePath: function (settings) {
            var task = settings.task,
                locale = settings.locale,
                scriptsPropsFileName = settings.scriptsPropsFileName,
                buildDevPath = grunt.config.get('buildDevPath'),
                multiFeatureScriptsPath = grunt.config.get('multiFeatureScriptsPath'),
                destpath = '';

            destpath = path.join(buildDevPath, multiFeatureScriptsPath, locale, scriptsPropsFileName + '.js');
            grunt.verbose.subhead('[i18n-props] ==== scriptsPropsFilePath-----', destpath);                        

            return destpath;
        },
        keyPrefix: '<%= config.appName %>' + 'multiEvent'
    },
}
```

And here is another exmaple which is coming from `https://github.corp.ebay.com/Stubhub/app-reference/tree/develop`.

```js
dev:{
    options:{
        localeFilesExpandPatterns: {
          src: ['**/*.properties'],
          dest: '<%= buildDevPath %><%= i18nRootPath %>',
          cwd: 'app/i18n',
          rename: function(dest, matchedSrcPath, options) {
              return path.join(dest, matchedSrcPath);
          }
        },
        implementedLocalesList: ['en-us', 'en-gb', 'de-de'],
        getScriptsPropsFilePath: function (settings) {
            var locale = settings.locale,
                scriptsPropsFileName = settings.scriptsPropsFileName,
                buildDevPath = grunt.config.get('buildDevPath'),
                featureScriptsPath = grunt.config.get('featureScriptsPath'),
                destpath = '';
            
            destpath = path.join(buildDevPath, featureScriptsPath, locale, scriptsPropsFileName + '.js');

            return destpath;
        },
        keyPrefix: '<%= config.appName %>',
        scriptsPropsFileName: '<%= scriptsPropsFileName %>'
    },
} 
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
