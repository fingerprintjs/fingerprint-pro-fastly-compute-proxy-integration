export class KVStore {
  async put(name, value) {
    return { name, value }
  }

  async get(name) {
    return {
      name,
      text: async () => {
        return `true`
      },
    }
  }

  async delete(name) {
    console.log(`Delete key ${name}`)
  }
}
