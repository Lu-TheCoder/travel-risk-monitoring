const {Router} = require('express');
const { serverError, ok, noContent, notFound } = require('../utils/http.util');
const { getErrorMessage } = require('../utils/error.util');
const { getAllVehicles, getVehicleById } = require('../services/vehicle.services');

const VehicleRouter = Router();

//GET METHODS FOR USER VEHICLES 
VehicleRouter.get('/', async (req, res) =>{
    try {
        const userId = req.user.id;

        const allVehicles = await getAllVehicles(userId);
        if(!(allVehicles.lenght > 0)){
            noContent(res);
            return;
        }

        ok(res, allVehicles);
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
});

VehicleRouter.get('/:id', async(req, res) =>{
    try {
        const userId = req.user.id;
        const carId = req.params.id;

        const vehicle = await getVehicleById(userId, carId);
        if(!(vehicle.lenght > 0)){
            notFound(res);
            return;
        }

        ok(res, vehicle);
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
})

