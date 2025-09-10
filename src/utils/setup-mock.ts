import debug from './env';

export default ({ mock, setup }: { mock?: boolean; setup: () => void }) => {
  // 在开发环境中，如果明确设置为不使用mock，或者有后端服务器运行，则不启用mock
  const shouldUseMock = mock !== false && debug && process.env.VITE_USE_MOCK !== 'false';

  if (shouldUseMock) {
    setup();
  }
};

export const successResponseWrap = (data: unknown) => {
  return {
    data,
    status: 'ok',
    msg: '请求成功',
    code: 20000,
  };
};

export const failResponseWrap = (data: unknown, msg: string, code = 50000) => {
  return {
    data,
    status: 'fail',
    msg,
    code,
  };
};
