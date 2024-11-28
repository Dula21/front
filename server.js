const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080; // You can customize the port if needed

// Middleware to serve the 'static' folder
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve the index.html as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle SPA routing (for Vue.js, React, etc., with client-side routing)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Frontend server is running at http://localhost:${PORT}`);
});
