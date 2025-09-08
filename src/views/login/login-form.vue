<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="logo">
        <img
          alt="logo"
          src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/dfdba5317c0c20ce20e64fac803d52bc.svg~tplv-49unhts6dw-image.image"
        />
        <div class="logo-text">橙果宜牛</div>
      </div>
      <LoginForm />
    </div>
    <div class="footer">
      <Footer />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import Footer from '@/components/footer/index.vue';
  import LoginForm from './components/login-form.vue';
</script>

<style lang="less" scoped>
  .login-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(163.85deg, #1d2129 0%, #00308f 100%);

    .login-form-wrapper {
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

    .footer {
      margin-top: auto;
    }
  }
</style>