const express = require("express")
const { loginUser, signupUser } = require("../services/auth.service.js");

const authRouter = express.Router();

authRouter.post('/signup', async (req, res) => {
	try {
		const { first_name, last_name, email, password } = await req.body

		const results = await signupUser({ first_name, last_name, email, password })

		res.status(201).json({ results })
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Could not create user' })

	}
})


authRouter.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body

		const { token } = await loginUser({ email, password })

		res.json({ token })
	} catch (error) {
		console.log(error)
		res.status(400).json({ error: "Invalid email or password" })

	}
})

module.exports = authRouter;
