'use strict';

module.exports = {
  errors: function(errorCodes){
    function createError(code){
      var errorCode = errorCodes[code];
      var error =  new Error(errorCode.message);
      error.number = errorCode.number;
      return error;
    }

    return Object.freeze({
      createError: createError
    });
  },
  constraints: {
    checkNotNull: function(obj, paramName) {
      if (obj === undefined || obj === null) {
        var error = paramName + ' is null or undefined';
        throw new Error(error);
      }
    },
    isNull: function(obj) {
      return obj === undefined || obj === null;
    },
    defaultValue: function(obj, defaultValue) {
      return obj || defaultValue;
    }
  }
};
