import { generateRoutine } from "../services/routine.service.js";
import Routine from "../models/Routine.js";

async function generateAndSaveRoutines(skinType) {
    const { morning, night } = await generateRoutine(skinType);

    const morningDoc = await Routine.create({
        name: 'morning',
        steps: morning.steps,
        skinType: skinType.toLowerCase(),
        totalPrice: morning.totalPrice
    });

    const nightDoc = await Routine.create({
        name: 'night',
        steps: night.steps,
        skinType: skinType.toLowerCase(),
        totalPrice: night.totalPrice
    });

    return { morningDoc, nightDoc };
}

export const getRoutine = async (req, res) => {
    try {
        const { skinType } = req.query;

        if (!skinType) {
            return res.status(400).json({ message: 'skinType query parameter is required' });
        }

        const normalizedSkinType = skinType.toLowerCase();

        // Check if routines exist for this skin type
        let routines = await Routine.find({ skinType: normalizedSkinType }).populate('steps.product');

        // If no routines exist, generate and save them
        if (routines.length === 0) {
            const { morningDoc, nightDoc } = await generateAndSaveRoutines(normalizedSkinType);

            // Populate product details before returning
            await morningDoc.populate('steps.product');
            await nightDoc.populate('steps.product');

            return res.status(200).json({
                message: 'Routines generated and saved',
                routines: [morningDoc, nightDoc]
            });
        }

        res.status(200).json({ routines });
    } catch (error) {
        console.error('Error in getRoutine:', error);
        res.status(500).json({ message: 'Error retrieving routine', error: error.message });
    }
};


export const createRoutine = async (req, res) => {
    try {
        const { skinType } = req.body;

        if (!skinType) {
            return res.status(400).json({ message: 'skinType is required' });
        }

        const { morningDoc, nightDoc } = await generateAndSaveRoutines(skinType);

        res.status(201).json({
            message: 'Routine generated successfully',
            morning: morningDoc,
            night: nightDoc
        });
    } catch (error) {
        console.error('Error in createRoutine:', error);
        res.status(500).json({ message: 'Error generating routine', error: error.message });
    }
}

export const getRoutineByPriceRangeAndSkinType = async (req, res) => {
    try {
        const { minPrice, maxPrice, skinType } = req.query;
        if (!maxPrice) {
            return res.status(400).json({ message: 'maxPrice query parameter is required' });
        }
        if (!minPrice) {
            return res.status(400).json({ message: 'minPrice query parameter is required' });
        }
        const routines = await Routine.find({ totalPrice: { 
            $gte: parseFloat(minPrice), 
            $lte: parseFloat(maxPrice) }, 
            skinType: skinType.toLowerCase() 
        }).populate('steps.product');
        if (routines.length > 0) {
            return res.status(200).json(routines);
        }

        const { morningDoc, nightDoc } = await generateAndSaveRoutines(skinType);

        const filteredRoutines = [morningDoc, nightDoc].filter(r =>
            r.totalPrice >= parseFloat(minPrice) && r.totalPrice <= parseFloat(maxPrice)
        );

        res.status(200).json(filteredRoutines);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routines', error: error.message });
    }
}

export const getRoutineByPriceAndSkinType = async (req, res) => {
    try {
        const { price, skinType } = req.query;
        if (!price) {
            return res.status(400).json({ message: 'Price query parameter is required' });
        }
        if (!skinType) {
            return res.status(400).json({ message: 'skinType query parameter is required' });
        }

        const routines = await Routine.find({
            totalPrice: { $eq: parseFloat(price) },
            skinType: skinType.toLowerCase()
        }).populate('steps.product');

        if (routines.length === 0) {
            const { morningDoc, nightDoc } = await generateAndSaveRoutines(skinType.toLowerCase());

            await morningDoc.populate('steps.product');
            await nightDoc.populate('steps.product');

            const filteredRoutines = [morningDoc, nightDoc].filter(r =>
                r.totalPrice <= parseFloat(price)
            );

            return res.status(200).json(filteredRoutines);
        }

        res.status(200).json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving routines', error: error.message });
    }
}

export const deleteRoutineById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRoutine = await Routine.findByIdAndDelete(id);
        if (!deletedRoutine) {
            return res.status(404).json({ message: 'Routine not found' });
        }
        res.status(200).json({
            message: 'Routine deleted successfully',
            routine: deletedRoutine
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting routine', error: error.message });
    }
}