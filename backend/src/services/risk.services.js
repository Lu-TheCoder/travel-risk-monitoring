const DB = require("../../db/db")

const getRiskByUser = async (user_id) => {
    const db = DB.getInstance();

    const results = await db.query(
        `SELECT * FROM risk
         WHERE user_id=$1`,
        [user_id]
    )

    return results.rows;
}

const createRisk = async (user_id, risk_level) => {
    const db = DB.getInstance()

    const results = await db.query(
        `INSERT INTO risk (risk_level, user_id)
         VALUES ($1, $2) RETURNING *`,
        [risk_level, user_id]
    );

    return results.rows[0]
}

module.exports = {
    getRiskByUser,
    createRisk,
}
