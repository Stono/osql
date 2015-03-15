'use strict';
var drivers = [];
drivers.push({
  name: 'sqlite3', 
  opts: ':memory:',
  createTable: 'CREATE TABLE example_table (id INTEGER PRIMARY KEY ASC, column1 TEXT)',
  dropTable: 'DROP TABLE IF EXISTS example_table'
});
drivers.push({
  name: 'mssql', 
  opts: {
    user: 'example_user',
    password: 'example_user_password',
    server: '172.19.104.11',
    database: 'example_database'
  },
  createTable: 'CREATE TABLE example_table (id int not null identity(1, 1) primary key, column1 TEXT)', 
  dropTable: 'IF OBJECT_ID(\'example_table\', \'U\') IS NOT NULL DROP TABLE example_table'
});        

module.exports = drivers;
