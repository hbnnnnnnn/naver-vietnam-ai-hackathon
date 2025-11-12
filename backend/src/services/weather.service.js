import { fetchWeatherApi } from "openmeteo";

class WeatherService {
    constructor() {
        this.baseUrl = "https://api.open-meteo.com/v1/forecast";
    }

    async getUVIndex(latitude, longitude) {
        const params = {
            latitude: latitude,
            longitude: longitude,
            hourly: "uv_index",
            timezone: "auto",
            forecast_days: 1
        };

        const responses = await fetchWeatherApi(this.baseUrl, params);
        const response = responses[0];

        return this._parseUVIndexResponse(response);
    }

    _parseUVIndexResponse(response) {
        const hourly = typeof response.hourly === 'function' ? response.hourly() : response.hourly;

        if (!hourly) {
            throw new Error('Hourly data missing from weather response');
        }

        const utcOffsetSeconds = typeof response.utcOffsetSeconds === 'function'
            ? response.utcOffsetSeconds()
            : response.utcOffsetSeconds;

        const uvVar = typeof hourly.variables === 'function'
            ? hourly.variables(0)
            : (hourly.variables && hourly.variables[0]);

        let uvIndexValues = [];
        if (uvVar && typeof uvVar.valuesArray === 'function') {
            uvIndexValues = uvVar.valuesArray();
        } else if (uvVar && Array.isArray(uvVar.valuesArray)) {
            uvIndexValues = uvVar.valuesArray;
        }

        const startTime = typeof hourly.time === 'function' ? hourly.time() : hourly.time;
        const endTime = typeof hourly.timeEnd === 'function' ? hourly.timeEnd() : hourly.timeEnd;
        const interval = typeof hourly.interval === 'function' ? hourly.interval() : hourly.interval;
        const utcOffset = utcOffsetSeconds || 0;

        const length = interval
            ? Math.max(0, (Number(endTime) - Number(startTime)) / interval)
            : uvIndexValues.length;

        return {
            hourly: {
                time: Array.from(
                    { length: length },
                    (_, i) => new Date((Number(startTime) + i * interval + utcOffset) * 1000)
                ),
                uv_index: uvIndexValues,
            },
        };
    }
}

export default new WeatherService();
