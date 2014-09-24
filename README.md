# osql  

A simple object based interface to SQL data sources.  Maybe this will evolve into an ORM in the future, but probably not as there are some great ORMs for none-mssql databases available already, and I'm not going to be doing enough with mssql to justify creating one.

This project is simply designed to make interaction with SQL database tables a little simpler, in a nice `when` promise based library.

Currently supported drivers are:
 - sqlite3
 - mssql

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
  name: 'example_table',
  identity: 'id',
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
### Selecting mutliple rows from the table
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
### Updating mutliple rows from the table
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
### Deleting mutliple rows from the table
```javascript
table.deleteMany()
.where('id > ?', 0)
.execute()
.then(function() {
  // done
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.1.0 Initial release

## License
Copyright (c) 2014 Karl Stoney  
Licensed under the MIT license.
