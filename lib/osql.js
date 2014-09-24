/*
 * osql
 * https://github.com/Stono/osql
 *
 * Copyright (c) 2014 Karl Stoney
 * Licensed under the MIT license.
 */

'use strict';

var App = function() {
  var execute = function() {
    return 'awesome';
  };
 
  return Object.freeze({
    execute: execute
  });
};

module.exports = App;
