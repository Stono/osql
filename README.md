# osql  

A simple object based interface to SQL data sources.  Maybe this will evolve into an ORM in the future, but probably not as there are some great ORMs for none-mssql databases available already, and I'm not going to be doing enough with mssql to justify creating one.

The other nice thing this exposes is a wrapper for [restify](https://www.npmjs.com/package/restify), to enable you to create REST routes for your given tables.

This project is simply designed to make interaction with SQL database tables a little simpler, in a nice `when` promise based library.

Currently supported drivers are:
 - sqlite3
 - mssql

The language syntax used in the "many" statements below, that is used to generate the sql required is [https://github.com/hiddentao/squel](https://github.com/hiddentao/squel).

## Getting Started
Install the module with: `npm install osql` and then one of the following drivers:
 - `npm install sqlite3`
 - `npm install mssql`

```javascript
var osql = require('osql');
var db = new osql.Database('sqlite3', ':memory:');
```
 _or_
```javascript
var osql = require('osql');
var db = new osql.Database('mssql', {
  user: 'example_user',
  password: 'example_user_password',
  server: '127.0.0.1',
  database: 'example_database'
});
```

## Examples
Once you've got you db object and driver, define a table and start manipulating it:
```javascript
var table = new osql.Table({
  table: 'example_table',
  identity: 'id',  // Optional
  database: db
});
```
### Inserting a Single Row, presuming the identity is auto generated
```javascript
table.insert({
  column1: 'value'
}).then(function(model) {
  // model.id will be set to the inserted identity
});
```
### Inserting a Single Row where you set the identity
```javascript
table.insert({
  id: id,
  column1: 'value'
}).then(function(model) {
  // done
});
```
### Inserting a bunch of records, with a single insert statement
```javascript 
table.insert([
  { column1: 'val1'},
  { column1: 'val2'}
]).then(function() {
  // done
});
```
### Selecting a single row from the table
```javascript
table.select(rowId)
.then(function(model) {
  // done
});
```
### Selecting mutliple rows from the table using squel syntax
```javascript
table.selectMany()
.where('id > ?', 0)
.execute()
.then(function(models) {
  // done
});
```
### Updating a single row from the table
```javascript
table.update(rowId, {
  column1: 'updated value'
})
.then(function(model) {
  // done
});
```
### Updating mutliple rows from the table using squel syntax
```javascript
table.updateMany({
  column1: 'updated value'
})
.where('id > ?', 0)
.execute()
.then(function() {
  // done
});
```
### Deleting a single row from the table
```javascript
table.delete(rowId)
.then(function() {
  // done
});
```
### Deleting mutliple rows from the table using squel syntax
```javascript
table.deleteMany()
.where('id > ?', 0)
.execute()
.then(function() {
  // done
});
```

## REST
To make life even easier, you can wrap a restify server with a table object, which will in turn expose the rest routes.  

NOTE: This is NOT a complete solution, i've done a quick pragmatic implementation to enable an on going project.
```
// Create your restify server
var server = require('restify').createServer({
  name: 'osql-rest',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// Define your table
var table = new osql.Table({
  table: 'example_table',
  identity: 'id',
  database: db
});

// Wrap the server
table.wrap('/api', server);

// Profit
server.listen(port, done);
```
From there, you will get a bunch of URLs exposed on the server:
```
POST /example_table
GET /example_table
GET /example_table/id
PUT /example_table/id
DELETE /example_table/id
```
Have a look in test/rest.test.js to see how to query it using Restler

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
 - 0.1.0 Initial release
 - 0.1.1-2 Bug fixes
 - 0.1.3 Encapsulation bug fix, inserting of an object returns new instance of object with id
 - 0.1.4 Bug fix
 - 0.1.5 underlying db is now exposed via the dal
 - 0.1.6 Will now escape single quotes by default
 - 0.1.7 Concurrency fix for insert + get ID statements
 - 0.1.8 Dependency Updates
 - 0.1.9 Fixed concurrency issues on INSERT + get ID
 - 0.2.0 Fixed concurrency issues on MSSQL driver, as well as fixing an issue around IDENTITY_INSERT
 - 0.2.1 Updated MSSQL to 1.2.1
 - 0.2.2 table.options.identity is no longer a required paramter as tables dont always have identities
 - 0.2.4 Version Bump
 - 0.2.5 Changed a console warn to a log, so as not to break jenkins pipelines
 - 0.2.6 REST wrapping for Restify

## License
Copyright (c) 2014 Karl Stoney  
Licensed under the MIT license.
