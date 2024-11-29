const express = require("express");
const path = require("path");
//const helmet = require("helmet"); // For security headers
//const morgan = require("morgan"); // For logging
const cors = require("cors"); // For CORS support

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
//app.use(helmet()); // Set security headers
//app.use(morgan('combined')); // Log requests
 app.use(cors()); // Enable CORS
app.use('/static', express.static(path.join(__dirname, 'static'))); // Serve static files

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for other routes (for SPAs or client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend server is running at http://localhost:${PORT}`);
});