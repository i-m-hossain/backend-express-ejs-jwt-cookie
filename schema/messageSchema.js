import mongoose from "mongoose";

export const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: String,
});
