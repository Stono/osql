'use strict';

var Database = require('../lib/database');
var drivers = require('./drivers');
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
    })
    .then(function(){
      db.execute(driver.dropSP2);
    })
    .then(function(){
      db.execute(driver.createSP2);
    })
    .then(function(){
      db.execute(driver.dropSP3);
    })
    .then(function(){
      db.execute(driver.createSP3);
      done();
    });
});

after(function(done) {
  db.execute(driver.dropSP1)
    .then(function(){
      db.execute(driver.dropSP2);
    })
    .then(function(){
      db.execute(driver.dropSP3);
        done();
    });
});

describe('Stored Procedure', function() {

  it('should return record set', function(done) {
      db.procedure.execute('SP_TEST1', function(err, recordSet){
        if(err){
          done(err);
        }
        should.exist(recordSet[0][0]);
        done();
      });
    });  

  it('should return record for the given id', function(done) {
      db.procedure.input('id', 'Int', 5);
      db.procedure.execute('SP_TEST2', function(err, recordSet){
        if(err){
          done(err);
        }
        recordSet[0][0].name.should.equal('test5');
        done();
      });
  });  

  it('should return output for the given id', function(done) {
      db.procedure.input('id', 'Int', 7);
      db.procedure.output('result', 'NVarChar');
      db.procedure.execute('SP_TEST3', function(err, recordSet, returnValue){
        if(err){
          done(err);
        }
        returnValue.should.equal(0);
        done();
      });
  });    
});



describe('Stored Procedure', function() {

  it('should through error if not a valid stored procedure', function(done) {
      db.procedure.execute('SP_TEST', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
    });  

  it('should through error if not a valid input parameter', function(done) {
      db.procedure.input('invalid', 'Int', 5);
      db.procedure.execute('SP_TEST2', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
  });  

  it('should through error if not a valid data type in input parameter', function(done) {
      db.procedure.input('id', 'Undefined', 5);
      db.procedure.execute('SP_TEST2', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
  });     

  it('should through error if less number of parameter passed', function(done) {
      db.procedure.execute('SP_TEST2', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
  });      

  it('should through error if more number of parameter passed', function(done) {
      db.procedure.input('id1', 'Int', 5);
      db.procedure.input('id2', 'Int', 5);
      db.procedure.execute('SP_TEST2', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
  });    

  it('should return output for the given id', function(done) {
      db.procedure.input('id', 'Int', 7);
      db.procedure.output('result', 'NVarChar');
      db.procedure.execute('SP_TEST3', function(err, recordSet){
        if(err){
          done(err);
        }
        console.log(recordSet);
      });
  });    
});