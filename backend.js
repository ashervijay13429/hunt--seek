const express = require('express');
const path = require('path');
const app = express();
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');

const port = 3005;

// MySQL database configuration
const database = mysql.createConnection({
    host: "localhost",
    user: "Wikipedia",
    password: "AATCserver123",
    database: "wikipedia"
});

// Connect to the database
database.connect((error) => {
    if (error) {
        return console.error("Database connection error:", error);
    }
    console.log("Database connected successfully");
});

// Use multer to handle file uploads and store them temporarily
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this to handle JSON requests

// Add CORS middleware if needed (for development)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// POST /login - handles form submission and file upload
app.post('/login', upload.single('photo'), (req, res) => {
    try {
        const photo = req.file;
        if (!photo) {
            return res.status(400).send("No photo uploaded");
        }

        const photoPath = photo.path;

        const { name, DOB, description, number, email, tag_name, cla } = req.body;
        const mime_type = photo.mimetype;
        const photoData = fs.readFileSync(photoPath);

        const sql = `INSERT INTO rose(name, DOB, description, number, email, tag_name, cla, photo, mime_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [name, DOB, description, number, email, tag_name, cla, photoData, mime_type];

        database.query(sql, values, (err, results) => {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).send("Registration unsuccessful");
            }
            console.log('Insert successful:', results);
            res.send("Registration successful");
        });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).send("Request failed");
    }
});

// GET / - serve home page
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'home.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Failed to send home.html:", err);
            res.status(500).send("Could not load home page");
        }
    });
});

// New endpoint for autocomplete suggestions
app.get('/autocomplete', (req, res) => {
    const { term } = req.query;
    if (!term) {
        return res.json([]);
    }

    const SQL_QUERY = "SELECT name FROM rose WHERE name LIKE ? LIMIT 10";
    database.query(SQL_QUERY, [`%${term}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.json([]);
        }
        res.json(results.map(item => item.name));
    });
});

app.get('/pass', (req, res) => {
    const filePath = path.join(__dirname, 'pass.html');
    res.sendFile(filePath);
});

// GET /login - serve login page
app.get('/login', (req, res) => {
    const { password } = req.query;
    if (password !== "AATCserver123") {
        return res.status(403).send("Access denied");
    }
    const filePath = path.join(__dirname, 'login.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Failed to send login.html:", err);
            res.status(500).send("Could not load login page");
        }
    });
});

app.get('/about', (req, res) => {
    const filePath = path.join(__dirname, 'about.html');
    res.sendFile(filePath);
});

app.get('/contact', (req, res) => {
    const filePath = path.join(__dirname, 'contact.html');
    res.sendFile(filePath);
});

// GET /search - search for user by name (now supports partial matches)
app.get('/search', (req, res) => {
    const { name } = req.query;
    console.log("Searching for:", name);

    const SQL_QUERY = "SELECT * FROM rose WHERE name LIKE ?";
    database.query(SQL_QUERY, [`%${name}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.send("Error occurred while searching.");
        }

        if (results.length === 0) {
            return res.send("<h3>No users found</h3>");
        }

        if (results.length === 1) {
            // If only one result, show the full profile
            const user = results[0];
            return res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${user.name}</title>
                
                </head>
                <style>
                        html, body {
                            background-color: lightblue;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            height: 100%;
                        }

                        header {
                            background-color: #007acc;
                            color: white;
                            padding: 1em;
                            text-align: center;
                            font-family: Georgia, serif;
                        }

                        main {
                            padding: 2em;
                            min-height: 80vh;
                            position: relative;
                        }

                        .profile-container {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: space-between;
                            max-width: 1200px;
                            margin: 0 auto;
                        }

                        .profile-image {
                            flex: 0 0 300px;
                            text-align: center;
                            margin-bottom: 20px;
                        }

                        .profile-image img {
                            width: 100%;
                            max-width: 300px;
                            height: auto;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }

                        .profile-info {
                            flex: 0 0 calc(100% - 320px);
                        }

                        .profile-table {
                            width: 100%;
                            border-collapse: collapse;
                            background-color: white;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            margin-bottom: 30px;
                        }

                        .profile-table td {
                            padding: 12px 15px;
                            border: 1px solid #ddd;
                        }

                        .profile-table td:first-child {
                            font-weight: bold;
                            width: 30%;
                            background-color: #f5f5f5;
                        }

                        .profile-description {
                            background-color: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            line-height: 1.6;
                        }

                        /* Responsive Styles */
                        @media (max-width: 360px) {
                            header {
                                padding: 0.5em;
                            }
                            header h1 {
                                font-size: 20px;
                            }
                            .profile-table td {
                                padding: 6px 8px;
                                font-size: 12px;
                            }
                        }
                    </style>
                <body>
                    <header>
                        <h1>${user.name}</h1>
                    </header>

                    <main>
                        <div class="profile-container">
                            <div class="profile-image">
                                <img src="/image?name=${encodeURIComponent(user.name)}" alt="photo of ${user.name}">
                            </div>
                            
                            <div class="profile-info">
                                <table class="profile-table" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td>Name:</td>
                                        <td>${user.name}</td>
                                    </tr>
                                    <tr>
                                        <td>Class:</td>
                                        <td>${user.cla}</td>
                                    </tr>
                                    <tr>
                                        <td>DOB:</td>
                                        <td>${user.DOB}</td>
                                    </tr>
                                    <tr>
                                        <td>Tag name:</td>
                                        <td>${user.tag_name}</td>
                                    </tr>
                                    <tr>
                                        <td>Phone:</td>
                                        <td>${user.number}</td>
                                    </tr>
                                    <tr>
                                        <td>E-mail:</td>
                                        <td>${user.email}</td>
                                    </tr> 
                                </table>
                                
                                <div class="profile-description">
                                    ${user.description.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                    </main>
                </body>
                </html>

        `);
        };

        html += `</body></html>`;
        res.send(html);
    });
});

// GET /image - retrieve user image by name
app.get('/image', (req, res) => {
    const name = req.query.name;

    const SQL = "SELECT photo, mime_type FROM rose WHERE name = ?";
    database.query(SQL, [name], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send("Image not found");
        }

        const image = results[0];
        res.setHeader("Content-Type", image.mime_type);
        res.send(image.photo);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});