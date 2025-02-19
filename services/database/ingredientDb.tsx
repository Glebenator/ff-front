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

// Helper functions for database operations
const normalizeItemName = (name: string): string => {
    return name.trim().toLowerCase();
};

const escapeString = (str: string): string => {
    return str.replace(/'/g, "''");
};

// Web platform mock implementation remains unchanged
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
                
                -- Add indexes for better performance
                CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
                CREATE INDEX IF NOT EXISTS idx_ingredients_expiry ON ingredients(expiryDate);
                CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
            `;
            
            db.execSync(createTable);
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    };

    const findDuplicates = (db: any, ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
        const normalizedName = normalizeItemName(ingredient.name);
        const query = `
            SELECT * FROM ingredients 
            WHERE LOWER(TRIM(name)) = '${normalizedName}'
            AND expiryDate = '${ingredient.expiryDate}'
            ${ingredient.category 
                ? `AND category = '${escapeString(ingredient.category)}'` 
                : 'AND category IS NULL'}
        `;
        return db.getAllSync(query);
    };

    return {
        // Add new ingredient with duplicate handling
        add: (ingredient: Omit<Ingredient, 'id' | 'dateAdded'>) => {
            console.log('Starting add operation with ingredient:', ingredient);
            const db = getDatabase();
            const now = new Date().toISOString();
            
            try {
                // Check for duplicates
                const existingItems = findDuplicates(db, ingredient);
                
                if (existingItems.length > 0) {
                    // Update existing item quantity
                    const existingItem = existingItems[0];
                    const currentQuantity = parseInt(existingItem.quantity) || 0;
                    const addingQuantity = parseInt(ingredient.quantity) || 0;
                    const newQuantity = currentQuantity + addingQuantity;

                    const updateQuery = `
                        UPDATE ingredients 
                        SET quantity = '${newQuantity}'
                        WHERE id = ${existingItem.id}
                    `;
                    
                    db.execSync(updateQuery);
                    return existingItem.id;
                }

                // If no duplicate found, insert new item
                const insertQuery = `
                    INSERT INTO ingredients (
                        name, 
                        quantity, 
                        expiryDate, 
                        dateAdded, 
                        category, 
                        notes
                    )
                    VALUES (
                        '${escapeString(ingredient.name.trim())}',
                        '${escapeString(ingredient.quantity)}',
                        '${ingredient.expiryDate}',
                        '${now}',
                        ${ingredient.category ? `'${escapeString(ingredient.category.trim())}'` : 'NULL'},
                        ${ingredient.notes ? `'${escapeString(ingredient.notes.trim())}'` : 'NULL'}
                    );
                `;
                
                db.execSync(insertQuery);
                const inserted = db.getAllSync('SELECT * FROM ingredients ORDER BY id DESC LIMIT 1');
                return inserted[0]?.id || null;
            } catch (error) {
                console.error('Add operation error:', error);
                throw error;
            }
        },

        // Get all ingredients with normalized names
        getAll: () => {
            const db = getDatabase();
            try {
                const results = db.getAllSync(`
                    SELECT * FROM ingredients 
                    ORDER BY datetime(expiryDate) ASC
                `);
                return results;
            } catch (error) {
                console.error('Error getting ingredients:', error);
                throw error;
            }
        },

        // Get single ingredient by ID
        getById: (id: number) => {
            const db = getDatabase();
            try {
                const query = `
                    SELECT * FROM ingredients 
                    WHERE id = ${id}
                `;
                const results = db.getAllSync(query);
                return results[0] || null;
            } catch (error) {
                console.error('Error getting ingredient by ID:', error);
                throw error;
            }
        },

        // Update ingredient with duplicate handling
        update: (id: number, updates: Partial<Omit<Ingredient, 'id' | 'dateAdded'>>) => {
            console.log('Updating ingredient:', { id, updates });
            const db = getDatabase();
            
            try {
                // Get current item
                const currentItem = db.getAllSync(`SELECT * FROM ingredients WHERE id = ${id}`)[0];
                if (!currentItem) return false;

                // If name, category, or expiryDate is being updated, check for duplicates
                if (updates.name || updates.category || updates.expiryDate) {
                    const checkItem = {
                        name: updates.name || currentItem.name,
                        category: updates.category !== undefined ? updates.category : currentItem.category,
                        expiryDate: updates.expiryDate || currentItem.expiryDate,
                        quantity: updates.quantity || currentItem.quantity
                    };

                    const duplicates = findDuplicates(db, checkItem)
                        .filter(item => item.id !== id);

                    if (duplicates.length > 0) {
                        // Merge with existing item
                        const targetItem = duplicates[0];
                        const newQuantity = (parseInt(checkItem.quantity) || 0) + 
                                         (parseInt(targetItem.quantity) || 0);

                        // Update the existing duplicate
                        db.execSync(`
                            UPDATE ingredients 
                            SET quantity = '${newQuantity}'
                            WHERE id = ${targetItem.id}
                        `);

                        // Delete the current item since it's been merged
                        db.execSync(`DELETE FROM ingredients WHERE id = ${id}`);
                        return true;
                    }
                }

                // If no duplicates or no duplicate-triggering fields updated, proceed with normal update
                const updateParts = [];
                
                if (updates.name !== undefined) {
                    updateParts.push(`name = '${escapeString(updates.name.trim())}'`);
                }
                if (updates.quantity !== undefined) {
                    updateParts.push(`quantity = '${escapeString(updates.quantity.trim())}'`);
                }
                if (updates.expiryDate !== undefined) {
                    updateParts.push(`expiryDate = '${updates.expiryDate}'`);
                }
                if (updates.category !== undefined) {
                    updateParts.push(updates.category ? 
                        `category = '${escapeString(updates.category.trim())}'` : 
                        'category = NULL');
                }
                if (updates.notes !== undefined) {
                    updateParts.push(updates.notes ? 
                        `notes = '${escapeString(updates.notes.trim())}'` : 
                        'notes = NULL');
                }
        
                if (updateParts.length === 0) {
                    console.log('No valid updates provided');
                    return false;
                }
        
                const query = `
                    UPDATE ingredients 
                    SET ${updateParts.join(', ')}
                    WHERE id = ${id}
                `;
        
                db.execSync(query);
                return true;
            } catch (error) {
                console.error('Error updating ingredient:', error);
                throw error;
            }
        },

        // Delete ingredient - no changes needed
        delete: (id: number) => {
            console.log('Deleting ingredient:', id);
            const db = getDatabase();
            try {
                const query = `DELETE FROM ingredients WHERE id = ${id}`;
                db.execSync(query);
                return true;
            } catch (error) {
                console.error('Error deleting ingredient:', error);
                throw error;
            }
        },

        // Get ingredients expiring soon - no changes needed
        getExpiringSoon: (daysThreshold: number = 5) => {
            console.log('Getting ingredients expiring within days:', daysThreshold);
            const db = getDatabase();
            try {
                const query = `
                    WITH current_day AS (
                        SELECT date('now', 'start of day') as today
                    )
                    SELECT *, 
                    CAST(
                        (julianday(date(expiryDate, 'start of day')) - julianday((SELECT today FROM current_day)))
                        AS INTEGER
                    ) as daysUntilExpiry
                    FROM ingredients, current_day
                    WHERE date(expiryDate, 'start of day') > (SELECT today FROM current_day)
                    AND date(expiryDate, 'start of day') <= date((SELECT today FROM current_day), '+' || '${daysThreshold}' || ' days')
                    ORDER BY expiryDate ASC
                `;
                
                const results = db.getAllSync(query);
                return results;
            } catch (error) {
                console.error('Error getting expiring soon ingredients:', error);
                throw error;
            }
        },

        // Get all unique categories - no changes needed
        getCategories: () => {
            const db = getDatabase();
            try {
                const query = `
                    SELECT DISTINCT category 
                    FROM ingredients 
                    WHERE category IS NOT NULL 
                    ORDER BY category
                `;
                const results = db.getAllSync(query);
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