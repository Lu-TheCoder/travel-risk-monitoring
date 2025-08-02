const express = require('express');
const axios = require('axios');
const router = express.Router();

// Weather API proxy route
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY || 'e7deb1aa6862dd69ccbac48f300fe4f0';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    console.log('Fetching weather data for:', lat, lon);
    
    const response = await axios.get(url);
    
    console.log('Weather data received:', response.data.name);
    
    res.json(response.data);
  } catch (error) {
    console.error('Weather API error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({
        error: 'Weather API error',
        message: error.response.data.message || error.message
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'Weather service unavailable',
        message: 'Unable to reach weather service'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

module.exports = router; 