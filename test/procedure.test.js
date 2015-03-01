'use strict';

var Database = require('../lib/database');
var drivers = require('./drivers');
var mssql = require('mssql');
var should = require('should');

var getDriver = function(name, opts) {
  return new Database(name, opts);
};

var driver = drivers[1];
var db = getDriver(driver.name, driver.opts);

before(function(done) {
  db.execute(driver.dropSP1)
    .then(function(){
      db.execute(driver.createSP1);
    });
  db.execute(driver.dropSP2)
    .then(function(){
      db.execute(driver.createSP2);
    });
  db.execute(driver.dropSP3)
    .then(function(){
      db.execute(driver.createSP3);
    });
  done();
});

after(function(done) {
  db.execute(driver.dropSP1);
  db.execute(driver.dropSP2);
  db.execute(driver.dropSP3);
  done();
});

describe('Stored Procedure', function() {

  it('should return record set', function(done) {
      db.procedure()
        .then(function(request){
          request.execute('SP_TEST1', function(err, recordSet){
            if(err){
              done(err);
            }
            should.exist(recordSet[0][0]);
            done();
          });
        });
  });  

  it('should return record for the given id', function(done) {
      db.procedure()
        .then(function(request){
          request.input('id', mssql.Int(5), 5);
          request.execute('SP_TEST2', function(err, recordSet){
            if(err){
              done(err);
            }
            recordSet[0][0].name.should.equal('test5');
            done();
          });
        });
  });  

  it('should return output for the given id', function(done) {
      db.procedure()
        .then(function(request){
          request.input('id', mssql.Int(5), 7);
          request.input('result', mssql.NVarChar(50));
          request.execute('SP_TEST3', function(err, recordSet){
            if(err){
              done(err);
            }
            recordSet.returnValue.should.equal(0);
            done();
          });
        });
  });    
 
});
