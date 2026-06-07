<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">🕯️</div>
        <div class="logo-text">
          <h1>香薰蜡烛</h1>
          <p>定制与配方管理</p>
        </div>
      </div>
      <nav class="nav">
        <router-link
          v-for="route in navRoutes"
          :key="route.path"
          :to="route.path"
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">{{ route.meta.icon }}</span>
          <span class="nav-label">{{ route.meta.title }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <p>手工香薰 · 匠心制作</p>
      </div>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <h2 class="page-title">{{ currentTitle }}</h2>
        <div class="user-info">
          <span class="user-avatar">👩‍🔬</span>
          <span>调香师工作台</span>
        </div>
      </header>
      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navRoutes = computed(() =>
  router.options.routes
    .filter((r) => r.meta && r.meta.title)
    .map((r) => ({
      path: r.path,
      meta: r.meta as { title: string; icon: string },
    })),
);

const currentTitle = computed(() => {
  const matched = navRoutes.value.find((r) => r.path === route.path);
  return matched ? `${matched.meta.icon} ${matched.meta.title}` : '';
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, var(--primary-dark) 0%, var(--primary) 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
}

.logo {
  padding: 28px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 36px;
}

.logo-text h1 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 2px;
}

.logo-text p {
  font-size: 12px;
  opacity: 0.7;
}

.nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 64px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-light);
  font-size: 14px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--bg-warm);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.content-area {
  flex: 1;
  padding: 28px 32px;
}
</style>
