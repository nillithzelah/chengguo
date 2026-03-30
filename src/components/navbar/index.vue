<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <img
          alt="logo"
          src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/dfdba5317c0c20ce20e64fac803d52bc.svg~tplv-49unhts6dw-image.image"
        />
        <a-typography-title
          :style="{ margin: 0, fontSize: '18px' }"
          :heading="5"
        >
          {{ brandName }}
        </a-typography-title>
        <icon-menu-fold
          v-if="!topMenu && appStore.device === 'mobile'"
          style="font-size: 22px; cursor: pointer"
          @click="toggleDrawerMenu"
        />
      </a-space>
    </div>
    <div class="center-side">
      <Menu v-if="topMenu" />
    </div>
    <ul class="right-side">
      <li>
        <a-tooltip
          :content="
            theme === 'light'
              ? $t('settings.navbar.theme.toDark')
              : $t('settings.navbar.theme.toLight')
          "
        >
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="handleToggleTheme"
          >
            <template #icon>
              <icon-moon-fill v-if="theme === 'dark'" />
              <icon-sun-fill v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip
          :content="
            isFullscreen
              ? $t('settings.navbar.screen.toExit')
              : $t('settings.navbar.screen.toFull')
          "
        >
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="toggleFullScreen"
          >
            <template #icon>
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-dropdown trigger="click">
          <a-space align="center" :style="{ cursor: 'pointer' }">
            <a-avatar :size="32">
              <img alt="avatar" :src="avatar" />
            </a-avatar>
            <span class="user-name">{{ userStore.name || userStore.userInfo?.name || '用户' }}</span>
          </a-space>
          <template #content>
            <a-doption @click="showChangePasswordModal = true">
              <a-space>
                <icon-lock />
                <span>{{ $t('messageBox.changePassword') }}</span>
              </a-space>
            </a-doption>
            <a-doption>
              <a-space @click="handleLogout">
                <icon-export />
                <span>{{ $t('messageBox.logout') }}</span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
    </ul>
  </div>

  <!-- 修改密码模态框 -->
  <a-modal
    v-model:visible="showChangePasswordModal"
    :title="$t('messageBox.changePassword')"
    @ok="handleChangePassword"
    @cancel="handleCancelChangePassword"
    :confirm-loading="changePasswordLoading"
    width="400px"
  >
    <a-form
      :model="passwordForm"
      :rules="passwordRules"
      layout="vertical"
      ref="passwordFormRef"
    >
      <a-form-item field="oldPassword" :label="$t('messageBox.oldPassword')">
        <a-input-password
          v-model="passwordForm.oldPassword"
          :placeholder="$t('messageBox.oldPasswordPlaceholder')"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="newPassword" :label="$t('messageBox.newPassword')">
        <a-input-password
          v-model="passwordForm.newPassword"
          :placeholder="$t('messageBox.newPasswordPlaceholder')"
          allow-clear
        />
      </a-form-item>
      <a-form-item field="confirmPassword" :label="$t('messageBox.confirmPassword')">
        <a-input-password
          v-model="passwordForm.confirmPassword"
          :placeholder="$t('messageBox.confirmPasswordPlaceholder')"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { computed, ref, inject, reactive } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useDark, useToggle, useFullscreen } from '@vueuse/core';
  import { useAppStore, useUserStore } from '@/store';
  import useUser from '@/hooks/user';
  import { changePassword } from '@/api/user';
  import Menu from '@/components/menu/index.vue';

  const appStore = useAppStore();
  const userStore = useUserStore();
  const { logout } = useUser();
  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();

  // 修改密码相关
  const showChangePasswordModal = ref(false);
  const changePasswordLoading = ref(false);
  const passwordFormRef = ref();
  const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const passwordRules = {
    oldPassword: [
      { required: true, message: '请输入旧密码' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码' },
      { minLength: 6, message: '新密码长度不能少于6位' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码' },
      {
        validator: (value: string, cb: any) => {
          if (value !== passwordForm.newPassword) {
            cb('两次输入的密码不一致');
          } else {
            cb();
          }
        }
      }
    ]
  };

  const handleChangePassword = async () => {
    try {
      const valid = await passwordFormRef.value.validate();
      if (!valid) {
        changePasswordLoading.value = true;
        await changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        });
        Message.success('密码修改成功，请重新登录');
        changePasswordLoading.value = false;
        showChangePasswordModal.value = false;
        // 重置表单
        passwordForm.oldPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
        // 退出登录
        setTimeout(() => {
          logout();
        }, 1000);
      }
    } catch (error: any) {
      changePasswordLoading.value = false;
      // 显示后端返回的错误消息
      const errorMessage = error.response?.data?.message || error.message || '密码修改失败，请检查旧密码是否正确';
      Message.error(errorMessage);
    }
  };

  const handleCancelChangePassword = () => {
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordFormRef.value?.clearValidate();
  };

  const avatar = computed(() => {
    return userStore.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userStore.userInfo?.accountId || 'default'}`;
  });
  const theme = computed(() => {
    return appStore.theme;
  });
  const topMenu = computed(() => appStore.topMenu && appStore.menu);
  const brandName = computed(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'www.wubug.cc') {
      return '武霸哥';
    }
    return '橙果宜牛';
  });
  const isDark = useDark({
    selector: 'body',
    attribute: 'arco-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'arco-theme',
    onChanged(dark: boolean) {
      // overridden default behavior
      appStore.toggleTheme(dark);
    },
  });
  const toggleTheme = useToggle(isDark);
  const handleToggleTheme = () => {
    toggleTheme();
  };
  const handleLogout = () => {
    logout();
  };
  const toggleDrawerMenu = inject('toggleDrawerMenu') as () => void;
</script>

<style scoped lang="less">
  .navbar {
    display: flex;
    justify-content: space-between;
    height: 100%;
    background-color: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border);
  }

  .left-side {
    display: flex;
    align-items: center;
    padding-left: 20px;
  }

  .center-side {
    flex: 1;
  }

  .right-side {
    display: flex;
    padding-right: 20px;
    list-style: none;
    :deep(.locale-select) {
      border-radius: 20px;
    }
    li {
      display: flex;
      align-items: center;
      padding: 0 10px;
    }

    a {
      color: var(--color-text-1);
      text-decoration: none;
    }
    .nav-btn {
      border-color: rgb(var(--gray-2));
      color: rgb(var(--gray-8));
      font-size: 16px;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-1);
      margin-left: 8px;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>

