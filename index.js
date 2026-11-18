const express = require('express'); 
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000; // Diperbaiki dari 'port' menjadi 'PORT' agar tidak error

app.use(express.json());
app.use(express.static("public"));

app.get('/', (req, res) => {
    res.redirect("/index.html");
});

