# FridgeFriend

FridgeFriend is a smart kitchen companion app designed to help users track ingredients, manage expiry dates, and reduce food waste. Built with React Native and Expo, it works on both iOS and Android platforms.

![FridgeFriend Logo](https://via.placeholder.com/150/53D181/FFFFFF?text=FridgeFriend)

## 🌟 Features

### 📱 Core Features
- **Ingredient Tracking**: Easily add, update, and manage ingredients in your fridge
- **Expiration Management**: Track expiry dates and get alerts for items expiring soon
- **Category Organization**: Organize ingredients by categories for quick access
- **Search & Filter**: Quickly find ingredients using search and filter options
- **Recipe Suggestions**: Get recipe ideas based on available ingredients

### 📋 Key Screens
- **Home**: Overview dashboard showing expiring items and quick actions
- **My Fridge**: Main inventory management with filtering and sorting options
- **Sessions**: Track and manage incoming/outgoing ingredient sessions
- **Recipes**: Discover recipes based on available ingredients with customizable preferences

## 🏗️ Technology Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router
- **Storage**: SQLite (mobile) with AsyncStorage for preferences
- **Notifications**: Expo Notifications for expiry alerts
- **UI Components**: Custom components with Expo Vector Icons


## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or newer)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Glebenator/ff-front.git
   cd ff-front
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Run on a device or emulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Or scan the QR code with the Expo Go app on your physical device
   

### Development Scripts

- `npm start` - Start the Expo development server with tunneling
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser (limited functionality)
- `npm run lint` - Run linting

## 📱 Mobile App Features

### My Fridge Screen
- View all ingredients with expiry dates
- Filter by category or expiry status
- Search for specific ingredients
- Sort by name, expiry date, or date added
- Add new ingredients with detailed information

### Sessions
- Track and approve/reject scanning sessions
- Edit detected items before approving
- View history of past sessions
- Manage incoming and outgoing items

### Recipes
- Get recipe suggestions based on available ingredients
- Filter by dietary preferences and meal types
- Save favorite recipes
- View detailed cooking instructions and nutritional information

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.