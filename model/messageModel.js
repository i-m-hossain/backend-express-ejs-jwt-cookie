import mongoose from "mongoose";
import { messageSchema } from "../schema/messageSchema.js";

export const Message = mongoose.model("Message", messageSchema);
