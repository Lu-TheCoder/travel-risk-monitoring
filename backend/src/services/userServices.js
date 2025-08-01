const DB = require("../../db/db")
const bcyrpt = require("bcrypt")

let db = DB.getInstance()

async function createUser({ first_name, last_name, email, password }) {

	const hashedpassword = await bcyrpt.hash(password, 10)
	const results = await db.query(
		`INSERT INTO users (first_name, last_name, email, password)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, first_name, last_name, email, password`,
		[first_name, last_name, email, hashedpassword]
	)

	return results
}

async function getUserByEmail(email) {
	const results = await db.query(
		`SELECT id, first_name, last_name, email, password
		 FROM users
		 WHERE email = $1`,
		[email]
	)
	return results.rows[0] || null
}

module.exports = {
	createUser,
	getUserByEmail
}
