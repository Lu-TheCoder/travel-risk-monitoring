const DB = require("../../db/db");

const getAllVehicles = async (user_id) => {
  const db = DB.getInstance();
  const vehicles = await db.query(
    `SELECT * FROM vehicle 
        WHERE user_id=$1`,
    [user_id]
  );

  return vehicles.rows;
};

const getVehicleById = async (user_id, vehicle_id) => {
  const db = DB.getInstance();

  const vehicle = await db.query(
    `SELECT * FROM vehicle
        WHERE user_id=$1 AND id=$2`,
    [user_id, vehicle_id]
  );

  return vehicle.rows[0];
};

const insertVehicle = async (brand, model, year, type, userId) => {
  const db = DB.getInstance();
  const results = await db.query(
    `INSERT INTO vehicle (model, year, type, user_id, brand)
        VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
    [model, year, type, userId, brand]
  );

  return results.rows[0];
};

const updateVehicle = async (brand, model, year, type, vehicleId, userId) => {
  const vehicleExits = await getVehicleById(userId, vehicleId);
  console.log(vehicleExits);

  if (!vehicleExits) {
    throw new Error("Vehicle deosn't exist.");
  }

  const db = DB.getInstance();
  const updateVehicle = await db.query(
    `
        UPDATE vehicle 
        SET
        model = $1,
        year = $2,
        type = $3
        
        WHERE id = $4 AND user_id = $5 RETURNING *;`,
    [
      brand || vehicleExits.brand,
      model || vehicleExits.model,
      year || vehicleExits.year,
      type || vehicleExits.type,
      vehicleId,
      userId,
    ]
  );

  return updateVehicle.rows[0];
};

const deleteVehicle = async (vehicleId, userId) => {
  const vehicleExits = await getVehicleById(userId, vehicleId);

  if (!(vehicleExits.lenght > 0)) {
    throw new Error("Vehicle deosn't exist.");
  }

  const db = DB.getInstance();
  const results = await db.query(
    `DELETE FROM vehicles v
        WHERE v.id = $1 AND v.user_id = $2 RETURNING *;`,
    [vehicleId, userId]
  );

  return results.rows[0];
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  insertVehicle,
  updateVehicle,
  deleteVehicle,
};
