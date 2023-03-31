import express from "express";
import * as dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
dotenv.config();
import { Message } from "./model/messageModel.js";
import { User } from "./model/userModel.js";

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
const isAuthenticated = (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        next();
    } else {
        res.render("login");
    }
};
// routes

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.create({ email, password });
        res.cookie("token", user._id, {
            httpOnly: true,
            expires: new Date(Date.now() + 60000),
        });
        res.redirect("/");
    } catch (error) {
        console.log(error)
        res.json({message: error._message})
    }
});

app.post("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout");
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
