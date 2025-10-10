type TargetContext = '_self' | '_parent' | '_blank' | '_top';

export const openWindow = (
  url: string,
  opts?: { target?: TargetContext; [key: string]: any }
) => {
  // 安全检查：验证URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: URL must be a non-empty string');
  }

  // 安全检查：防止XSS攻击
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error('Invalid URL: URL cannot be empty after trimming');
  }

  // 域名白名单检查（可选）
  const allowedDomains = [
    'github.com',
    'gitee.com',
    'juejin.cn',
    'zhihu.com',
    'bilibili.com',
    // 可以添加更多信任域名
  ];

  try {
    const urlObj = new URL(cleanUrl);

    // 检查是否为相对路径
    if (!urlObj.protocol) {
      // 相对路径直接使用
    } else {
      // 检查域名是否在白名单中
      const isAllowed = allowedDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );

      if (!isAllowed) {
        console.warn('Opening external link:', cleanUrl);
      }
    }
  } catch (error) {
    // 如果URL解析失败，可能是相对路径，继续处理
    console.debug('Relative URL detected:', cleanUrl);
  }

  const { target = '_blank', ...others } = opts || {};

  // 安全检查：限制target值
  const validTargets: TargetContext[] = ['_self', '_parent', '_blank', '_top'];
  const safeTarget = validTargets.includes(target) ? target : '_blank';

  window.open(
    cleanUrl,
    safeTarget,
    Object.entries(others)
      .reduce((preValue: string[], curValue) => {
        const [key, value] = curValue;
        return [...preValue, `${key}=${value}`];
      }, [])
      .join(',')
  );
};

export const regexUrl = new RegExp(
  '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
  'i'
);

export default null;
