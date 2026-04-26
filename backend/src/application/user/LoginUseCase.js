const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

class LoginUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }) {
    if (!email || !password)
      throw new Error('Email y contraseña requeridos');

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Credenciales inválidas');

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign(
      { id: safeUser.id, role: safeUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: safeUser, token };
  }
}

module.exports = LoginUseCase;