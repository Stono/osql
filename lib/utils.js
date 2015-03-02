'use strict';
var _ = require('lodash');
var mssql = require('mssql');

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
  },
  isValidDataType: function(dataType){
    if(mssql[dataType] === undefined){
      throw new Error(dataType + ' is not a valid data type.');  
    }
  },
  assignParameter: function(params, request){
    _.forEach(params, function(param) {
      if( param.type === 'input'){
        request[param.type](param.name, mssql[param.dataType], param.value);
      }else if(param.type === 'output'){
        request[param.type](param.name, mssql[param.dataType]);
      }
      return request;
    });    
  }
};
