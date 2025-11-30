import express from "express";

import {
  getRoutine,
  createRoutine,
  getRoutineByPrice,
  getRoutineByBudgetRange,
  deleteRoutineById,
  getRoutinesByPriceRange,
  getProductsByPriceRange
} from "../controllers/routine.controller.js";

const router = express.Router();

router.get('/', getRoutine);
router.post('/', createRoutine);
router.get('/budget', getRoutineByBudgetRange);
router.get('/price', getRoutineByPrice);
router.get('/price-range', getRoutinesByPriceRange);
router.get('/products/price-range', getProductsByPriceRange);
router.delete('/:id', deleteRoutineById);

export default router;