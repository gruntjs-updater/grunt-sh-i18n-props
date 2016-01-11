/*
 * grunt-sh-i18n-props
 *
 *
 * Copyright (c) 2014 StubHub
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('sh_i18n_props', 'Grunt plugin for compiling multiple *.properties files into a single JSON file. This is not a generic grunt plugin', function() {
         // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
                commonPropsSrc: ['common/**/*.properties'],
                scriptsPropsSrc: ['scripts/**/*.properties'],
                scriptsPropsFileName: 'i18nPropsForScripts'
            }),
            filesSrc = this.filesSrc,
            i18nRegExp = /\{@i18n\s+?key=["](.+?)["]\s*?\/}/gmi,
            path = require('path'),
            sep = path.sep,
            eol = require('os').EOL,
            fs = require('fs'),
            _ = require('underscore'),
            parser = require('properties-parser'), // Please refer to https://github.com/xavi-/node-properties-parser
            i18nPropsForScriptsTemplateFile = '../i18nPropsForScripts.tpl',
            itself = this,
            util = {};

        util = {
            // locales list is an array containing normalized Country-lang code list, e.g. ['de-de', 'en-us', 'en-gb'];
            localesList: [],
            // common properties JSON list contains the locale - commonPropsJson, e.g. [{'de-de': {'k1':'v1', 'k2':'v2'}}, {'en-gb': {'k1':'v1gb', 'k2':'v2gb'}}]
            commonPropsJsonList: [],
            // scripts properties JSON list contains the locale - scriptsPropsJson, similar with the variable commonPropsJsonList
            scriptsPropsJsonList: [],
            // locales root path in deployment folder
            localesRootPath: '',

            getLocalesRootPath: function() {
                return this.localesRootPath;
            },

            setLocalesRootPath: function(filepath) {
                this.localesRootPath = filepath;
            },

            getLocalesList: function() {
                // This will return the reference to the localesList, so any modification to this returned object will reflect to the original localesList
                // the same rule also apply to the commonPropsJsonList and scriptsPropsJsonList
                return this.localesList;
            },

            setLocalesList: function(list) {
                this.localesList = list;
            },

            getCommonPropsJsonList: function() {
                return this.commonPropsJsonList;
            },

            setCommonPropsJsonList: function(list) {
                this.commonPropsJsonList = list;
            },

            getScriptsPropsJsonList: function() {
                return this.scriptsPropsJsonList;
            },

            setScriptsPropsJsonList: function(list) {
                this.scriptsPropsJsonList = list;
            },

            endsWith: function(str, suffix) {
                return str.substring(str.length - suffix.length, str.length) === suffix;
            },

            isEmpty: function(val) {
                return (typeof val === 'undefined') || val === null;
            },

            createSpace: function(num) {
                // Default create 4 spaces
                num = (num || 4) + 1;
                return new Array(num).join(' ');
            },

            convertJson: function(json) {
                var obj = {},
                    _this = this;

                _.each(json, function(val, key) {
                    obj[key] = _this._convertStringIfBooleanOrNumber(val);
                });

                return obj;
            },

            _convertStringIfBooleanOrNumber: function(original) {
                if (original && _.isString(original)) {
                    if (original === 'true') {
                        return true;
                    }
                    if (original === 'false') {
                        return false;
                    }
                    try {
                        if (this._isNumeric(original)) {
                            return parseFloat(original);
                        }
                        return original;
                    }
                    catch (e) {
                        return original;
                    }
                }
                else {
                    return original;
                }
            },

            // http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
            // http://rosettacode.org/wiki/Determine_if_a_string_is_numeric#JavaScript
            _isNumeric: function(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            },

            getLocaleFromFilePath: function(filePath) {
                var locale = '';

                filePath = path.normalize(filePath);
                locale = _.find(this.localesList, function(val) {
                    return filePath.indexOf(sep + val + sep) > 0;
                });

                return locale;
            },

            getNormalizedLocale: function(locale) {
                return !!locale ? locale : this.getDefaultLocale();
            },

            getDefaultLocale: function() {
                return 'en-us';
            },

            // To get all of the available locales list, commonPropsJsonList, scriptsPropsJsonList
            init: function(options) {
                var _this = this,
                    scriptsPropsSrc = options.scriptsPropsSrc,
                    commonPropsSrc = options.commonPropsSrc,
                    implementedLocalesList = options.implementedLocalesList,
                    keyPrefix = options.keyPrefix,
                    localesRootPath = this.getLocalesRootPath(),
                    localesList = this.getLocalesList(),
                    commonPropsJsonList = this.getCommonPropsJsonList(),
                    scriptsPropsJsonList = this.getScriptsPropsJsonList();

                // Fetch all the actually implemented locales list
                fs.readdirSync(localesRootPath).forEach(function(locale) {
                    locale = _this.getNormalizedLocale(locale);
                    locale = locale.toLowerCase();

                    if (_.contains(implementedLocalesList, locale)) {
                        localesList.push(locale);
                    }

                });

                _.each(localesList, function(locale) {
                    var commonLocalePropsSrc = [],
                        commonPropsFileArr = [],
                        commonLocalePropsJson = {},
                        commonPropsJson = {},
                        scriptsLocalePropsSrc = [],
                        scriptsPropsFileArr = [],
                        scriptsLocalePropsJson = {},
                        scriptsPropsJson = {};

                    /*
                    ** constructure the commonPropsJsonList for each locale
                    */
                    // Re-constructure the commonPropsSrc, actually this is an array, but we need to re-build the common properties file pattern
                    // Since by default, all file paths are relative to the `Gruntfile`, please have a reference:
                    // http://gruntjs.com/api/grunt.file#grunt.file.setbase and http://gruntjs.com/api/grunt.file#grunt.file.expand
                    commonLocalePropsSrc = commonPropsSrc.map(function(commonPropsFilePattern) {
                        return path.join(localesRootPath, locale, commonPropsFilePattern);
                    });

                    commonPropsFileArr = grunt.file.expand(commonLocalePropsSrc);

                    commonPropsFileArr.forEach(function(file) {
                        var jsonObj = grunt.file.exists(file) ? parser.read(file) : {};

                        // Validate whether the key in the common properties file conform to the constraints
                        if (keyPrefix) {
                            _this.validatePropsKey(options, {
                                json: jsonObj,
                                file: file
                            });
                        }

                        jsonObj = _this.convertJson(jsonObj);
                        commonLocalePropsJson = _.extend({}, commonLocalePropsJson, jsonObj);
                    });

                    commonPropsJson[locale] = commonLocalePropsJson;
                    commonPropsJsonList.push(commonPropsJson);

                    // logic to handle the scripts properties file, generate a combiled properties file for each locale
                    // then convert it to a JS file conform to the require js syntax
                    scriptsLocalePropsSrc = scriptsPropsSrc.map(function(scriptsPropsFilePattern) {
                        return path.join(localesRootPath, locale, scriptsPropsFilePattern);
                    });

                    scriptsPropsFileArr = grunt.file.expand(scriptsLocalePropsSrc);

                    scriptsPropsFileArr.forEach(function(file) {
                        var jsonObj = grunt.file.exists(file) ? parser.read(file) : {};

                        // Validate whether the key in the script properties file conform to the constraints
                        if (keyPrefix) {
                            _this.validatePropsKey(options, {
                                json: jsonObj,
                                file: file
                            });
                        }

                        jsonObj = _this.convertJson(jsonObj);
                        scriptsLocalePropsJson = _.extend({}, scriptsLocalePropsJson, jsonObj);
                    });

                    scriptsPropsJson[locale] = scriptsLocalePropsJson;
                    scriptsPropsJsonList.push(scriptsPropsJson);
                });

                grunt.verbose.writeln(('[i18n-props] ==== available locale list is: ').bold.blue, localesList);
                grunt.verbose.writeln(('[i18n-props] ==== commonPropsJsonList is: ').bold.blue, commonPropsJsonList);
                grunt.verbose.writeln(('[i18n-props] ==== scriptsPropsJsonList is: ').bold.blue, scriptsPropsJsonList);
            },

            // Combile commonPropsJson with scriptsPropsJson to generate a new sripts properties for each locale
            generateScriptsProps: function(options) {

                var scriptsPropsFileName = options.scriptsPropsFileName;
                var i18nPropsId = options.i18nPropsId || '';
                var i18nPropsDeps = options.i18nPropsDeps || [];
                var localesList = this.getLocalesList();
                var commonPropsJsonList = this.getCommonPropsJsonList();
                var scriptsPropsJsonList = this.getScriptsPropsJsonList();
                var getScriptsPropsFilePath = options.getScriptsPropsFilePath;
                var _this = this;

                localesList.forEach(function(locale) {
                    var commonPropsJson = {},
                        scriptsPropsJson = {},
                        content = '',
                        destPath = '';

                    destPath = getScriptsPropsFilePath({
                        locale: locale,
                        scriptsPropsFileName: scriptsPropsFileName,
                        task: itself
                    });

                    _.some(commonPropsJsonList, function(obj) {
                        if (obj[locale]) {
                            commonPropsJson = obj[locale];
                            return true;
                        }
                    });

                    _.some(scriptsPropsJsonList, function(obj) {
                        if (obj[locale]) {
                            scriptsPropsJson = obj[locale];
                            return true;
                        }
                    });

                    scriptsPropsJson = _.extend({}, commonPropsJson, scriptsPropsJson);

                    grunt.verbose.subhead('[i18n-props] **** scriptsPropsJson', scriptsPropsJson);

                    content = grunt.file.read(path.join(__dirname, i18nPropsForScriptsTemplateFile));

                    // replace the {i18nPropsId} and {i18nPropsDeps} with real i18n props module definition
                    content = content.replace('{i18nPropsId}', i18nPropsId);
                    i18nPropsDeps = JSON.stringify(i18nPropsDeps);
                    i18nPropsDeps = i18nPropsDeps.substr(1, i18nPropsDeps - 2);
                    content = content.replace('{i18nPropsDeps}', i18nPropsDeps);

                    // Pretty print the JSON file format
                    scriptsPropsJson = JSON.stringify(scriptsPropsJson, null, 4);
                    scriptsPropsJson = scriptsPropsJson.replace(new RegExp(eol + _this.createSpace(4), 'mg'), eol + _this.createSpace(8));
                    scriptsPropsJson = scriptsPropsJson.replace('}', _this.createSpace(4) + '}');

                    content = content.replace('{{i18nPropsJson}}', scriptsPropsJson);

                    grunt.file.write(destPath, content);

                });
            },

            validatePropsKey: function(options, settings) {
                var keyPrefix = options.keyPrefix,
                    json = settings.json,
                    propsFilePath = settings.file;

                if (!this.endsWith(keyPrefix, '.')) {
                    keyPrefix = keyPrefix + '.';
                }

                _.each(_.keys(json), function(key) {
                    if (key.indexOf(keyPrefix) !== 0) {
                        grunt.fail.fatal('[i18n-props] ==== [[ this key: ' + (key).bold + ' ]] in properties file - ' + (propsFilePath).bold + ' does not conform to the key constrains');
                    }
                });

            },

            checkRequiredConfig: function() {
                var requiredOptions = [
                    'localeFilesExpandPatterns',
                    'implementedLocalesList',
                    'getScriptsPropsFilePath',
                    'keyPrefix',
                    'i18nPropsId'
                ];

                itself.requiresConfig.apply(itself, _.map(requiredOptions, function(val) {
                    return [itself.name, itself.target, 'options', val].join('.');
                }));
            },

            copyLocalesPropsFiles: function(options) {
                var patterns = options.localeFilesExpandPatterns,
                    fileListMapping = grunt.file.expandMapping(patterns.src, patterns.dest, patterns);

                grunt.verbose.writeln('[i18n-props] ==== locale file list mapping: ', fileListMapping);
                _.each(fileListMapping, function(obj) {
                    var src = obj.src[0],
                        dest = obj.dest;

                    if (grunt.file.isDir(src)) {
                        grunt.file.mkdir(dest);
                    }
                    else {
                        grunt.file.copy(src, dest);
                    }
                });

                // Set locales root path in deployment folder
                this.setLocalesRootPath(patterns.dest);

                grunt.verbose.writeln(('[i18n-props] ==== localesRootPath is: ').bold.blue, this.getLocalesRootPath());
            },

            start: function(options) {
                this.generateScriptsProps(options);
            }

        };

        // Before running this task, firstly make sure all required config options has been specified.
        util.checkRequiredConfig();
        util.copyLocalesPropsFiles(options);

        // Initialize all of the variable values
        util.init(options);
        util.start(options);

    });

};
