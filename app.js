const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'ca2_c237_project'
    host: 'sql.freedb.tech',
    user: 'freedb_23024075',
    password: 'V2Y@YumeWFjW%8f',
    database: 'freedb_CASyauqii'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    connection.query('SELECT * FROM foodcourts', (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Foodcourts');
        }
        res.render('index', { foodcourts: results });
    });
});

app.get('/foodcourt/:id', (req, res) => {
    const foodcourtId = req.params.id;
    const sqlFoodcourt = 'SELECT * FROM foodcourts WHERE foodcourtID = ?';
    const sqlStalls = 'SELECT * FROM stalls WHERE foodcourtID = ?';

    connection.query(sqlFoodcourt, [foodcourtId], (error, foodcourtResults) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Foodcourt by ID');
        }
        if (foodcourtResults.length > 0) {
            connection.query(sqlStalls, [foodcourtId], (error, stallResults) => {
                if (error) {
                    console.error('Database query error:', error.message);
                    return res.status(500).send('Error Retrieving Stalls');
                }
                res.render('foodcourt', { foodcourt: foodcourtResults[0], stalls: stallResults });
            });
        } else {
            res.status(404).send('Foodcourt Not Found');
        }
    });
});

app.get('/stall/:id', (req, res) => {
    const stallId = req.params.id;
    const sqlStall = 'SELECT * FROM stalls WHERE stallID = ?';
    const sqlFoods = 'SELECT * FROM foods WHERE stallID = ?';

    connection.query(sqlStall, [stallId], (error, stallResults) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Stall');
        }
        if (stallResults.length > 0) {
            connection.query(sqlFoods, [stallId], (error, foodResults) => {
                if (error) {
                    console.error('Database query error:', error.message);
                    return res.status(500).send('Error Retrieving Foods');
                }
                res.render('stall', { stall: stallResults[0], foods: foodResults });
            });
        } else {
            res.status(404).send('Stall Not Found');
        }
    });
});

app.get('/manageStalls', (req, res) => {
    const sql = `
        SELECT stalls.stallID, stalls.name as stallName, stalls.image, foodcourts.name as foodcourtName
        FROM stalls
        JOIN foodcourts ON stalls.foodcourtID = foodcourts.foodcourtID
    `;
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching stalls:', error);
            res.status(500).send('Error Fetching Stalls');
        } else {
            res.render('manageStalls', { stalls: results });
        }
    });
});


app.get('/addStall', (req, res) => {
    const sql = 'SELECT foodcourtID, name FROM foodcourts';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching foodcourts:', error);
            res.status(500).send('Error fetching foodcourts');
        } else {
            res.render('addStall', { foodcourts: results });
        }
    });
});

app.post('/addStall', upload.single('image'), (req, res) => {
    const { sName, foodcourtID } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }
    const sql = 'INSERT INTO stalls (name, foodcourtID, image) VALUES (?, ?, ?)';
    connection.query(sql, [sName, foodcourtID, image], (error, results) => {
        if (error) {
            console.error('Error adding stall:', error);
            res.status(500).send('Error Adding Stall');
        } else {
            console.log('Stall added successfully');
            res.redirect('/manageStalls');
        }
    });
});

app.get('/editStall/:stallID', (req, res) => {
    const stallID = req.params.stallID;
    const getStallSql = 'SELECT * FROM stalls WHERE stallID = ?';
    const getFoodsSql = 'SELECT * FROM foods WHERE stallID = ?';
    const getFoodcourtsSql = 'SELECT * FROM foodcourts';

    connection.query(getStallSql, [stallID], (error, stallResults) => {
        if (error) {
            console.error('Error fetching stall:', error);
            return res.status(500).send('Error fetching stall');
        }

        if (stallResults.length === 0) {
            console.error('Stall not found');
            return res.status(404).send('Stall not found');
        }

        connection.query(getFoodsSql, [stallID], (error, foodResults) => {
            if (error) {
                console.error('Error fetching foods:', error);
                return res.status(500).send('Error fetching foods');
            }

            connection.query(getFoodcourtsSql, (error, foodcourtResults) => {
                if (error) {
                    console.error('Error fetching foodcourts:', error);
                    return res.status(500).send('Error fetching foodcourts');
                }

                res.render('editStall', { 
                    stall: stallResults[0], 
                    foods: foodResults,
                    foodcourts: foodcourtResults
                });
            });
        });
    });
});


app.post('/editStall/:stallID', upload.single('newImage'), (req, res) => {
    const stallID = req.params.stallID;
    const { stallName, foodcourtID, currentImage } = req.body;
    let image = currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const updateStallSql = 'UPDATE stalls SET name = ?, foodcourtID = ?, image = ? WHERE stallID = ?';
    connection.query(updateStallSql, [stallName, foodcourtID, image, stallID], (error, results) => {
        if (error) {
            console.error('Error updating stall:', error);
            return res.status(500).send('Error updating stall');
        }
        res.redirect('/manageStalls');
    });
});



app.get('/addFood/:stallID', (req, res) => {
    const stallID = req.params.stallID;
    res.render('addFood', { stallID });
});

app.post('/addFood', (req, res) => {
    const { stallID, foodName, foodPrice } = req.body;
    const insertFoodSql = 'INSERT INTO foods (name, price, stallID) VALUES (?, ?, ?)';
    connection.query(insertFoodSql, [foodName, foodPrice, stallID], (error, results) => {
        if (error) {
            console.error('Error adding food:', error);
            res.status(500).send('Error adding food');
        } else {
            console.log('Food added successfully');
            res.redirect('/editStall/' + stallID);
        }
    });
});

