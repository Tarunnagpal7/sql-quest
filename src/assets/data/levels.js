export const levels = [
  {
    id: 1,
    position: {
      desktop: { x: 81, y: 102 },
      mobile: { x: 86, y: 90 }
    },
    title: "Find the correct keyword to find map",
    query: "SELECT * FROM map",
    unlocked: true,
    completed: false,
    type: "basic",
  },
  {
    id: 2,
    position: {
      desktop: { x: 39, y: 102 },
      mobile: { x: 41, y: 87 }
    },
    title: "Shoot The Correct Fish",
    query: "SELECT name FROM products WHERE price > 100",
    unlocked: false,
    completed: false,
    type: "basic",
  },
  {
    id: 3,
    position: {
      desktop: { x: 67, y: 70 },
      mobile: { x: 72, y: 63 }
    },
    query: "JOIN users ON orders.user_id = users.id",
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 4,
    position: {
      desktop: { x: 82, y: 56 },
      mobile: { x: 87, y: 50 }
    },
    query: "GROUP BY category HAVING COUNT(*) > 5",
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 5,
    position: {
      desktop: { x: 53, y: 58 },
      mobile: { x: 54, y: 52 }
    },
    query: "CREATE INDEX ON products(name)",
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 6,
    position: {
      desktop: { x: 38, y: 70 },
      mobile: { x: 42, y: 62 }
    },
    query: "UPDATE users SET status = 'active'",
    unlocked: false,
    completed: false,
    type: "intermediate",
  },
  {
    id: 7,
    position: {
      desktop: { x: 23, y: 55 },
      mobile: { x: 24, y: 50 }
    },
    query: "DELETE FROM orders WHERE date < '2023-01-01'",
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 8,
    position: {
      desktop: { x: 40, y: 41 },
      mobile: { x: 42, y: 38 }
    },
    query: "ALTER TABLE users ADD COLUMN email VARCHAR(255)",
    unlocked: false,
    completed: false,
    type: "advanced",
  },
  {
    id: 9,
    position: {
      desktop: { x: 63, y: 35 },
      mobile: { x: 70, y: 34 }
    },
    query: "SELECT DISTINCT category FROM products",
    unlocked: false,
    completed: false,
    type: "expert",
  },
  {
    id: 10,
    position: {
      desktop: { x: 88, y: 18 },
      mobile: { x: 93, y: 19 }
    },
    query: "CREATE VIEW active_users AS SELECT * FROM users WHERE status = 'active'",
    unlocked: false,
    completed: false,
    type: "expert",
  },
];

// Define custom paths between levels
export const levelPaths = {
  1: [
    { x: 81, y: 102 }, // Start at level 1
    { x: 88, y: 70 }, // Move left
    { x: 65, y: 102 }, // Continue left
    { x: 55, y: 102 }, // More left
    { x: 45, y: 42 }, // Almost there
    { x: 39, y: 102 }  // Reach level 2
  ],
  2: [
    { x: 39, y: 102 }, // Start at level 2
    { x: 45, y: 98 },  // Move up and right
    { x: 52, y: 90 },  // Continue diagonal
    { x: 58, y: 82 },  // More diagonal
    { x: 63, y: 75 },  // Almost there
    { x: 67, y: 70 }   // Reach level 3
  ],
  3: [
    { x: 67, y: 70 },  // Start at level 3
    { x: 70, y: 68 },  // Move right and up
    { x: 74, y: 64 },  // Continue diagonal
    { x: 78, y: 60 },  // More diagonal
    { x: 82, y: 56 }   // Reach level 4
  ],
  4: [
    { x: 82, y: 56 },  // Start at level 4
    { x: 78, y: 58 },  // Move left
    { x: 72, y: 58 },  // Continue left
    { x: 65, y: 58 },  // More left
    { x: 58, y: 58 },  // Almost there
    { x: 53, y: 58 }   // Reach level 5
  ],
  5: [
    { x: 53, y: 58 },  // Start at level 5
    { x: 48, y: 62 },  // Move left and down
    { x: 43, y: 66 },  // Continue diagonal
    { x: 38, y: 70 }   // Reach level 6
  ],
  6: [
    { x: 38, y: 70 },  // Start at level 6
    { x: 35, y: 68 },  // Move left and up
    { x: 32, y: 65 },  // Continue diagonal
    { x: 28, y: 60 },  // More diagonal
    { x: 25, y: 57 },  // Almost there
    { x: 23, y: 55 }   // Reach level 7
  ],
  7: [
    { x: 23, y: 55 },  // Start at level 7
    { x: 27, y: 50 },  // Move right and up
    { x: 32, y: 46 },  // Continue diagonal
    { x: 36, y: 43 },  // More diagonal
    { x: 40, y: 41 }   // Reach level 8
  ],
  8: [
    { x: 40, y: 41 },  // Start at level 8
    { x: 45, y: 39 },  // Move right and up
    { x: 50, y: 37 },  // Continue diagonal
    { x: 56, y: 36 },  // More diagonal
    { x: 63, y: 35 }   // Reach level 9
  ],
  9: [
    { x: 63, y: 35 },  // Start at level 9
    { x: 68, y: 32 },  // Move right and up
    { x: 73, y: 28 },  // Continue diagonal
    { x: 78, y: 24 },  // More diagonal
    { x: 83, y: 21 },  // Almost there
    { x: 88, y: 18 }   // Reach level 10
  ],
  10: [
    { x: 39, y: 102 }, // Start at level 1
    { x: 75, y: 102 }, // Move left
    { x: 65, y: 101 }, // Continue left
    { x: 55, y: 100 }, // More left
    { x: 45, y: 90 }, // Almost there
    { x: 81, y: 102 }  // Reach level 2
  ]
};

// Path animation utility functions
export const pathUtils = {
  // Calculate distance between two points
  calculateDistance: (point1, point2) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Interpolate between two points
  interpolatePoints: (start, end, progress) => {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    };
  },

  // Create smooth curve between waypoints
  createSmoothPath: (waypoints, segments = 20) => {
    if (waypoints.length < 2) return waypoints;
    
    const smoothPath = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const current = waypoints[i];
      const next = waypoints[i + 1];
      
      // Generate smooth points between waypoints
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const point = pathUtils.interpolatePoints(current, next, t);
        smoothPath.push(point);
      }
    }
    
    return smoothPath;
  },

  // Add some curve to the path for more natural movement
  addCurveToPath: (path, curveIntensity = 0.1) => {
    if (path.length < 3) return path;
    
    const curvedPath = [path[0]]; // Keep first point
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      // Calculate perpendicular offset for curve
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const perpX = -dy * curveIntensity;
      const perpY = dx * curveIntensity;
      
      curvedPath.push({
        x: current.x + perpX,
        y: current.y + perpY
      });
    }
    
    curvedPath.push(path[path.length - 1]); // Keep last point
    return curvedPath;
  }
};