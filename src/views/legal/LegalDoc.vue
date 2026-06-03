<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const loading = ref(true)
const content = ref('')

// 模拟从后台获取富文本内容的接口
const fetchLegalContent = async (type: string) => {
  loading.value = true
  // 模拟接口请求延迟
  await new Promise(resolve => setTimeout(resolve, 600))

  // 占位富文本数据，后期由后台CMS系统直接返回
  if (type === 'terms') {
    content.value = `
      <h1 style="text-align: center; margin-bottom: 24px;">Terms of Service (服务条款)</h1>
      <p style="text-align: center; color: #6b7280; margin-bottom: 40px;"><strong>生效日期：</strong> 2024年01月01日</p>
      
      <h2>1. 接受条款</h2>
      <p>欢迎使用我们的服务。通过访问或使用本网站，即表示您同意受本服务条款的约束。此内容后续将通过后台富文本编辑器进行动态配置和统一管理下发，方便法务或运营随时修改而无需发版。</p>
      
      <h2>2. 用户行为规范</h2>
      <p>您同意不利用本服务从事任何违法、违规或侵犯第三方权益的行为。系统管理员保留对违反规范的用户进行封禁的权利。</p>
      
      <h2>3. 免责声明</h2>
      <p>本服务按“现状”提供，我们不对服务的绝对稳定性、安全性及无错误做出任何明示或暗示的保证。</p>
      
      <h2>4. 协议修改</h2>
      <p>我们保留随时修改本服务条款的权利。修改后的条款一经在此页面发布即刻生效。</p>
    `
  } else if (type === 'privacy') {
    content.value = `
      <h1 style="text-align: center; margin-bottom: 24px;">Privacy Policy (隐私政策)</h1>
      <p style="text-align: center; color: #6b7280; margin-bottom: 40px;"><strong>更新日期：</strong> 2024年01月01日</p>
      
      <h2>1. 信息收集</h2>
      <p>我们非常重视您的隐私。为了提供更好的服务，我们可能会收集您的基本注册信息、设备信息以及使用数据。此页面结构已做好动态数据对接准备，后续文本由后台系统直接下发。</p>
      
      <h2>2. 信息使用</h2>
      <p>收集的信息将仅用于向您提供、维护和改进我们的服务，我们承诺不会在未获明确授权的情况下，向第三方出售或非法披露您的个人核心数据。</p>
      
      <h2>3. 数据安全</h2>
      <p>我们采用业界标准的安全技术、加密协议和严格的管理制度措施来保护您的个人数据免遭泄露、篡改或丢失。</p>
      
      <h2>4. 用户权利</h2>
      <p>您有权随时访问、更正或要求删除您的个人数据。如需行使这些权利，请通过官方支持邮箱联系我们。</p>
    `
  } else {
    content.value = `<h1 style="text-align: center; margin-top: 100px; color: #9ca3af;">未找到相关协议文档</h1>`
  }

  loading.value = false
}

// 监听路由参数变化，重新获取内容（支持在不同协议间直接切换）
watch(
  () => route.params.type,
  newType => {
    if (newType) {
      fetchLegalContent(newType as string)
    }
  },
  { immediate: true } // 立即执行一次
)
</script>

<template>
  <div class="legal-page">
    <div v-loading="loading" class="legal-container">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="rich-text-wrapper" v-html="content"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.legal-page {
  min-height: 100vh;
  padding: clamp(20px, 4vw, 40px) var(--layout-padding);
  background-image: url('/src/assets/images/legal/legal_backgroud.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;

  .legal-container {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-white);
    padding: clamp(24px, 4vw, 48px) clamp(20px, 5vw, 64px);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    min-height: 600px;

    /* 富文本内容基础样式约束 */
    .rich-text-wrapper {
      line-height: 1.8;
      color: var(--t-regular);
      font-size: var(--font-size-base);

      :deep(h1),
      :deep(h2),
      :deep(h3) {
        color: var(--t-primary);
        margin-top: 1.8em;
        margin-bottom: 0.8em;
        font-weight: 700;
      }

      :deep(h2) {
        font-size: 20px;
        border-bottom: 1px solid var(--border-base);
        padding-bottom: 8px;
      }

      :deep(p) {
        margin-bottom: 1.2em;
        text-align: justify;
      }
    }
  }
}
</style>
