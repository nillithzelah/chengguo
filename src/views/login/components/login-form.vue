<template>
  <div class="login-form-wrapper">
    <div class="login-form-title">{{ $t('login.form.title') }}</div>
    <!-- <div class="login-form-sub-title">{{ $t('login.form.title') }}</div> -->
    <div class="login-form-error-msg">{{ errorMessage }}</div>
    <a-form
      ref="loginForm"
      :model="userInfo"
      class="login-form"
      layout="vertical"
      @submit="handleSubmit"
    >
      <a-form-item
        field="username"
        :rules="[{ required: true, message: $t('login.form.userName.errMsg') }]"
        :validate-trigger="['change', 'blur']"
        hide-label
      >
        <a-input
          v-model="userInfo.username"
          :placeholder="$t('login.form.userName.placeholder')"
        >
          <template #prefix>
            <icon-user />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item
        field="password"
        :rules="[{ required: true, message: $t('login.form.password.errMsg') }]"
        :validate-trigger="['change', 'blur']"
        hide-label
      >
        <a-input-password
          v-model="userInfo.password"
          :placeholder="$t('login.form.password.placeholder')"
          allow-clear
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>
      <a-space :size="16" direction="vertical">
        <div class="login-form-password-actions">
          <a-checkbox
            checked="rememberPassword"
            :model-value="loginConfig.rememberPassword"
            @change="setRememberPassword as any"
          >
            {{ $t('login.form.rememberPassword') }}
          </a-checkbox>
        </div>
        <a-button type="primary" html-type="submit" long :loading="loading">
          {{ $t('login.form.login') }}
        </a-button>
      </a-space>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { useI18n } from 'vue-i18n';
  import { useStorage } from '@vueuse/core';
  import { useUserStore } from '@/store';
  import useLoading from '@/hooks/loading';
  import type { LoginData } from '@/api/user';
  import { webDeviceInfoCollector } from '@/utils/web-device-info';

  const router = useRouter();
  const { t } = useI18n();
  const errorMessage = ref('');
  const { loading, setLoading } = useLoading();
  const userStore = useUserStore();

  const loginConfig = useStorage('login-config', {
    rememberPassword: true,
    username: '', // 默认留空
    password: '', // 默认留空

  });
  const userInfo = reactive({
    username: loginConfig.value.username,
    password: loginConfig.value.password,
  });

  // 设备信息
  const deviceInfo = ref(null);

  // 组件挂载时收集设备信息
  onMounted(() => {
    try {
      deviceInfo.value = webDeviceInfoCollector.initialize();
      console.log('📱 登录页面设备信息收集成功:', {
        brand: deviceInfo.value?.deviceBrand,
        model: deviceInfo.value?.deviceModel,
        browser: deviceInfo.value?.browserName,
        os: deviceInfo.value?.osName
      });
    } catch (error) {
      console.error('❌ 设备信息收集失败:', error);
    }
  });

  const handleSubmit = async ({
    errors,
    values,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      try {
        console.log('开始登录...', values);

        // 准备登录数据，包含设备信息
        const loginData = {
          ...(values as LoginData),
          deviceInfo: deviceInfo.value
        };

        console.log('登录数据（包含设备信息）:', {
          username: loginData.username,
          deviceBrand: loginData.deviceInfo?.deviceBrand,
          deviceModel: loginData.deviceInfo?.deviceModel,
          browser: loginData.deviceInfo?.browserName,
          os: loginData.deviceInfo?.osName
        });

        await userStore.login(loginData);
        console.log('登录成功，准备跳转...');

        const { redirect, ...othersQuery } = router.currentRoute.value.query;
        console.log('跳转目标:', redirect || 'EcpmSimple');

        router.push({
          name: (redirect as string) || 'EcpmUser',
          query: {
            ...othersQuery,
          },
        });

        Message.success(t('login.form.login.success'));

        const { rememberPassword } = loginConfig.value;
        const { username, password } = values;
        // 实际生产环境需要进行加密存储。
        // The actual production environment requires encrypted storage.
        loginConfig.value.username = rememberPassword ? username : '';
        loginConfig.value.password = rememberPassword ? password : '';

        // 保存用户token用于区分不同用户
        // 等待登录完成，然后从localStorage获取token
        const token = window.localStorage.getItem('token');
        console.log('获取到的token:', token);
        if (token) {
          window.localStorage.setItem('userToken', token);
        }
      } catch (err) {
        console.error('登录失败:', err);
        errorMessage.value = (err as Error).message;
      } finally {
        setLoading(false);
      }
    }
  };
  const setRememberPassword = (value: boolean) => {
    loginConfig.value.rememberPassword = value;
  };

</script>

<style lang="less" scoped>
  .login-form {
    &-wrapper {
      width: 320px;
    }

    &-title {
      color: #ffffff;
      font-weight: 500;
      font-size: 24px;
      line-height: 32px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    &-sub-title {
      color: var(--color-text-3);
      font-size: 16px;
      line-height: 24px;
    }

    &-error-msg {
      height: 32px;
      color: rgb(var(--red-6));
      line-height: 32px;
    }

    &-password-actions {
      display: flex;
      justify-content: flex-start;
      color: #ffffff;

      :deep(.arco-checkbox-label) {
        color: #ffffff !important;
      }
    }

  }
</style>
