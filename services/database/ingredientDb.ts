import { Platform } from 'react-native';

// Type definitions
export interface Ingredient {
    id?: number;
    name: string;
    quantity: string;
    expiryDate: string;
    dateAdded: string;
    category?: string;
    notes?: string;
}

// Create a mock database interface for web
const webDb = {
    add: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    getAll: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    getById: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    update: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    delete: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    getExpiringSoon: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    search: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    clear: () => {
        throw new Error('Database operations are not supported on web platform');
    },
};

// Only import SQLite on native platforms
const getNativeDb = () => {
    if (Platform.OS === 'web') {
        return webDb;
    }

    // Dynamic import to prevent web from trying to load SQLite
    const SQLite = require('expo-sqlite');
    let db = null;

    const getDatabase = () => {
        if (!db) {
            db = SQLite.openDatabaseSync('fridge.db');
            initDatabase();
        }
        return db;
    };

    const initDatabase = () => {
        const db = getDatabase();
        db.execSync(`
            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                quantity TEXT NOT NULL,
                expiryDate TEXT NOT NULL,
                dateAdded TEXT NOT NULL,
                category TEXT,
                notes TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_expiryDate 
            ON ingredients(expiryDate);
            
            CREATE INDEX IF NOT EXISTS idx_category 
            ON ingredients(category);
        `);
    };

    return {
        // Add a new ingredient
        add: (ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
            const db = getDatabase();
            const now = new Date().toISOString();
            
            const result = db.execSync(
                `INSERT INTO ingredients (
                    name, quantity, expiryDate, dateAdded, category, notes
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ingredient.name,
                    ingredient.quantity,
                    ingredient.expiryDate,
                    now,
                    ingredient.category || null,
                    ingredient.notes || null
                ]
            );

            return result.lastInsertRowId;
        },

        // Get all ingredients
        getAll: () => {
            const db = getDatabase();
            return db.getAllSync(
                'SELECT * FROM ingredients ORDER BY expiryDate ASC'
            );
        },

        // Get a single ingredient by ID
        getById: (id: number) => {
            const db = getDatabase();
            return db.getFirstSync(
                'SELECT * FROM ingredients WHERE id = ?',
                [id]
            );
        },

        // Update an ingredient
        update: (id: number, updates: Partial<Ingredient>) => {
            const db = getDatabase();
            const allowedFields = ['name', 'quantity', 'expiryDate', 'category', 'notes'];
            const validUpdates = Object.entries(updates)
                .filter(([key]) => allowedFields.includes(key));

            if (validUpdates.length === 0) return false;

            const setClause = validUpdates.map(([key]) => `${key} = ?`).join(', ');
            const values = [...validUpdates.map(([, value]) => value), id];

            const result = db.execSync(
                `UPDATE ingredients SET ${setClause} WHERE id = ?`,
                values
            );

            return result.changes > 0;
        },

        // Delete an ingredient
        delete: (id: number) => {
            const db = getDatabase();
            const result = db.execSync(
                'DELETE FROM ingredients WHERE id = ?',
                [id]
            );
            return result.changes > 0;
        },

        // Get ingredients expiring soon
        getExpiringSoon: (daysThreshold: number = 5) => {
            const db = getDatabase();
            return db.getAllSync(
                `SELECT *, 
                ROUND((julianday(expiryDate) - julianday('now'))) as daysUntilExpiry
                FROM ingredients 
                WHERE date(expiryDate) <= date('now', '+' || ? || ' days')
                AND date(expiryDate) >= date('now')
                ORDER BY expiryDate ASC`,
                [daysThreshold.toString()]
            );
        },

        // Search ingredients
        search: (term: string) => {
            const db = getDatabase();
            return db.getAllSync(
                `SELECT * FROM ingredients 
                WHERE name LIKE ? 
                ORDER BY expiryDate ASC`,
                [`%${term}%`]
            );
        },

        // Clear all data (useful for testing)
        clear: () => {
            const db = getDatabase();
            db.execSync('DELETE FROM ingredients');
        }
    };
};

// Export the appropriate database implementation based on platform
export const ingredientDb = Platform.select({
    web: webDb,
    default: getNativeDb(),
});