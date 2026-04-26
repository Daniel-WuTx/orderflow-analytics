class UpdateRoleUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ targetId, requesterId, role }) {
    if (!['admin', 'customer'].includes(role))
      throw new Error('Rol inválido');

    if (targetId === requesterId)
      throw new Error('No puedes cambiar tu propio rol');

    const target = await this.userRepository.findById(targetId);
    if (!target) throw new Error('Usuario no encontrado');

    if (target.role === 'superadmin')
      throw new Error('No se puede modificar el rol de un superadmin');

    return this.userRepository.updateRole(targetId, role);
  }
}

module.exports = UpdateRoleUseCase;