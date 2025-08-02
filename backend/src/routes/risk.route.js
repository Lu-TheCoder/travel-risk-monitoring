const { Router } = require("express")
const { serverError, ok, noContent, notFound, badRequest } = require("../utils/http.util")
const { authenticateToken } = require("../middleware/auth.middleware");
const { getRiskByUser, createRisk } = require("../services/risk.services");
const { getErrorMessage } = require("../utils/error.util");

const RiskRouter = Router()

RiskRouter.get("/", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id
		if (!userId) {
			noContent(res)
			return
		}
		const risks = await getRiskByUser(userId);
		if (!(risks.length > 0)) {
			noContent(res)
			return
		}
		ok(res, risks)
	} catch (error) {
		serverError(res, getErrorMessage(error))
	}
})

RiskRouter.post("/", authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;
		const { risk_level } = req.body
		if (!risk) {
			badRequest(res)
			return
		}

		const risk = await createRisk(userId, risk_level);
	} catch (error) {
		serverError(res, getErrorMessage(error))
	}
})

module.exports = RiskRouter
