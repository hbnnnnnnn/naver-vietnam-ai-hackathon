import weatherService from '../services/weather.service.js';

export const getUVIndex = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: 'Latitude and Longitude are required'
            });
        }

        const weatherData = await weatherService.getUVIndex(
            parseFloat(latitude),
            parseFloat(longitude)
        );

        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Error in getUVIndex controller:', error);
        return res.status(500).json({
            message: 'Error fetching UV index',
            error: error.message
        });
    }
}