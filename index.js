import express from "express";
import * as dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
dotenv.config();
import { Message } from "./model/messageModel.js";
import { User } from "./model/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const port = process.env.PORT || 3000;

mongoose
    .connect("mongodb://localhost:27017", { dbName: "backend" })
    .then((c) => console.log("db connected"))
    .catch((error) => console.log(error));

// creating app from express
const app = express();
let users = [];
//setting up view engine
app.set("view engine", "ejs");

// using middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById({ _id: decoded._id });
        req.user = user;
        next();
    } else {
        res.redirect("/login");
    }
};
// routes

app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.redirect("/login");
        }
        user = await User.create({ name, email, password: hashedPassword });
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60000),
        });
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.json({ error });
    }
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect("/register");
        }
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched)
            return res.render("login", {
                email,
                message: "Incorrect password",
            });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60000),
        });
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.json({ message: error._message });
    }
});

app.post("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { user: req.user });
});

app.get("/users", (req, res) => {
    res.json({ users: users });
});

app.post("/contact", async (req, res) => {
    const { name, email } = req.body;

    try {
        await Message.create({ name, email });
        res.redirect("/success");
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});
app.get("/success", (req, res) => {
    res.render("success.ejs");
});

// app.get("/", isAuthenticated, (req, res) => {
//     res.render("index.ejs");
// });

app.get("/getHtmlFile", (req, res) => {
    const basePath = path.resolve();
    console.log(basePath);
    res.status(202).sendFile(basePath + "/home.html");
});

app.listen(port, () => {
    console.log("app started at " + port);
});
