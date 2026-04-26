const container = require('../../container');

const register = async (req, res) => {
  try {
    const result = await container.registerUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (err) {
    const code = err.message === 'El email ya está registrado' ? 409 : 400;
    res.status(code).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await container.loginUseCase.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await container.userRepository.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, me };