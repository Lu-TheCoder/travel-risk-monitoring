const DB = require('../../db/db');


const getAllVehicles = async (user_id) =>{
    const db = DB.getInstance();
    const vehicles = await db.query(
        `SELECT * FROM vehicle 
        WHERE user_id ILIKE $1`,
        [user_id]
    );

    return vehicles.rows;
}

const getVehicleById = async (user_id, car_id) => {
    const db = DB.getInstance();

    const vehicle = await db.query(
        `SELECT * FROM vehicle
        WHERE user_id ILIKE $1 AND id ILIKE $2`,
        [user_id, car_id]
    );

    return (vehicle.rows)[0];
}

module.exports = {
    getAllVehicles,
    getVehicleById
}