app.get('/deleteFood/:foodID/:stallID', (req, res) => {
    const { foodID, stallID } = req.params;
    const sql = 'DELETE FROM foods WHERE foodID = ?';
    connection.query(sql, [foodID], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Deleting Food');
        }
        res.redirect('/editStall/' + stallID);
    });
});

app.get('/deleteStall/:stallID', (req, res) => {
    const stallID = req.params.stallID;
    const deleteFoodsSql = 'DELETE FROM foods WHERE stallID = ?';
    const deleteStallSql = 'DELETE FROM stalls WHERE stallID = ?';

    connection.query(deleteFoodsSql, [stallID], (error, results) => {
        if (error) {
            console.error('Error deleting foods:', error);
            return res.status(500).send('Error deleting foods');
        }
        
        connection.query(deleteStallSql, [stallID], (error, results) => {
            if (error) {
                console.error('Error deleting stall:', error);
                return res.status(500).send('Error deleting stall');
            }
            res.redirect('/manageStalls');
        });
    });
});

app.get('/manageFoodcourts', (req, res) => {
    const sql = 'SELECT * FROM foodcourts';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching food courts:', error);
            res.status(500).send('Error Fetching Food Courts');
        } else {
            res.render('manageFoodcourts', { foodcourts: results });
        }
    });
});

app.get('/editFoodcourt/:id', (req, res) => {
    const foodcourtID = req.params.id;
    const sql = 'SELECT * FROM foodcourts WHERE foodcourtID = ?';
    
    connection.query(sql, [foodcourtID], (error, results) => {
        if (error) {
            console.error('Error fetching food court:', error);
            res.status(500).send('Error Fetching Food Court');
        } else {
            res.render('editFoodcourt', { foodcourt: results[0] });
        }
    });
});


app.post('/editFoodcourt/:id', upload.single('newImage'), (req, res) => {
    const foodcourtID = req.params.id;
    const { foodcourtName, location, currentImage } = req.body;
    let image = currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = 'UPDATE foodcourts SET name = ?, location = ?, image = ? WHERE foodcourtID = ?';
    connection.query(sql, [foodcourtName, location, image, foodcourtID], (error, results) => {
        if (error) {
            console.error('Error updating food court:', error);
            return res.status(500).send('Error Updating Food Court');
        } else {
            console.log('Food court updated successfully');
            res.redirect('/manageFoodcourts');
        }
    });
});


app.get('/addFoodcourt', (req, res) => {
    res.render('addFoodcourt');
});

app.post('/addFoodcourt', upload.single('image'), (req, res) => {
    const { name, location } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }
    const sql = 'INSERT INTO foodcourts (name, location, image) VALUES (?, ?, ?)';
    connection.query(sql, [name, location, image], (error, results) => {
        if (error) {
            console.error('Error adding foodcourt:', error);
            res.status(500).send('Error Adding Foodcourt');
        } else {
            console.log('Foodcourt added successfully');
            res.redirect('/manageFoodcourts');
        }
    });
});

app.get('/deleteFoodcourt/:id', (req, res) => {
    const foodcourtID = req.params.id;
    const deleteFoodsSql = 'DELETE f FROM foods f JOIN stalls s ON f.stallID = s.stallID WHERE s.foodcourtID = ?';
    const deleteStallsSql = 'DELETE FROM stalls WHERE foodcourtID = ?';
    const deleteFoodcourtSql = 'DELETE FROM foodcourts WHERE foodcourtID = ?';

    connection.query(deleteFoodsSql, [foodcourtID], (error, foodResults) => {
        if (error) {
            console.error('Error deleting foods:', error);
            return res.status(500).send('Error deleting foods');
        }

        connection.query(deleteStallsSql, [foodcourtID], (error, stallResults) => {
            if (error) {
                console.error('Error deleting stalls:', error);
                return res.status(500).send('Error deleting stalls');
            }

            connection.query(deleteFoodcourtSql, [foodcourtID], (error, results) => {
                if (error) {
                    console.error('Error deleting foodcourt:', error);
                    return res.status(500).send('Error deleting foodcourt');
                }

                console.log('Foodcourt deleted successfully');
                res.redirect('/manageFoodcourts');
            });
        });
    });
});


app.get('/editFood/:id', (req, res) => {
    const foodID = req.params.id;

    const sql = 'SELECT * FROM foods WHERE foodID = ?';

    connection.query(sql, [foodID], (error, results) => {
        if (error) {
            console.error('Error fetching food details:', error);
            res.status(500).send('Error fetching food details');
        } else if (results.length > 0) {
            const food = results[0];
            res.render('editFood', { food });
        } else {
            res.status(404).send('Food not found');
        }
    });
});



app.post('/editFood/:id', (req, res) => {
    const foodID = req.params.id; 
    const { foodName, price, availability, stallID } = req.body; 

    const sql = 'UPDATE foods SET name = ?, price = ?, availability = ? WHERE foodID = ?';

    connection.query(sql, [foodName, price, availability, foodID], (error, results) => {
        if (error) {
            console.error('Error updating food:', error);
            res.status(500).send('Error updating food');
        } else {
            console.log('Food updated successfully');
            res.redirect('/editStall/' + stallID); 
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));