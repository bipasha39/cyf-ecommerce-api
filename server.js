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

//For "Get" Request

app.get("/customers", function (req, res) {
    pool.query("SELECT * FROM customers;", (error, result) => {
      res.json(result.rows);
    });
  });
  ​
  app.get("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
  ​
    pool
      .query("SELECT * FROM customers WHERE id=$1;", [customerId])
      .then((result) => res.json(result.rows))
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });
  
  app.get("/customers/:customerId/orders", function (req, res) {
    const customerId = req.params.customerId;
  ​
    pool
      .query(
        `
          SELECT o.order_reference, o.order_date, p.product_name, p.unit_price, s.supplier_name, oi.quantity
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          JOIN suppliers s ON s.id = p.supplier_id
          WHERE customer_id=$1;
      `,
        [customerId]
      )
      .then((result) => res.json(result.rows))
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });

  app.get("/products", function (req, res) {
    const productNameQuery = req.query.name;
  ​
    let query = `
      SELECT p.product_name, s.supplier_name
      FROM products p
      JOIN suppliers s
          ON p.supplier_id = s.id;
    `;
  ​
    if (productNameQuery) {
      query = `
          SELECT p.product_name, s.supplier_name
          FROM products p
          JOIN suppliers s
              ON p.supplier_id = s.id
          WHERE p.product_name LIKE '%${productNameQuery}%';
      `;
    }
  ​
    pool.query(query, (error, result) => res.json(result.rows));
  });


  app.get("/suppliers", function (req, res) {
    pool.query("SELECT * FROM suppliers;", (error, result) =>
      res.json(result.rows)
    );
  });


//Post ​part
  app.post("/customers", function (req, res) {
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;
  ​
    if (!name || !address || !city || !country) {
      return res
        .status(400)
        .send("Please provide a name, address, city and country.");
    }
  ​
    pool
      .query(
        `
          INSERT INTO customers (name, address, city, country)
          VALUES ($1, $2, $3, $4);
          `,
        [name, address, city, country]
      )
      .then(() => res.send("Customer inserted!"))
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });

  app.post("/customers/:customerId/orders", function (req, res) {
    const customerId = req.params.customerId;
    const date = req.body.date;
    const reference = req.body.reference;
  ​
    pool
      .query("SELECT * FROM customers WHERE id=$1;", [customerId])
      .then((result) => {
        if (result.rows.length === 0) {
          return res.status(400).send("Customer does not exist");
        }
  ​
        if (!date || !reference) {
          return res
            .status(400)
            .send("Please provide an order date and reference");
        }
  ​
        pool
          .query(
            "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3);",
            [date, reference, customerId]
          )
          .then(() => res.send("Order created!"))
          .catch((err) => {
            console.error(err.stack);
            res.status(500).send("Internal Server Error");
          });
      })
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });

  app.post("/products", function (req, res) {
    const name = req.body.name;
    let price = req.body.price;
    const supplierId = req.body.supplierId;
  ​
    if (!name || !price || !supplierId) {
      return res
        .status(400)
        .send("Please provide a product name, price and supplier Id");
    }
  ​
    if (price <= 0) {
      return res.status(400).send("Price needs to be a positive integer");
    }
  ​
    pool
      .query("SELECT * FROM suppliers WHERE id=$1;", [supplierId])
      .then((result) => {
        if (result.rows.length === 0) {
          return res.status(400).send("Supplier does not exist");
        }
  ​
        pool
          .query(
            "INSERT INTO products (product_name, price, supplier_id) VALUES ($1, $2, $3);",
            [name, price, supplierId]
          )
          .then(() => res.send("Product created!"))
          .catch((err) => {
            console.error(err.stack);
            res.status(500).send("Internal Server Error");
          });
      })
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });
//Put Part  ​
  app.put("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;
  ​
    if (!name || !address || !city || !country) {
      return res
        .status(400)
        .send("Please provide a name, address, city and country.");
    }
  ​
    pool
      .query(
        "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
        [name, address, city, country, customerId]
      )
      .then(() => res.send(`Customer ${customerId} updated!`))
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });
  ​
  //Delete Part

  app.delete("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
  ​
    pool
      .query("SELECT * FROM orders WHERE customer_id=$1;", [customerId])
      .then((result) => {
        if (result.rows.length > 0) {
          return res.status(400).send("This customer has existing orders");
        }
  ​
        pool
          .query("DELETE FROM customers WHERE id=$1;", [customerId])
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((err) => {
            console.error(err.stack);
            res.status(500).send("Internal Server Error");
          });
      })
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });
  ​
  
  ​
  
  ​
  app.delete("/orders/:orderId", function (req, res) {
    const orderId = req.params.orderId;
  ​
    pool
      .query("DELETE FROM order_items WHERE order_id=$1;", [orderId])
      .then(() => {
        pool
          .query("DELETE FROM orders WHERE id=$1;", [orderId])
          .then(() => res.send(`Order ${orderId} deleted!`))
          .catch((err) => {
            console.error(err.stack);
            res.status(500).send("Internal Server Error");
          });
      })
      .catch((err) => {
        console.error(err.stack);
        res.status(500).send("Internal Server Error");
      });
  });

  
  ​
 
  ​
  app.listen(3000, function () {
    console.log("Server is listening on port 3000. Ready to accept requests!");
  });
  
  
  
  