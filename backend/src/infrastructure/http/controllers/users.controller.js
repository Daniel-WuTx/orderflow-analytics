const container = require('../../container');

const getAll = async (req, res) => {
  try {
    const users = await container.userRepository.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const user = await container.updateRoleUseCase.execute({
      targetId:    req.params.id,
      requesterId: req.user.id,
      role:        req.body.role,
    });
    res.json(user);
  } catch (err) {
    const code = err.message === 'Usuario no encontrado' ? 404 : 403;
    res.status(code).json({ error: err.message });
  }
};

module.exports = { getAll, updateRole };