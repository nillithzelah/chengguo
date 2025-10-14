/**
 * 用户层级管理工具函数
 * 用于处理用户等级晋升和下级用户递归查找
 */

/**
 * 用户等级映射
 * 定义用户等级的晋升路径
 */
const USER_LEVELS = {
  // 内部用户等级链
  internal: {
    'internal_user_3': 'internal_user_2',
    'internal_user_2': 'internal_user_1',
    'internal_user_1': 'internal_service'
  },
  // 外部用户等级链
  external: {
    'external_user_3': 'external_user_2',
    'external_user_2': 'external_user_1',
    'external_user_1': 'external_service'
  }
};

/**
 * 旧角色名称到新角色名称的映射
 * 用于兼容旧的角色系统
 */
const LEGACY_ROLE_MAPPING = {
  'user': 'internal_user_1',
  'moderator': 'internal_service',
  'viewer': 'internal_user_1',
  'super_viewer': 'internal_boss',
  'internal_user': 'internal_user_1',
  'external_user': 'external_user_1'
};

/**
 * 将旧角色名称映射到新角色名称
 * @param {string} role - 用户角色（可能是旧格式）
 * @returns {string} - 新格式的角色名称
 */
function mapLegacyRole(role) {
  return LEGACY_ROLE_MAPPING[role] || role;
}

/**
 * 获取用户等级类型（内部或外部）
 * @param {string} role - 用户角色
 * @returns {string} - 'internal' 或 'external'
 */
function getUserType(role) {
  const mappedRole = mapLegacyRole(role);
  if (mappedRole.startsWith('internal_')) {
    return 'internal';
  } else if (mappedRole.startsWith('external_')) {
    return 'external';
  }
  return null;
}

/**
 * 获取下一个等级
 * @param {string} currentRole - 当前角色
 * @returns {string|null} - 下一个等级，如果已经是最高级则返回null
 */
function getNextLevel(currentRole) {
  const mappedRole = mapLegacyRole(currentRole);
  const userType = getUserType(mappedRole);

  if (!userType || !USER_LEVELS[userType][mappedRole]) {
    return null;
  }

  return USER_LEVELS[userType][mappedRole];
}

/**
 * 检查用户是否可以晋升
 * @param {string} currentRole - 当前角色
 * @returns {boolean} - 是否可以晋升
 */
function canPromote(currentRole) {
  return getNextLevel(currentRole) !== null;
}

/**
 * 获取所有可用的角色列表（包括旧角色名称的兼容性）
 * @returns {Array} - 角色列表，包含新旧格式的映射
 */
function getAllAvailableRoles() {
  const newRoles = [
    'admin',
    'internal_boss', 'internal_service', 'internal_user_1', 'internal_user_2', 'internal_user_3',
    'external_boss', 'external_service', 'external_user_1', 'external_user_2', 'external_user_3'
  ];

  const legacyRoles = Object.keys(LEGACY_ROLE_MAPPING);

  return [...newRoles, ...legacyRoles];
}

/**
 * 获取角色显示名称
 * @param {string} role - 角色名称
 * @returns {string} - 显示名称
 */
function getRoleDisplayName(role) {
  const displayNames = {
    'admin': '管理员',
    'internal_boss': '内部老板',
    'internal_service': '内部客服',
    'internal_user_1': '内部普通用户1级',
    'internal_user_2': '内部普通用户2级',
    'internal_user_3': '内部普通用户3级',
    'external_boss': '外部老板',
    'external_service': '外部客服',
    'external_user_1': '外部普通用户1级',
    'external_user_2': '外部普通用户2级',
    'external_user_3': '外部普通用户3级',
    // 旧角色名称
    'user': '内部普通用户1级',
    'moderator': '内部客服',
    'viewer': '内部普通用户1级',
    'super_viewer': '内部老板',
    'internal_user': '内部普通用户1级',
    'external_user': '外部普通用户1级'
  };

  return displayNames[role] || role;
}

/**
 * 递归查找所有下级用户ID
 * @param {Array} allUsers - 所有用户列表
 * @param {number} userId - 用户ID
 * @returns {Array} - 所有下级用户ID列表（包括间接下级）
 */
