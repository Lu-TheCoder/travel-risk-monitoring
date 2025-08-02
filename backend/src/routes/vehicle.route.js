const { Router } = require("express");
const {
  serverError,
  ok,
  noContent,
  notFound,
  badRequest,
} = require("../utils/http.util");
const { getErrorMessage } = require("../utils/error.util");
const {
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  insertVehicle,
} = require("../services/vehicle.services");
const { authenticateToken } = require("../middleware/auth.middleware");
const { validate } = require("uuid");

const VehicleRouter = Router();

//GET METHODS FOR USER VEHICLES
VehicleRouter.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

    if (!userId) {
      console.error("User ID is null or undefined");
      noContent(res);
      return;
    }

    const allVehicles = await getAllVehicles(userId);
    if (!(allVehicles.length > 0)) {
      noContent(res);
      return;
    }

    ok(res, allVehicles);
  } catch (error) {
    serverError(res, getErrorMessage(error));
  }
});

VehicleRouter.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.id;

    if (!validate(vehicleId)) {
      badRequest(res);
      return;
    }

    const vehicle = await getVehicleById(userId, vehicleId);
    if (!vehicle) {
      notFound(res);
      return;
    }

    ok(res, vehicle);
  } catch (error) {
    serverError(res, getErrorMessage(error));
  }
});

VehicleRouter.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { brand, model, year, type } = req.body;

    if (!model || !year || !type) {
      badRequest(res);
      return;
    }

    const vehicle = await insertVehicle(brand, model, year, type, userId);
    ok(res, vehicle);
  } catch (error) {
    serverError(res, getErrorMessage(error));
  }
});

VehicleRouter.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const vehicleId = req.params.id;
    const {brand, model, year, type} = req.body;

    if (!validate(vehicleId)) {
      badRequest(res);
      return;
    }

    const updatedVehicle = await updateVehicle(brand, model, year, type, vehicleId, userId);

    ok(res, updatedVehicle);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Vehicle deosn't exist.") {
        noContent(res);
        return;
      }
    }
    serverError(res, getErrorMessage(error));
  }
});

VehicleRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    if (!validate(vehicleId)) {
      badRequest(res);
      return;
    }

    const userId = req.user.id;

    const deletedVehicle = await deleteVehicle(vehicleId, userId);
    ok(res, deletedVehicle);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Vehicle deosn't exist.") {
        noContent(res);
        return;
      }
    }
    serverError(res, getErrorMessage(error));
  }
});

module.exports = VehicleRouter;
