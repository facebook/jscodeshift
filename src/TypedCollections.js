"use script";

var _collections = Object.create(null);

var TypedCollections = {
  create: function(type, paths, parent) {
    if (type in _collections) {
      return new _collections[type](paths, parent);
    }
  },

  register: function(collection) {
    _collections[collection.type] = collection;
    collection.setup();
  }
};

module.exports = TypedCollections;
