const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

class RegisterUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }) {
    if (!name || !email || !password)
      throw new Error('Todos los campos son requeridos');

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error('El email ya está registrado');

    const passwordHash = await bcrypt.hash(password, 10);
    const user         = await this.userRepository.save({ name, email, passwordHash });
    const token        = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }
}

module.exports = RegisterUseCase;