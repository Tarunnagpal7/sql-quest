export const levels = [
  { id: 1, x: 50, y: 15, title : "Find the correct keyword to find map ",query: "SELECT * FROM map ", unlocked: true, completed: false, type: 'basic' },
  { id: 2, x: 25, y: 25, query: "SELECT name FROM products WHERE price > 100", unlocked: false, completed: false, type: 'basic' },
  { id: 3, x: 70, y: 30, query: "JOIN users ON orders.user_id = users.id", unlocked: false, completed: false, type: 'intermediate' },
  { id: 4, x: 40, y: 40, query: "GROUP BY category HAVING COUNT(*) > 5", unlocked: false, completed: false, type: 'intermediate' },
  { id: 5, x: 80, y: 45, query: "CREATE INDEX ON products(name)", unlocked: false, completed: false, type: 'advanced' },
  { id: 6, x: 20, y: 55, query: "UPDATE users SET status = 'active'", unlocked: false, completed: false, type: 'intermediate' },
  { id: 7, x: 60, y: 60, query: "DELETE FROM orders WHERE date < '2023-01-01'", unlocked: false, completed: false, type: 'advanced' },
  { id: 8, x: 35, y: 70, query: "ALTER TABLE users ADD COLUMN email VARCHAR(255)", unlocked: false, completed: false, type: 'advanced' },
  { id: 9, x: 75, y: 80, query: "SELECT DISTINCT category FROM products", unlocked: false, completed: false, type: 'expert' },
  { id: 10, x: 50, y: 90, query: "CREATE VIEW active_users AS SELECT * FROM users WHERE status = 'active'", unlocked: false, completed: false, type: 'expert' },
];
