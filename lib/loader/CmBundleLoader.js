var path = require('path');
var glob = require('glob');
var _ = require('underscore');
var loaderUtils = require('loader-utils');

/**
 * @param {String} jsonConfig
 * @returns {String}
 */
module.exports = function(jsonConfig) {
  this.cacheable();
  var namespace = loaderUtils.parseQuery(this.query).namespace;
  var config = JSON.parse(jsonConfig);
  fillCachedNamespaces(config.namespaces, config.types);

  var content = '';
  _.each(config.sites, function(namespaces, site) {
    _.each(config.builds, function(types, build) {
        content += generateChunkContent(site + '.' + build, [namespace], types);
    });
  });
  content += exposeModules(config.expose);
  content += exposeLibraries(config, [namespace]);

  return content;
};

/** @var {String: {String: String[]}} */
var cachedNamespaces = {};

/**
 * @param {String} chunkName
 * @param {{String: String}[]} namespaces
 * @param {{String: String}[]} types
 * @returns {String}
 */
function generateChunkContent(chunkName, namespaces, types) {
  var content = ['\n'];
  content.push('/* --------- ' + chunkName + ' chunk --------- */');
  content.push('require.ensure([], function(require) {');
  getPaths(namespaces, types).forEach(function(path) {
    content.push('  require.include("' + path + '");');
  });
  content.push('}, "' + chunkName + '");\n');
  return content.join('\n');
}

/**
 * @param {{String: String[]|String}[]} modules
 * @returns {String}
 */
function exposeModules(modules) {
  var content = ['\n'];
  _.each(modules, function(aliases, module) {
    aliases = Array.isArray(modules[module]) ? modules[module] : [modules[module]];
    aliases.forEach(function(alias) {
      content.push('window.' + alias + ' = require("' + module + '");');
    });
  });
  return content.join('\n');
}

/**
 * @param {Object} config
 * @param {String[]} namespaces
 * @returns {String}
 */
function exposeLibraries(config, namespaces) {
  var content = ['\n'];
  _.each(namespaces, function(namespace) {
    if (!cachedNamespaces.hasOwnProperty(namespace) || !cachedNamespaces[namespace].hasOwnProperty('library')) {
      throw new Error('namespace ' + namespace + '/library not found in cache');
    }
    var rootPath = getRootPath(config, namespace, 'library');
    _.each(cachedNamespaces[namespace]['library'], function(libraryPath) {
      var module = libraryPath.replace(rootPath, '').replace(/\.js$/, '');
      var alias = module.replace(/\//g, '_');
      content.push('window.' + alias + ' = require("' + module + '");');
    });
  });
  return content.join('\n');
}

/**
 * @param {{String: String}[]} namespaces
 * @param {{String: String}[]} types
 */
function fillCachedNamespaces(namespaces, types) {
  _.each(namespaces, function(nsPath, namespace) {
    cachedNamespaces[namespace] = {};
    _.each(types, function(typePath, type) {
      cachedNamespaces[namespace][type] = glob.sync(path.join(nsPath, typePath, '**', '*.js'));
    });
  });
}

/**
 * @param {Object} config
 * @param {String} namespace
 * @param {String} type
 * @returns {String}
 */
function getRootPath(config, namespace, type) {
  if (!config.namespaces.hasOwnProperty(namespace)) {
    throw new Error('namespace ' + namespace + ' path not found');
  }
  if(!config.types.hasOwnProperty(type)) {
    throw new Error('type ' + type + ' path not found');
  }
  return path.join(config.namespaces[namespace], config.types[type]) + '/';
}

/**
 * @param {String[]} namespaces
 * @param {String[]} types
 * @returns {String[]}
 */
function getPaths(namespaces, types) {
  var paths = [];
  _.each(namespaces, function(namespace) {
    _.each(types, function(type) {
      if (!cachedNamespaces.hasOwnProperty(namespace) || !cachedNamespaces[namespace].hasOwnProperty(type)) {
        throw new Error('namespace ' + namespace + '/' + type + ' not found in cache');
      }
      paths = paths.concat(cachedNamespaces[namespace][type]);
    });
  });
  return paths;
}
