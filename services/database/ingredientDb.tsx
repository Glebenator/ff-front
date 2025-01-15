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
    getCategories: () => {
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
        // console.log('Starting database initialization...');
        const db = getDatabase();

        try {
            // Create tables if they don't exist
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
            // console.log('Created or verified table structure');

            // Verify table structure
            const tableInfo = db.getAllSync('PRAGMA table_info(ingredients)');
            // console.log('Table structure:', tableInfo);
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    };

    return {
        // Add new ingredient
        add: (ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
            // console.log('Starting add operation with ingredient:', ingredient);
            const db = getDatabase();
            const now = new Date().toISOString();
            
            try {
                // Build the SQL query with literal values
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
                
                // console.log('Executing query:', query);
                
                // Execute the insert
                db.execSync(query);
                
                // Get the ID of the newly inserted row
                const inserted = db.getAllSync('SELECT * FROM ingredients ORDER BY id DESC LIMIT 1');
                // console.log('Newly inserted record:', inserted);
                
                if (inserted && inserted.length > 0) {
                    return inserted[0].id;
                }
                
                return null;
            } catch (error) {
                console.error('Add operation error:', error);
                throw error;
            }
        },

        // Get all ingredients
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

        // Get single ingredient by ID
        getById: (id: number) => {
            // console.log('Getting ingredient by ID:', id);
            const db = getDatabase();
            try {
                const query = `
                    SELECT * FROM ingredients 
                    WHERE id = '${id}'
                `;
                const results = db.getAllSync(query);
                // console.log('Retrieved ingredient:', results[0]);
                return results[0] || null;
            } catch (error) {
                console.error('Error getting ingredient by ID:', error);
                throw error;
            }
        },

        // Update ingredient
        update: (id: number, updates: Partial<Omit<Ingredient, 'id' | 'dateAdded'>>) => {
            console.log('Updating ingredient:', { id, updates });
            const db = getDatabase();
            
            try {
                const updateParts = [];
                
                if (updates.name !== undefined) {
                    updateParts.push(`name = '${updates.name.trim().replace(/'/g, "''")}'`);
                }
                if (updates.quantity !== undefined) {
                    updateParts.push(`quantity = '${updates.quantity.trim().replace(/'/g, "''")}'`);
                }
                if (updates.expiryDate !== undefined) {
                    updateParts.push(`expiryDate = '${updates.expiryDate.replace(/'/g, "''")}'`);
                }
                if (updates.category !== undefined) {
                    updateParts.push(updates.category ? 
                        `category = '${updates.category.trim().replace(/'/g, "''")}'` : 
                        'category = NULL');
                }
                if (updates.notes !== undefined) {
                    updateParts.push(updates.notes ? 
                        `notes = '${updates.notes.trim().replace(/'/g, "''")}'` : 
                        'notes = NULL');
                }
        
                if (updateParts.length === 0) {
                    console.log('No valid updates provided');
                    return false;
                }
        
                const query = `
                    UPDATE ingredients 
                    SET ${updateParts.join(', ')}
                    WHERE id = '${id}'
                `;
        
                console.log('Executing update query:', query);
                db.execSync(query);
                
                // Get the updated record to verify
                const results = db.getAllSync(`SELECT * FROM ingredients WHERE id = '${id}'`);
                console.log('Updated record:', results[0]);
                
                return true;
            } catch (error) {
                console.error('Error updating ingredient:', error);
                throw error;
            }
        },

        // Delete ingredient
        delete: (id: number) => {
            console.log('Deleting ingredient:', id);
            const db = getDatabase();
            try {
                const query = `DELETE FROM ingredients WHERE id = '${id}'`;
                db.execSync(query);
                console.log('Ingredient deleted successfully');
                return true;
            } catch (error) {
                console.error('Error deleting ingredient:', error);
                throw error;
            }
        },

        // Get ingredients expiring soon
        getExpiringSoon: (daysThreshold: number = 5) => {
            // console.log('Getting ingredients expiring within days:', daysThreshold);
            const db = getDatabase();
            try {
                const query = `
                    SELECT *, 
                    ROUND((julianday(expiryDate) - julianday('now'))) as daysUntilExpiry
                    FROM ingredients 
                    WHERE date(expiryDate) <= date('now', '+' || '${daysThreshold}' || ' days')
                    AND date(expiryDate) >= date('now')
                    ORDER BY expiryDate ASC
                `;
                
                const results = db.getAllSync(query);
                // console.log('Retrieved expiring soon ingredients:', results);
                return results;
            } catch (error) {
                console.error('Error getting expiring soon ingredients:', error);
                throw error;
            }
        },

        // Get all unique categories
        getCategories: () => {
            // console.log('Getting all categories');
            const db = getDatabase();
            try {
                const query = `
                    SELECT DISTINCT category 
                    FROM ingredients 
                    WHERE category IS NOT NULL 
                    ORDER BY category
                `;
                const results = db.getAllSync(query);
                // console.log('Retrieved categories:', results);
                return results.map((row: { category: string }) => row.category);
            } catch (error) {
                console.error('Error getting categories:', error);
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