function getAllSubordinateIds(allUsers, userId) {
  const subordinateIds = new Set();
  const queue = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    subordinateIds.add(currentId);

    // 查找所有由当前用户创建的用户（处理类型不匹配问题）
    const children = allUsers.filter(user => Number(user.created_by) === currentId);

    children.forEach(child => {
      if (!subordinateIds.has(child.id)) {
        queue.push(child.id);
      }
    });
  }

  // 移除用户自己，只保留下级用户
  subordinateIds.delete(userId);

  return Array.from(subordinateIds);
}

/**
 * 根据角色获取下级用户（基于parent_id层级关系）
 * @param {Array} allUsers - 所有用户列表
 * @param {number} userId - 用户ID
 * @returns {Array} - 所有下级用户ID列表
 */
function getSubordinateIdsByParent(allUsers, userId) {
  const subordinateIds = new Set();

  // 查找所有以当前用户为上级用户的用户
  const directSubordinates = allUsers.filter(user => Number(user.parent_id) === userId);

  directSubordinates.forEach(subordinate => {
    subordinateIds.add(subordinate.id);
    // 递归查找下级的下级
    const indirectSubordinates = getSubordinateIdsByParent(allUsers, subordinate.id);
    indirectSubordinates.forEach(id => subordinateIds.add(id));
  });

  return Array.from(subordinateIds);
}

/**
 * 获取用户的完整层级链
 * @param {Array} allUsers - 所有用户列表
 * @param {number} userId - 用户ID
 * @returns {Array} - 从顶级用户到当前用户的完整层级链
 */
function getUserHierarchyChain(allUsers, userId) {
  const chain = [];
  const visited = new Set();

  let currentUser = allUsers.find(user => user.id === userId);

  while (currentUser && !visited.has(currentUser.id)) {
    visited.add(currentUser.id);
    chain.unshift({
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role
    });

    // 查找上级用户
    if (currentUser.parent_id) {
      currentUser = allUsers.find(user => user.id === currentUser.parent_id);
    } else {
      break;
    }
  }

  return chain;
}

/**
 * 批量晋升用户等级
 * @param {Array} users - 需要晋升的用户列表
 * @param {string} targetRole - 目标角色
 * @returns {Array} - 晋升后的用户列表
 */
function promoteUsers(users, targetRole) {
  return users.map(user => ({
    ...user,
    role: targetRole
  }));
}

/**
 * 标准化角色名称（将旧角色名称转换为新格式）
 * @param {string} role - 角色名称
 * @returns {string} - 标准化后的角色名称
 */
function normalizeRole(role) {
  return mapLegacyRole(role);
}

/**
 * 检查两个角色是否等价（包括旧角色名称的兼容性）
 * @param {string} role1 - 角色1
 * @param {string} role2 - 角色2
 * @returns {boolean} - 是否等价
 */
function areRolesEquivalent(role1, role2) {
  return normalizeRole(role1) === normalizeRole(role2);
}

/**
 * 获取可晋升的用户列表
 * @param {Array} allUsers - 所有用户列表
 * @param {number} userId - 用户ID
 * @returns {Array} - 可以晋升的用户列表
 */
function getPromotableUsers(allUsers, userId) {
  const subordinateIds = getAllSubordinateIds(allUsers, userId);
  const currentUser = allUsers.find(user => user.id === userId);

  if (!currentUser) {
    return [];
  }

  // 获取当前用户可以晋升到的等级
  const nextLevel = getNextLevel(currentUser.role);

  if (!nextLevel) {
    return []; // 当前用户已经是最高级，不能晋升
  }

  // 查找所有可以晋升的用户
  const promotableUsers = subordinateIds.map(id => {
    const user = allUsers.find(u => u.id === id);
    if (user && canPromote(user.role)) {
      return {
        ...user,
        newRole: getNextLevel(user.role)
      };
    }
    return null;
  }).filter(Boolean);

  return promotableUsers;
}

module.exports = {
  USER_LEVELS,
  LEGACY_ROLE_MAPPING,
  getUserType,
  getNextLevel,
  canPromote,
  getAllSubordinateIds,
  getSubordinateIdsByParent,
  getUserHierarchyChain,
  promoteUsers,
  getPromotableUsers,
  mapLegacyRole,
  getAllAvailableRoles,
  getRoleDisplayName,
  normalizeRole,
  areRolesEquivalent
};