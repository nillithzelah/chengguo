import md5 from 'crypto-js/md5';

/**
 * 对参数进行签名
 * @param params 请求参数
 * @param secretKey 签名密钥
 * @returns 签名后的参数字符串
 */
export function signRequest(params: Record<string, any>, secretKey: string): string {
  // 1. 过滤掉空值参数
  const filteredParams: Record<string, string> = {};
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      filteredParams[key] = String(params[key]);
    }
  });

  // 2. 按参数名排序
  const sortedKeys = Object.keys(filteredParams).sort();
  
  // 3. 拼接参数字符串
  let signStr = '';
  sortedKeys.forEach((key, index) => {
    if (index > 0) {
      signStr += '&';
    }
    signStr += `${key}=${encodeURIComponent(filteredParams[key])}`;
  });

  // 4. 添加密钥并生成MD5
  const sign = md5(signStr + secretKey).toString().toLowerCase();
  
  // 5. 返回带签名的参数字符串
  return `${signStr}&sign=${sign}`;
}

/**
 * 验证签名
 * @param params 请求参数
 * @param secretKey 签名密钥
 * @param sign 待验证的签名
 * @returns 是否验证通过
 */
export function verifySignature(params: Record<string, any>, secretKey: string, sign: string): boolean {
  // 复制参数，避免修改原对象
  const paramsCopy = { ...params };
  
  // 移除签名参数
  delete paramsCopy.sign;
  
  // 生成签名
  const generatedSign = signRequest(paramsCopy, secretKey).split('sign=')[1];
  
  // 比较签名
  return generatedSign === sign.toLowerCase();
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateNonce(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 获取当前时间戳（秒）
 * @returns 当前时间戳（秒）
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 格式化时间为YYYY-MM-DD HH:mm:ss格式
 * @param date 日期对象
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
