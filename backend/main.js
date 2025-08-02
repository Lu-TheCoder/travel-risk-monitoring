const express = require("express")
const cors = require("cors")
const authRouter = require("./src/routes/authRoutes.js")
const vehicleRouter = require("./src/routes/vehicle.route.js");
const riskRouter = require("./src/routes/risk.route.js")
const weatherRouter = require("./src/routes/weatherRoutes.js");
const app = express();
const port = 3000;

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/risks", riskRouter)
app.use("/api/weather", weatherRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
