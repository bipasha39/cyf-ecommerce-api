const express = require("express");
const { Pool } = require('pg');
const app = express();
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecomerece',
    password: 'migracode',
    port: 5432
});
app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers;', (error,result) => {
        console.log(result);
        res.json(result.rows);
    });
});
app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers;', (error, result) => {
        res.json(result.rows);
    });
});
app.get("/products", function(req, res) {
    pool.query(`
        SELECT p.product_name, s.supplier_name
        FROM products p
        JOIN suppliers s
            ON p.supplier_id = s.id;
    `, (error, result) => {
        res.json(result.rows);
    });
});
app.listen(3001, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});
