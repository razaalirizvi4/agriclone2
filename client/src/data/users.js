// Temporary local users data to simulate backend storage.
// This can later be replaced with real API calls.

export const initialUsers = [
  {
    _id: "u1",
    name: "Alice Admin",
    email: "alice@example.com",
    hashPassword: "********",
    role: "admin",
    contact: "+1-555-0100",
    isRemoved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "u2",
    name: "Bob Manager",
    email: "bob@example.com",
    hashPassword: "********",
    role: "manager",
    contact: "+1-555-0101",
    isRemoved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "u3",
    name: "Carol Viewer (removed)",
    email: "carol@example.com",
    hashPassword: "********",
    role: "viewer",
    contact: "+1-555-0102",
    isRemoved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];


