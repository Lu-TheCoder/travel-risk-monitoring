const {Router} = require('express');
const { serverError } = require('../utils/http.util');
const { getErrorMessage } = require('../utils/error.util');
const { authenticateToken } = require('../middleware/auth.middleware');

const IncidentRouter = Router();

IncidentRouter.get('/', authenticateToken ,async (req, res)=>{
    try {
        const results = await getAllIncidents();
        ok(res, results);
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
})
IncidentRouter.get('/:id',authenticateToken, async (req, res)=>{
    try {
        const IncidentId = req.params.id;

        const Incident = await getIncidentById(IncidentId);

        ok(res, Incident);
        
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }













    
})
IncidentRouter.post('/',authenticateToken, async (req, res)=>{
    try {
        // const {}
        
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
})
IncidentRouter.put('/:id',authenticateToken, async (req, res)=>{
    try {
        const IncidentId = req.params.id;
        
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
})
IncidentRouter.delete('/:id', authenticateToken, async (req, res)=>{
    try {
        const incidentId = req.params.id;
    } catch (error) {
        serverError(res, getErrorMessage(error));
    }
});