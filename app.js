const express = require('express');

const app = express();
const mongoose = require('mongoose');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

// middleware
app.use(express.json());
app.use(authJwt());
app.use('/public/uploads', express.static(`${__dirname}/public/uploads`));
app.use(errorHandler);

// Routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

// Database
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'eshop-database',
})
  .then(() => {
    console.log('Database Connection is ready...');
  })
  .catch((err) => {
    console.log(err);
  });

// Server
app.listen(9000, () => {
  console.log('server is running http://localhost:9000');
});
