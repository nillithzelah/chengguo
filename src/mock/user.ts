import Mock from 'mockjs';
import setupMock, {
  successResponseWrap,
  failResponseWrap,
} from '@/utils/setup-mock';

import { MockParams } from '@/types/mock';
import { isLogin } from '@/utils/auth';

// 本地用户列表
const localUsers = [
  { username: 'admin', password: 'admin', role: 'admin', token: '12345', name: '管理员' },
  { username: 'user', password: 'user', role: 'user', token: '54321', name: '普通用户' },
  { username: 'user2', password: 'user2', role: 'user', token: '67890', name: '测试用户' },
  { username: 'viewer', password: 'viewer', role: 'viewer', token: '99999', name: '查看用户' },
];

setupMock({
  setup() {
    // Mock.XHR.prototype.withCredentials = true;

    // 用户信息
    Mock.mock(new RegExp('/api/user/info'), () => {
      if (isLogin()) {
        const token = window.localStorage.getItem('userToken');
        const user = localUsers.find(u => u.token === token);

        if (user) {
          if (user.role === 'admin') {
            return successResponseWrap({
              name: user.name,
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
              email: 'wangliqun@email.com',
              job: 'frontend',
              jobName: '前端艺术家',
              organization: 'Frontend',
              organizationName: '前端',
              location: 'beijing',
              locationName: '北京',
              introduction: '人潇洒，性温存',
              personalWebsite: 'https://www.arco.design',
              phone: '150****0000',
              registrationDate: '2013-05-10 12:10:00',
              accountId: '15012312300',
              certification: 1,
              role: user.role,
            });
          } else if (user.role === 'viewer') {
            // 查看用户
            return successResponseWrap({
              name: '查看用户',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
              email: 'viewer@email.com',
              job: 'viewer',
              jobName: '查看用户',
              organization: 'Viewer',
              organizationName: '查看部门',
              location: 'beijing',
              locationName: '北京',
              introduction: '查看用户账号，只能查看数据，不能修改',
              phone: '137****0000',
              registrationDate: '2024-03-01 12:00:00',
              accountId: '13712312300',
              certification: 1,
              role: user.role,
            });
          } else {
            // 普通用户
            const userInfoMap: Record<string, any> = {
              '54321': {
                name: '普通用户',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
                email: 'user@email.com',
                job: 'user',
                jobName: '普通用户',
                organization: 'User',
                organizationName: '用户部门',
                location: 'beijing',
                locationName: '北京',
                introduction: '普通用户账号，用于查看数据',
                phone: '138****0000',
                registrationDate: '2024-01-01 12:00:00',
                accountId: '13812312300',
              },
              '67890': {
                name: '测试用户',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
                email: 'user2@email.com',
                job: 'tester',
                jobName: '测试用户',
                organization: 'Test',
                organizationName: '测试部门',
                location: 'shanghai',
                locationName: '上海',
                introduction: '测试用户账号，用于测试功能',
                phone: '139****0000',
                registrationDate: '2024-02-01 12:00:00',
                accountId: '13912312300',
              }
            };

            const userInfo = userInfoMap[token] || userInfoMap['54321']; // 默认使用普通用户配置
            return successResponseWrap({
              ...userInfo,
              certification: 1,
              role: user.role,
            });
          }
        }
      }
      return failResponseWrap(null, '未登录', 50008);
    });

    // 登录
    Mock.mock(new RegExp('/api/user/login'), (params: MockParams) => {
      const { username, password } = JSON.parse(params.body);
      if (!username) {
        return failResponseWrap(null, '用户名不能为空', 50000);
      }
      if (!password) {
        return failResponseWrap(null, '密码不能为空', 50000);
      }

      // 检查本地用户列表
      const user = localUsers.find(u => u.username === username && u.password === password);
      if (user) {
        window.localStorage.setItem('userRole', user.role);
        window.localStorage.setItem('userToken', user.token);
        return successResponseWrap({
          token: user.token,
        });
      }

      return failResponseWrap(null, '账号或者密码错误', 50000);
    });

    // 登出
    Mock.mock(new RegExp('/api/user/logout'), () => {
      return successResponseWrap(null);
    });

    // 用户的服务端菜单
    Mock.mock(new RegExp('/api/user/menu'), () => {
      const menuList = [
        {
          path: '/dashboard',
          name: 'dashboard',
          meta: {
            locale: 'menu.server.dashboard',
            requiresAuth: true,
            icon: 'icon-dashboard',
            order: 1,
          },
          children: [
            {
              path: 'workplace',
              name: 'Workplace',
              meta: {
                locale: 'menu.server.workplace',
                requiresAuth: true,
              },
            },
            {
              path: 'https://arco.design',
              name: 'arcoWebsite',
              meta: {
                locale: 'menu.arcoWebsite',
                requiresAuth: true,
              },
            },
          ],
        },
      ];
      return successResponseWrap(menuList);
    });
  },
});
