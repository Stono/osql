'use strict';

var Database = require('../lib/database');
var drivers = require('./drivers');
var should = require('should');
var fs = require('fs');

var getDriver = function(name, opts) {
  return new Database(name, opts);
};

var driver = drivers[1];
var db = getDriver(driver.name, driver.opts);

var path = 'test/sql/';
var options = {encoding:'utf8'};
var script;

before(function(done) {
  script = fs.readFileSync(path + 'dropSP1.sql',options);
  db.execute(driver.dropSP1)
    .then(function(){
      script = fs.readFileSync(path + 'createSP1.sql',options);
      db.execute(script);
    })
    .then(function(){
      script = fs.readFileSync(path + 'dropSP2.sql',options);
      db.execute(script);
    })
    .then(function(){
      script = fs.readFileSync(path + 'createSP2.sql',options);
      db.execute(script);
    })
    .then(function(){
      script = fs.readFileSync(path + 'dropSP3.sql',options);
      db.execute(script);
    })
    .then(function(){
      script = fs.readFileSync(path + 'createSP3.sql',options);
      db.execute(script);
      done();
    });
});

after(function(done) {
  script = fs.readFileSync(path + 'dropSP1.sql',options);
  db.execute(script)
    .then(function(){
      script = fs.readFileSync(path + 'dropSP2.sql',options);
      db.execute(driver.dropSP2);
    })
    .then(function(){
      script = fs.readFileSync(path + 'dropSP3.sql',options);
      db.execute(driver.dropSP3);
        done();
    });
});


describe('Happy Stored Procedure', function() {

  it('should return record set', function(done) {
      db.procedure.execute('SP_TEST1')
        .then(function(recordSet){
          should.exist(recordSet);
          done();
        });
  });  

  it('should return record for the given id', function(done) {
      db.procedure.input('id', 'Int', 5);
      db.procedure.execute('SP_TEST2')
        .then(function(recordSet){
          recordSet[0].name.should.equal('test5');
          done();
        });
  });  

  it('should return output for the given id', function(done) {
      db.procedure.input('id', 'Int', 7);
      db.procedure.output('result', 'NVarChar');
      db.procedure.execute('SP_TEST3')
        .then(function(recordSet){
          recordSet.returnValue.should.equal(0);
          done();
        });
  });    
});



describe('Unhappy Stored Procedure', function() {

  it('should throw error if not a valid stored procedure', function(done) {
      db.procedure.execute('SP_TEST')
        .catch(function(err){
            err.message.should.match(/Could not find stored procedure/);
            done();
        });
  });  

  it('should throw error if not a valid input parameter', function(done) {
      db.procedure.input('invalid', 'Int', 5);
      db.procedure.execute('SP_TEST2')
        .catch(function(err){
            err.message.should.match(/expects parameter '@id', which was not supplied./);
            done();
        });
  });  

  it('should throw error if not a valid data type in input parameter', function() {
      (function(){
	db.procedure.input('id', 'IntV', 5);
	db.procedure.execute('SP_TEST2');
      }).should.throw(/IntV is not a valid data type/);
  });     

  it('should throw error if less number of parameter passed', function(done) {
      db.procedure.input('id', 'Int', 5);
      db.procedure.execute('SP_TEST3')
        .catch(function(err){
            err.message.should.match(/expects parameter '@result', which was not supplied./);
            done();
        });
  });      

  it('should throw error if more number of parameter passed', function(done) {
      db.procedure.input('id1', 'Int', 5);
      db.procedure.input('id2', 'Int', 5);
      db.procedure.execute('SP_TEST2')
        .catch(function(err){
            err.message.should.match(/SP_TEST2 has too many arguments specified/);
            done();
        });
  });    

});
