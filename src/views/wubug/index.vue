<template>
  <div class="container">
    <div class="logo">
      <img
        alt="logo"
        src="//p3-armor.byteimg.com/tos-cn-i-49unhts6dw/dfdba5317c0c20ce20e64fac803d52bc.svg~tplv-49unhts6dw-image.image"
      />
    </div>
    <div class="login-button">
      <a-button type="primary" @click="goToLogin">登录</a-button>
    </div>
    <div class="home-content">
      <div class="welcome-section">
        <h1 class="welcome-title">欢迎使用武霸哥</h1>
        <p class="welcome-subtitle">您的智能数据管理平台</p>
        <div class="current-time">
          <div class="time-display">{{ currentTime }}</div>
          <div class="date-display">{{ currentDate }}</div>
        </div>
      </div>
      <div class="features-section">
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-text">数据分析</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <div class="feature-text">广告监控</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔍</div>
          <div class="feature-text">智能搜索</div>
        </div>
      </div>
      <div class="game-login-section">
        <div class="game-item" @click="goToGameLogin">
          <div class="game-icon">🎮</div>
          <div class="game-text">游戏展示</div>
        </div>
      </div>
    </div>
    <!-- <LoginBanner /> -->
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const currentTime = ref('');
  const currentDate = ref('');
  let timer: NodeJS.Timeout | null = null;

  const updateTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    currentDate.value = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const goToLogin = () => {
    router.push('/wubug/login-form');
  };

  const goToGameLogin = () => {
    const currentDomain = window.location.hostname;
    const gameUrl = currentDomain.includes('wubug') ? '/games/?from=wubug' : 'https://m.game985.vip/';
    window.open(gameUrl, '_blank');
  };

  onMounted(() => {
    updateTime();
    timer = setInterval(updateTime, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });
</script>

<style lang="less" scoped>
  .container {
    position: relative;
    height: 100vh;
    width: 100vw;
    background: linear-gradient(163.85deg, #1d2129 0%, #00308f 100%);

    .login-button {
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 10;
    }
  }

  .logo {
    position: absolute;
    top: 24px;
    left: 22px;
    z-index: 10;
    display: inline-flex;
    align-items: center;

    &-text {
      margin-right: 4px;
      margin-left: 4px;
      color: var(--color-fill-1);
      font-size: 20px;
    }
  }

  .home-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 5;
    max-width: 800px;
    width: 100%;
    padding: 0 20px;
  }

  .welcome-section {
    margin-bottom: 60px;
  }

  .welcome-title {
    color: #ffffff;
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
  }

  .welcome-subtitle {
    color: #ffffff;
    font-size: 20px;
    margin: 0 0 40px 0;
    opacity: 0.9;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .current-time {
    margin-bottom: 20px;
  }

  .time-display {
    color: #ffffff;
    font-size: 36px;
    font-weight: 300;
    margin-bottom: 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .date-display {
    color: #ffffff;
    font-size: 18px;
    opacity: 0.8;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .features-section {
    display: flex;
    justify-content: center;
    gap: 60px;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }

  .game-login-section {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .game-item {
    text-align: center;
    color: #ffffff;
    opacity: 0.9;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: 120px;

    &:hover {
      opacity: 1;
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .game-icon {
    font-size: 48px;
    margin-bottom: 12px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .game-text {
    font-size: 16px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .feature-item {
    text-align: center;
    color: #ffffff;
    opacity: 0.9;
  }

  .feature-icon {
    font-size: 48px;
    margin-bottom: 12px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .feature-text {
    font-size: 16px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
</style>

<style lang="less" scoped>
  // responsive
  @media (max-width: 768px) {
    .welcome-title {
      font-size: 32px;
    }

    .welcome-subtitle {
      font-size: 16px;
    }

    .time-display {
      font-size: 28px;
    }

    .features-section {
      gap: 30px;
    }

    .feature-icon {
      font-size: 36px;
    }
  }

  @media (max-width: 480px) {
    .welcome-title {
      font-size: 28px;
    }

    .features-section {
      gap: 20px;
    }

    .feature-item {
      flex: 1;
      min-width: 80px;
    }
  }
</style>