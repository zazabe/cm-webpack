#!/usr/bin/env node
var watcher = null;

try {
  var path = require('path');
  var webpack = require("webpack");
  var _ = require('underscore');
  var program = require('commander');
  var version = require('../package.json').version;

  process.on('SIGINT', function() {
    abort(null, 2);
  });
  process.on('SIGTERM', function() {
    abort();
  });

  program
    .version(version)
    .option('-c, --config <file>', 'CM webpack configuration')
    .option('-d, --dev', 'dev mode, watch and rebuild on change')
    .option('-nc, --no-color', 'not colorized output')
    .parse(process.argv);


  var CmBundlePlugin = require('../lib/plugin/CmBundlePlugin');
  var config = require(program.config);


  var compiler = webpack({
    resolve: {
      root: getRootPaths(config),
      alias: config.alias || {}
    },
    externals: config.externals || {},
    entry: config.sites,
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js',
      path: config.target,
      pathinfo: true
    },
    plugins: [
      new CmBundlePlugin(path.basename(program.config), path.dirname(program.config) + '/')
    ]
  });


  if (program.dev) {
    watcher = compiler.watch({
      aggregateTimeout: 200,
      poll: true
    }, compilerCallback);
  } else {
    compiler.run(compilerCallback);
  }

  var lastHash = null;


  var outputOptions = {
    colors: !program.noColor && require("supports-color"),
    cachedAssets: false,
    errorDetails: true,
    chunks: true,
    modules: true,
    chunkModules: true,
    reasons: false,
    cached: false
  };

  function compilerCallback(err, stats) {
    if (!program.dev) {
      compiler.purgeInputFileSystem();
    }
    if (err) {
      lastHash = null;
      return abort(err);
    }
    if (stats.hash !== lastHash) {
      lastHash = stats.hash;
      process.stdout.write(stats.toString(outputOptions) + "\n");
    }
  }

} catch (error) {
  abort(error);
}

function abort(error, signal) {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (error) {
    console.error(error.stack);
    process.exit(1);
  } else if (signal) {
    process.exit(signal + 128);
  }
}

function getRootPaths(config) {
  var rootPaths = [];
  _.each(config.namespaces, function(nsPath) {
    _.each(config.types, function(typePath) {
      rootPaths.push(path.join(nsPath, typePath));
    });
  });
  return rootPaths;
}
