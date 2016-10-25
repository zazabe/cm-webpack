var path = require('path');

/**
 * @class CmBundlePlugin
 *
 * @param {String} [configFile]
 * @param {String} [configPath]
 * @param {String[]} [loaders]
 */
function CmBundlePlugin(configFile, configPath, loaders) {
  this._configFile = configFile || 'webpack.cm.json';
  this._configPath = configPath || './';
  this._loaders = loaders || [path.resolve(__dirname + '/../loader/CmBundleLoader')];
  this._pattern = /^namespace:(\S+)$/;
}

CmBundlePlugin.prototype = {
  /**
   * @param {String} request
   * @returns {String|Boolean}
   */
  extract: function(request) {
    var matches = (request || '').match(this._pattern);
    return matches && matches[1];
  },

  /**
   * @param {Compiler} compiler
   */
  apply: function(compiler) {
    compiler.resolvers.normal.plugin('module', function(request, finalCallback) {
      var namespace = this.extract(request.request);
      if (!namespace) {
        return finalCallback();
      } else {
        return finalCallback(null, {
          path: this._configPath,
          query: this._configFile + '?namespace=' + namespace,
          request: request.request,
          resolved: true
        });
      }
    }.bind(this));

    compiler.plugin("normal-module-factory", function(nmf) {

      nmf.plugin("after-resolve", function(data, callback) {
        var namespace = this.extract(data.rawRequest);
        if (namespace) {
          data.loaders = this._loaders.map(function(loader) {
            return loader + '?namespace=' + namespace;
          });
          data.request = '( ' + namespace + ' bundle)';
          data.userRequest = '( ' + namespace + ' bundle)';
        }
        return callback(null, data);

      }.bind(this));
    }.bind(this));
  }
};

module.exports = CmBundlePlugin;
