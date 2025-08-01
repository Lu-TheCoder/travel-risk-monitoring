const express = require("express")
const cors = require("cors")
const authRouter = require("./src/routes/authRoutes.js")
const app = express();
const port = 3000;

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRouter)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
