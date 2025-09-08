<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <div class="logo">
        <img
          alt="logo"
          src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/dfdba5317c0c20ce20e64fac803d52bc.svg~tplv-49unhts6dw-image.image"
        />
        <div class="logo-text">橙果宜牛</div>
      </div>
      <div class="register-form-title">注册账号</div>
      <div class="register-form-error-msg">{{ errorMessage }}</div>
      <a-form
        ref="registerForm"
        :model="userInfo"
        class="register-form"
        layout="vertical"
        @submit="handleSubmit"
      >
        <a-form-item
          field="username"
          :rules="[{ required: true, message: '用户名不能为空' }]"
          :validate-trigger="['change', 'blur']"
          hide-label
        >
          <a-input
            v-model="userInfo.username"
            placeholder="用户名"
          >
            <template #prefix>
              <icon-user />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          field="phone"
          :rules="[
            { required: true, message: '手机号不能为空' },
            {
              validator: (value: string) => {
                if (!value) return true;
                return /^1[3-9]\d{9}$/.test(value);
              },
              message: '手机号格式不正确'
            }
          ]"
          :validate-trigger="['change', 'blur']"
          hide-label
        >
          <a-input
            v-model="userInfo.phone"
            placeholder="手机号"
          >
            <template #prefix>
              <icon-phone />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          field="smsCode"
          :rules="[
            { required: true, message: '验证码不能为空' },
            {
              validator: (value: string) => {
                if (!value) return true;
                return /^\d{6}$/.test(value);
              },
              message: '验证码为6位数字'
            }
          ]"
          :validate-trigger="['change', 'blur']"
          hide-label
        >
          <a-input-group>
            <a-input
              v-model="userInfo.smsCode"
              placeholder="验证码"
              style="flex: 1;"
            >
              <template #prefix>
                <icon-safe />
              </template>
            </a-input>
            <a-button
              type="primary"
              :disabled="countdown > 0"
              @click="sendSmsCode"
              style="width: 120px;"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item
          field="password"
          :rules="[
            { required: true, message: '密码不能为空' },
            { minLength: 6, message: '密码至少6位' }
          ]"
          :validate-trigger="['change', 'blur']"
          hide-label
        >
          <a-input-password
            v-model="userInfo.password"
            placeholder="密码"
            allow-clear
          >
            <template #prefix>
              <icon-lock />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item
          field="confirmPassword"
          :rules="[
            { required: true, message: '请确认密码' },
            {
              validator: validateConfirmPassword
            }
          ]"
          :validate-trigger="['change', 'blur']"
          hide-label
        >
          <a-input-password
            v-model="userInfo.confirmPassword"
            placeholder="确认密码"
            allow-clear
          >
            <template #prefix>
              <icon-lock />
            </template>
          </a-input-password>
        </a-form-item>
        <a-space :size="16" direction="vertical">
          <a-button type="primary" html-type="submit" long :loading="loading">
            注册
          </a-button>
          <a-button type="text" long @click="goToLogin" class="register-form-login-btn">
            返回登录
          </a-button>
        </a-space>
      </a-form>
    </div>
    <div class="footer">
      <Footer />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import Footer from '@/components/footer/index.vue';

  const router = useRouter();
  const errorMessage = ref('');
  const loading = ref(false);
  const countdown = ref(0);
  let countdownTimer: NodeJS.Timeout | null = null;

  const userInfo = reactive({
    username: '',
    phone: '',
    smsCode: '',
    password: '',
    confirmPassword: '',
  });

  const validateConfirmPassword = (value: string, callback: (error?: string) => void) => {
    if (value !== userInfo.password) {
      callback('两次输入的密码不一致');
    } else {
      callback();
    }
  };

  const handleSubmit = async ({
    errors,
    values,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      loading.value = true;
      try {
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(values.phone)) {
          throw new Error('手机号格式不正确');
        }


        // 验证短信验证码格式
        if (!/^\d{6}$/.test(values.smsCode)) {
          throw new Error('短信验证码格式不正确');
        }

        // 这里应该调用注册API
        // const response = await userStore.register(values);
        console.log('注册信息:', values);
        Message.success('注册成功！请登录');
        router.push('/login-form');
      } catch (err) {
        errorMessage.value = (err as Error).message;
      } finally {
        loading.value = false;
      }
    }
  };

  const sendSmsCode = async () => {
    if (!userInfo.phone) {
      Message.warning('请先输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(userInfo.phone)) {
      Message.warning('手机号格式不正确');
      return;
    }

    try {
      // 这里应该调用发送验证码的API
      // const response = await api.sendSmsCode(userInfo.phone);
      console.log('发送验证码到:', userInfo.phone);

      Message.success('验证码已发送');

      // 开始倒计时
      countdown.value = 60;
      countdownTimer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
        }
      }, 1000);
    } catch (error) {
      Message.error('发送验证码失败，请重试');
    }
  };


  const goToLogin = () => {
    router.push('/login-form');
  };

  onMounted(() => {
    // 初始化逻辑
  });

  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });
</script>

<style lang="less" scoped>
  .register-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(163.85deg, #1d2129 0%, #00308f 100%);

    .register-form-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      margin-bottom: 40px;

      &-text {
        margin-left: 8px;
        color: var(--color-fill-1);
        font-size: 24px;
        font-weight: 500;
      }
    }

    .register-form-title {
      color: #ffffff;
      font-weight: 500;
      font-size: 24px;
      line-height: 32px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      margin-bottom: 24px;
    }

    .register-form-error-msg {
      height: 32px;
      color: rgb(var(--red-6));
      line-height: 32px;
      margin-bottom: 16px;
    }

    .register-form {
      width: 320px;
    }

    .register-form-login-btn {
      color: #ffffff !important;
    }


    .footer {
      margin-top: auto;
    }
  }
</style>