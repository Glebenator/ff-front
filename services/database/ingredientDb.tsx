// app/services/database/ingredientDb.ts
import { Platform } from 'react-native';

export interface Ingredient {
    id?: number;
    name: string;
    quantity: string;
    expiryDate: string;
    dateAdded: string;
    category?: string;
    notes?: string;
}

// Web platform mock implementation
const webDb = {
    add: () => {
        throw new Error('Database operations are not supported on web platform');
    },
    getAll: () => {
        throw new Error('Database operations are not supported on web platform');
    }
};

// Native platform implementation
const getNativeDb = () => {
    if (Platform.OS === 'web') {
        return webDb;
    }

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
        console.log('Starting database initialization...');
        const db = getDatabase();

        try {
            // Create the table if it doesn't exist
            const createTable = `
                CREATE TABLE IF NOT EXISTS ingredients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    quantity TEXT NOT NULL,
                    expiryDate TEXT NOT NULL,
                    dateAdded TEXT NOT NULL,
                    category TEXT,
                    notes TEXT
                );
            `;
            
            db.execSync(createTable);
            console.log('Created or verified table structure');

            // Verify table structure
            const tableInfo = db.getAllSync('PRAGMA table_info(ingredients)');
            // console.log('Table structure:', tableInfo);
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    };

    return {
        add: (ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
            // console.log('Starting add operation with ingredient:', ingredient);
            const db = getDatabase();
            const now = new Date().toISOString();
            
            try {
                // Build the SQL query with literal values for better debugging
                const query = `
                    INSERT INTO ingredients (name, quantity, expiryDate, dateAdded, category, notes)
                    VALUES (
                        '${ingredient.name.trim().replace(/'/g, "''")}',
                        '${ingredient.quantity.trim().replace(/'/g, "''")}',
                        '${ingredient.expiryDate.replace(/'/g, "''")}',
                        '${now}',
                        ${ingredient.category ? `'${ingredient.category.trim().replace(/'/g, "''")}'` : 'NULL'},
                        ${ingredient.notes ? `'${ingredient.notes.trim().replace(/'/g, "''")}'` : 'NULL'}
                    );
                `;
                
                console.log('Executing query:', query);
                
                // Execute the insert
                db.execSync(query);
                
                // Get the ID of the newly inserted row
                const inserted = db.getAllSync('SELECT * FROM ingredients ORDER BY id DESC LIMIT 1');
                console.log('Newly inserted record:', inserted);
                
                if (inserted && inserted.length > 0) {
                    return inserted[0].id;
                }
                
                return null;
            } catch (error) {
                console.error('Add operation error:', error);
                throw error;
            }
        },

        getAll: () => {
            // console.log('Getting all ingredients');
            const db = getDatabase();
            try {
                const results = db.getAllSync(`
                    SELECT * FROM ingredients 
                    ORDER BY datetime(expiryDate) ASC
                `);
                // console.log('Retrieved ingredients:', results);
                return results;
            } catch (error) {
                console.error('Error getting ingredients:', error);
                throw error;
            }
        },

        getExpiringSoon: (daysThreshold: number = 5) => {
            const db = getDatabase();
            const query = `
                SELECT *, 
                ROUND((julianday(expiryDate) - julianday('now'))) as daysUntilExpiry
                FROM ingredients 
                WHERE date(expiryDate) <= date('now', '+' || ? || ' days')
                AND date(expiryDate) >= date('now')
                ORDER BY expiryDate ASC
            `;
            
            try {
                return db.getAllSync(query, [daysThreshold.toString()]);
            } catch (error) {
                console.error('Error getting expiring soon ingredients:', error);
                throw error;
            }
        }
    };
};

// Export the appropriate database implementation based on platform
export const ingredientDb = Platform.select({
    web: webDb,
    default: getNativeDb()
});