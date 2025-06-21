// MongoDB initialization script
db = db.getSiblingDB('war-tracker');

// Create collections
db.createCollection('events');
db.createCollection('users');
db.createCollection('analytics');

// Create indexes for better performance
db.events.createIndex({ timestamp: -1 });
db.events.createIndex({ severity: 1 });
db.events.createIndex({ 'location.country': 1 });
db.events.createIndex({ 'location.coordinates': '2dsphere' });
db.events.createIndex({ credibilityScore: -1 });
db.events.createIndex({ verified: 1 });
db.events.createIndex({ source: 1 });
db.events.createIndex({ eventType: 1 });

// Insert sample data for development
db.events.insertMany([
  {
    title: "Sample Air Strike Event",
    description: "Sample event for development testing",
    eventType: "Air Strike",
    severity: "high",
    location: {
      country: "Gaza",
      city: "Gaza City",
      coordinates: [34.4668, 31.5017]
    },
    casualties: 5,
    source: "Development Sample",
    url: "https://example.com/sample",
    credibilityScore: 0.8,
    verified: true,
    timestamp: new Date(),
    aiAnalyzed: false,
    tags: ["sample", "development"]
  },
  {
    title: "Sample Rocket Attack",
    description: "Another sample event for testing",
    eventType: "Rocket Attack",
    severity: "medium",
    location: {
      country: "Israel",
      city: "Tel Aviv",
      coordinates: [34.7818, 32.0853]
    },
    casualties: 2,
    source: "Development Sample",
    url: "https://example.com/sample2",
    credibilityScore: 0.9,
    verified: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    aiAnalyzed: false,
    tags: ["sample", "development"]
  }
]);

// Create user for development
db.users.insertOne({
  username: "dev",
  email: "dev@wartracker.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "admin",
  permissions: ["read:all", "write:all", "admin:all"],
  createdAt: new Date()
});

print("War Tracker database initialized successfully!");
print("Sample events: " + db.events.countDocuments());
print("Sample users: " + db.users.countDocuments());