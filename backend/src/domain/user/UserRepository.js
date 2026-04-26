class UserRepository {
  async findByEmail(email)   { throw new Error('Not implemented'); }
  async findById(id)         { throw new Error('Not implemented'); }
  async save(user)           { throw new Error('Not implemented'); }
  async updateRole(id, role) { throw new Error('Not implemented'); }
  async findAll()            { throw new Error('Not implemented'); }
}

module.exports = UserRepository;