CM Webpack
==========

[webpack][webpack] for the [CM][cm] framework.

 [webpack]: https://github.com/webpack/webpack
 [cm]: https://github.com/cargomedia/cm

Configuration
=============

```
{
  "sites": {
    "site1": [
      "namespace:CM",
      "namespace:Foo",
      "namespace:Bar"
    ]
  },
  "namespaces": {
    "CM": "/home/vagrant/foo/vendor/cargomedia/cm",
    "Foo": "/home/vagrant/foo/library/Foo",
    "Bar": "/home/vagrant/foo/library/Bar"
  },
  "types": {
    "before-body": "client-vendor/before-body",
    "before-body-main": "client-vendor/before-body-main",
    "after-body": "client-vendor/after-body",
    "after-body-main": "client-vendor/after-body-main",
    "source": "client-vendor/source",
    "library": "library"
  },
  "builds": {
    "before": ["before-body", "before-body-main"],
    "after": ["after-body", "after-body-main", "library"]
  },
  "alias": {
    "jquery": "10-jquery/jquery",
    "underscore": "20-underscore/underscore",
    "jquery.ui.widget": "40-jquery.ui.widget/jquery.ui.widget",
    "bluebird": "01-bluebird/01-bluebird",
    "backbone": "30-backbone/backbone.js"
  },
  "expose": {
    "jquery": ["$", "jQuery"],
    "bluebird": "Promise",
    "underscore": "_",
    "backbone": "Backbone"
  },
  "target": "/home/vagrant/foo/public/static/assets"
}
```
