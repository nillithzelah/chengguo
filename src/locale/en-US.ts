import localeMessageBox from '@/components/message-box/locale/en-US';
import localeLogin from '@/views/login/locale/en-US';

/** simple end */
import localeSettings from './en-US/settings';

export default {
  'menu.user': 'User Center',
  'menu.ad': 'Ad Data',
  'menu.ad.ecpm.simple': 'Admin ECPM Data Management',
  'menu.ad.ecpm.user': 'User ECPM Data View',
  'menu.ad.oceanengine.qr': 'OceanEngine Ad QR Code',
  'menu.ad.pangle.test': 'Douyin Open SDK Test',
  'menu.ad.share.test': 'Douyin Share Function Test',
  'menu.ad.game.admin': 'Game Management',
  'menu.arcoWebsite': 'Arco Design',
  'menu.faq': 'FAQ',
  'navbar.docs': 'Docs',
  'navbar.action.locale': 'Switch to English',
  ...localeSettings,
  ...localeMessageBox,
  ...localeLogin,
};
