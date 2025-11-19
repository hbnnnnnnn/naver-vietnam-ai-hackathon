export const calculateSuitableScore = (ingredients, user_skin) => {
	if (!Array.isArray(ingredients) || !Array.isArray(user_skin)) return 0;

	let suitableCount = 0;
	for (const ingredient of ingredients) {
        const ingredientGoodFor = Array.isArray(ingredient.good_for)
            ? ingredient.good_for.map(s => s.toLowerCase())
            : [];
        // Check if any of the user's skin concerns match the ingredient's good_for list
        const isSuitable = user_skin.some(skinType =>
            ingredientGoodFor.includes(skinType.toLowerCase())
        );
        if (isSuitable) suitableCount++;
    }

    return (suitableCount / ingredients.length) * 100; // Return percentage
}