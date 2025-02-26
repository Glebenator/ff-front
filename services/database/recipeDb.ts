// services/database/recipeDb.ts
import { Platform } from 'react-native';

export interface Recipe {
    id?: number;
    name: string;
    ingredients: string[];
    instructions: string;
    steps: {
        instruction: string;
        tip?: string;
    }[];
    cookingTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tags?: string[];
    // User interaction fields
    likes: number;
    createdAt: string;
    originalIngredients: string[]; // What ingredients were used to generate this
}

// Native platform implementation
const getNativeDb = () => {
    if (Platform.OS === 'web') {
        return webDb;
    }

    const SQLite = require('expo-sqlite');
    let db = null;

    const getDatabase = () => {
        if (!db) {
            db = SQLite.openDatabaseSync('recipes.db');
            initDatabase();
        }
        return db;
    };

    const initDatabase = () => {
        const db = getDatabase();
        try {
            // Single table for validated recipes
            db.execSync(`
                CREATE TABLE IF NOT EXISTS recipes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    ingredients TEXT NOT NULL,
                    instructions TEXT NOT NULL,
                    steps TEXT NOT NULL,
                    cookingTime INTEGER NOT NULL,
                    difficulty TEXT NOT NULL,
                    tags TEXT,
                    likes INTEGER DEFAULT 0,
                    createdAt TEXT NOT NULL,
                    originalIngredients TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_likes ON recipes(likes DESC);
            `);
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    };

    return {
        // Save a generated recipe that user liked
        saveRecipe: async (recipe: Omit<Recipe, 'id' | 'likes' | 'createdAt'>) => {
            const db = getDatabase();
            const now = new Date().toISOString();

            try {
                // Check if similar recipe exists
                const existing = db.getAllSync(`
                    SELECT id FROM recipes 
                    WHERE name = '${recipe.name.replace(/'/g, "''")}'
                    AND ingredients = '${JSON.stringify(recipe.ingredients).replace(/'/g, "''")}'
                `);

                if (existing.length > 0) {
                    // Recipe exists, increment likes
                    db.execSync(`
                        UPDATE recipes 
                        SET likes = likes + 1 
                        WHERE id = ${existing[0].id}
                    `);
                    return existing[0].id;
                }

                // New recipe
                const query = `
                    INSERT INTO recipes (
                        name, ingredients, instructions, steps,
                        cookingTime, difficulty, tags, likes,
                        createdAt, originalIngredients
                    ) VALUES (
                        '${recipe.name.replace(/'/g, "''")}',
                        '${JSON.stringify(recipe.ingredients).replace(/'/g, "''")}',
                        '${recipe.instructions.replace(/'/g, "''")}',
                        '${JSON.stringify(recipe.steps).replace(/'/g, "''")}',
                        ${recipe.cookingTime},
                        '${recipe.difficulty}',
                        ${recipe.tags ? `'${JSON.stringify(recipe.tags).replace(/'/g, "''")}'` : 'NULL'},
                        1,
                        '${now}',
                        '${JSON.stringify(recipe.originalIngredients).replace(/'/g, "''")}'
                    );
                `;

                db.execSync(query);
                const inserted = db.getAllSync('SELECT last_insert_rowid() as id');
                return inserted[0].id;
            } catch (error) {
                console.error('Error saving recipe:', error);
                throw error;
            }
        },

        // Find similar recipes based on ingredients
        findSimilarRecipes: (ingredients: string[]) => {
            const db = getDatabase();
            try {
                // Get all recipes and filter in JS for complex matching
                const allRecipes = db.getAllSync('SELECT * FROM recipes ORDER BY likes DESC');
                
                return allRecipes
                    .map(row => ({
                        ...row,
                        ingredients: JSON.parse(row.ingredients),
                        steps: JSON.parse(row.steps),
                        tags: row.tags ? JSON.parse(row.tags) : [],
                        originalIngredients: JSON.parse(row.originalIngredients)
                    }))
                    .filter(recipe => {
                        // Check if at least 50% of the original ingredients match
                        const normalizedInput = ingredients.map(i => i.toLowerCase().trim());
                        const originalIngredients = recipe.originalIngredients.map(i => 
                            i.toLowerCase().trim()
                        );
                        
                        const matches = originalIngredients.filter(ing => 
                            normalizedInput.some(input => input.includes(ing) || ing.includes(input))
                        );
                        
                        return matches.length / originalIngredients.length >= 0.5;
                    });
            } catch (error) {
                console.error('Error finding similar recipes:', error);
                throw error;
            }
        },

        // Get popular recipes
        getPopularRecipes: (limit: number = 10) => {
            const db = getDatabase();
            try {
                const recipes = db.getAllSync(`
                    SELECT * FROM recipes 
                    ORDER BY likes DESC 
                    LIMIT ${limit}
                `);

                return recipes.map(row => ({
                    ...row,
                    ingredients: JSON.parse(row.ingredients),
                    steps: JSON.parse(row.steps),
                    tags: row.tags ? JSON.parse(row.tags) : [],
                    originalIngredients: JSON.parse(row.originalIngredients)
                }));
            } catch (error) {
                console.error('Error getting popular recipes:', error);
                throw error;
            }
        }
    };
};

// Web platform mock
const webDb = {
    saveRecipe: () => {
        throw new Error('Recipe storage not supported on web platform');
    },
    findSimilarRecipes: () => {
        throw new Error('Recipe storage not supported on web platform');
    },
    getPopularRecipes: () => {
        throw new Error('Recipe storage not supported on web platform');
    }
};

export const recipeDb = Platform.select({
    web: webDb,
    default: getNativeDb()
});