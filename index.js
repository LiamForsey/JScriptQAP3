const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login", { error: null }); // pass null if no error
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const { email, password } = request.body;

// Find the user by email
    const user = USERS.find(u => u.email === email);

    if (!user) {
        return response.render("login", { error: "Invalid email or password" });
    }

// Compare the password with the hash
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
            return response.render("login", { error: "Something went wrong" });
        }

        if (!isMatch) {
            return response.render("login", { error: "Invalid email or password" });
        }

// Set session and redirect to landing
        request.session.user = user;
        response.redirect("/landing");
    });
});


// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup", { error: null });  // Pass null or {} to prevent the "undefined" error
});


// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { username, email, password } = request.body;

// Check if the user already exists
    const existingUser = USERS.find(user => user.email === email);

    if (existingUser) {
        return response.render("signup", { error: "Email already in use" });
    }

// Hash the password
    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
        if (err) {
            return response.render("signup", { error: "Something went wrong" });
        }

// Create a new user
        const newUser = {
            id: USERS.length + 1,  // Simple way to generate unique IDs
            username: username,
            email: email,
            password: hashedPassword,
            role: "user",  // Default role as 'user'
        };

// Add the new user to the USERS array
        USERS.push(newUser);

// Set the session user and redirect to the landing page
        request.session.user = newUser;
        response.redirect("/landing");
    });
});


// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    const user = request.session.user;
    
// show all the usernames for admin
    if (user.role === "admin") {
        response.render("landing", { user, allUsers: USERS });
    } else {
// display regular users username.
        response.render("landing", { user });
    }
});


// POST /logout - Logs out the user by destroying their session
app.post("/logout", (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            return response.status(500).send("Failed to log out");
        }
        response.redirect("/");
    });
});




// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
