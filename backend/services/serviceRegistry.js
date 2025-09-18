const registry = new Map();

const register = (name, instance) => {
  if (!registry.has(name)) {
    registry.set(name, instance);
  }
};

const get = (name) => {
  if (!registry.has(name)) {
    throw new Error(`Service ${name} not found.`);
  }
  return registry.get(name);
};

module.exports = { register, get };
