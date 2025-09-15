import localeMessageBox from '@/components/message-box/locale/zh-CN';
import localeLogin from '@/views/login/locale/zh-CN';

/** simple end */
import localeSettings from './zh-CN/settings';

export default {
  'menu.user': '管理中心',
  'menu.user.management': '用户管理',
  'menu.user.game.user': '用户游戏管理',
  'menu.user.game.admin': '游戏管理',
  'menu.ad': '广告数据',
  'menu.ad.ecpm.simple': '管理员ECPM数据管理',
  'menu.ad.ecpm.user': '用户ECPM数据查看',
  'menu.ad.pangle.test': '抖音Open SDK测试',
  'menu.ad.share.test': '抖音分享功能测试',
  'menu.ad.game.admin': '游戏管理',
  'menu.arcoWebsite': 'Arco Design',
  'menu.faq': '常见问题',
  'navbar.docs': '文档中心',
  'navbar.action.locale': '切换为中文',
  ...localeSettings,
  ...localeMessageBox,
  ...localeLogin,
};
