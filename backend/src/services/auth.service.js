const bcrypt = require("bcrypt")
const { createUser, getUserByEmail } = require("./userServices.js");
const jwt = require("jsonwebtoken")


async function loginUser({ email, password }) {
	const user = await getUserByEmail(email);
	if (!user) {
		throw new Error('User not found');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Invalid credentials');
	}

	const payload = {
		id: user.id,
		first_name: user.first_name,
		last_name: user.last_name,
		email: user.email,
	};

	const jwtSecret = "121jhsdt718@r1W!2131"

	const token = jwt.sign(payload, jwtSecret, {
		expiresIn: '24h',
	});

	return { token };
}

async function signupUser({ first_name, last_name, email, password }) {
	const existingUser = await getUserByEmail(email)

	if (existingUser !== null) {
		throw new Error("User already exists")
	}

	const results = await createUser({ first_name, last_name, email, password })

	return results
}

module.exports = {
	loginUser,
	signupUser
}
