const express = require('express');
const dotenv = require('dotenv'); 
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { swaggerSpecs, swaggerUI } = require('./swagger');
const apiRouter = require('./routes/api');

// Load environment variables from .env file
dotenv.config();
process.env.TZ = 'Asia/Bangkok';

const app = express();

// express version 4.16.0+ has built-in JSON parsing capabilities
// using below statement for json body parser
app.use(express.json({limit: '30mb'}));
app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api/v1', apiRouter);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

const port = process.env.PORT || 8400;
app.listen(port, () => {
  console.log("Server listening on port:" + port);
});

