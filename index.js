const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { swaggerSpecs, swaggerUI } = require('./swagger');
const apiRouter = require('./routes/api');

const app = express();

// express version 4.16.0+ has built-in JSON parsing capabilities
// using below statement for json body parser
app.use(express.json());
app.use(cors({
  credentials: true,
  origin: true
}))
app.use(cookieParser());
app.use('/api/v1', apiRouter);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

const port = 8888;
app.listen(port, () => {
  console.log("Server listening on port:" + port);
});

