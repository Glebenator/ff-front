// app/api/route+api.ts
// Store recent updates in memory (in a real app, this would be in a proper database)
let recentUpdates: { name: string; direction: 'in' | 'out'; timestamp: string }[] = [];

// Helper function to add an update to the recent updates list
function addUpdate(name: string, direction: 'in' | 'out') {
    recentUpdates = [
        { name, direction, timestamp: new Date().toISOString() },
        ...recentUpdates
    ].slice(0, 10); // Keep last 10 updates
}

export async function GET(request: Request) {
    return new Response(JSON.stringify({
        updates: recentUpdates
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
import { Platform } from 'react-native';
import { ingredientDb } from '@/services/database/ingredientDb';

interface RPIItem {
  name: string;
  direction: 'in' | 'out';
}

interface RPIPayload {
  session_start: string;
  items: RPIItem[];
}

export async function POST(request: Request) {
    try {
        // Get the JSON body from the request
        const payload = await request.json() as RPIPayload;
        console.log('Received POST request with payload:', payload);

        // Validate payload structure
        if (!payload.session_start || !Array.isArray(payload.items)) {
            return new Response(
                JSON.stringify({ error: 'Invalid payload structure' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (Platform.OS === 'web') {
            // For web platform, log the received items
            console.log('Web platform received items:', 
                payload.items.map(item => ({
                    name: item.name,
                    action: item.direction === 'in' ? 'added to fridge' : 'removed from fridge'
                }))
            );
            
            // Return success response for web platform
            return new Response(JSON.stringify({
                status: 'success',
                message: 'Items received on web platform',
                session_start: payload.session_start,
                items: payload.items
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const results = {
            processed: [] as string[],
            errors: [] as string[]
        };

        // Process each item in the payload
        for (const item of payload.items) {
            try {
                // Get existing ingredient
                const existingItems = ingredientDb.getAll().filter(
                    existing => existing.name.toLowerCase() === item.name.toLowerCase()
                );

                if (item.direction === 'in') {
                    if (existingItems.length === 0) {
                        // Create new ingredient
                        const newIngredient = {
                            name: item.name,
                            quantity: '1',
                            expiryDate: calculateDefaultExpiry(item.name),
                            category: determineCategory(item.name)
                        };
                        
                        ingredientDb.add(newIngredient);
                        addUpdate(item.name, 'in');
                        results.processed.push(`Added new item: ${item.name}`);
                    } else {
                        // Update existing ingredient quantity
                        const existing = existingItems[0];
                        const currentQty = parseInt(existing.quantity) || 0;
                        
                        ingredientDb.update(existing.id!, {
                            quantity: (currentQty + 1).toString()
                        });
                        results.processed.push(`Increased quantity of ${item.name}`);
                    }
                } else if (item.direction === 'out') {
                    if (existingItems.length === 0) {
                        results.errors.push(`Cannot remove ${item.name}: item not found`);
                        continue;
                    }

                    const existing = existingItems[0];
                    const currentQty = parseInt(existing.quantity) || 0;

                    if (currentQty <= 1) {
                        // Remove the item if quantity would become 0
                        ingredientDb.delete(existing.id!);
                        results.processed.push(`Removed ${item.name}`);
                    } else {
                        // Decrement quantity
                        ingredientDb.update(existing.id!, {
                            quantity: (currentQty - 1).toString()
                        });
                        results.processed.push(`Decreased quantity of ${item.name}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${item.name}:`, error);
                results.errors.push(`Error processing ${item.name}: ${error.message}`);
            }
        }

        // Return success response with results
        return new Response(JSON.stringify({
            status: 'success',
            session_start: payload.session_start,
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error processing POST request:', error);
        
        return new Response(JSON.stringify({
            error: 'Failed to process request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Helper function to calculate default expiry date based on item type
function calculateDefaultExpiry(itemName: string): string {
    const today = new Date();
    const lowercase = itemName.toLowerCase();
    
    // Define default expiry periods for different types of items
    let daysToAdd = 7; // Default 1 week

    if (lowercase.includes('milk') || lowercase.includes('dairy')) {
        daysToAdd = 14;  // 2 weeks for dairy
    } else if (lowercase.includes('meat') || lowercase.includes('fish')) {
        daysToAdd = 5;   // 5 days for meat/fish
    } else if (lowercase.includes('bread')) {
        daysToAdd = 7;   // 1 week for bread
    } else if (lowercase.includes('vegetable') || lowercase.includes('fruit')) {
        daysToAdd = 10;  // 10 days for produce
    }

    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
}

// Helper function to determine category based on item name
function determineCategory(itemName: string): string {
    const lowercase = itemName.toLowerCase();
    
    if (lowercase.includes('milk') || lowercase.includes('cheese') || lowercase.includes('yogurt')) {
        return 'Dairy';
    } else if (lowercase.includes('meat') || lowercase.includes('chicken') || lowercase.includes('fish')) {
        return 'Meat & Fish';
    } else if (lowercase.includes('apple') || lowercase.includes('banana') || lowercase.includes('fruit')) {
        return 'Fruits';
    } else if (lowercase.includes('vegetable') || lowercase.includes('carrot') || lowercase.includes('lettuce')) {
        return 'Vegetables';
    } else if (lowercase.includes('bread') || lowercase.includes('bagel')) {
        return 'Bakery';
    }
    
    return 'Other';
}