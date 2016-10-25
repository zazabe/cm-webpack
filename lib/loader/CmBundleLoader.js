var path = require('path');
var glob = require('glob');
var _ = require('underscore');
var loaderUtils = require('loader-utils');

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

  return content;
};

function generateChunkContent(chunkName, namespaces, types) {
  var content = [];
  content.push('/* --------- ' + chunkName + ' chunk --------- */');
  content.push('require.ensure([], function(require) {');
  getPaths(namespaces, types).forEach(function(path) {
    content.push('  require("' + path + '");');
  });
  content.push('}, "' + chunkName + '");\n');
  return content.join('\n');
}

function exposeModules(modules) {
  var content = [];
  _.each(modules, function(aliases, module) {
    aliases = Array.isArray(modules[module]) ? modules[module] : [modules[module]];
    aliases.forEach(function(alias) {
      content.push('window.' + alias + ' = require("' + module + '");');
    });
  });
  return content.join('\n');
}


var cachedNamespaces = {};
function fillCachedNamespaces(namespaces, types) {
  _.each(namespaces, function(nsPath, namespace) {
    cachedNamespaces[namespace] = {};
    _.each(types, function(typePath, type) {
      cachedNamespaces[namespace][type] = glob.sync(path.join(nsPath, typePath, '**', '*.js'));
    });
  });
}

function getPaths(namespaces, types) {
  var paths = [];
  _.each(namespaces, function(namespace) {
    _.each(types, function(type) {
      if (!cachedNamespaces[namespace][type]) {
        throw new Error('namespace ' + namespace + '/' + type + ' not found in cache');
      }
      paths = paths.concat(cachedNamespaces[namespace][type]);
    });
  });
  return paths;
}

