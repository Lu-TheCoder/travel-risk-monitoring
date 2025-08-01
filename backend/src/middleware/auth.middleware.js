import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return res.sendStatus(401);

	const jwtSecret = "121jhsdt718@r1W!2131"

	jwt.verify(token, jwtSecret, (err, user) => {
		if (err) return res.sendStatus(403);
		req.user = user;
		next();
	});
}

module.exports = { authenticateToken }
