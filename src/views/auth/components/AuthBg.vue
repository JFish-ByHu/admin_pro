<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMouseInElement } from '@vueuse/core'

const props = defineProps<{
  isBlind?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const shape1Ref = ref<HTMLElement | null>(null)
const shape2Ref = ref<HTMLElement | null>(null)

// 鼠标位置跟踪
const { elementX, elementY, elementWidth, elementHeight } = useMouseInElement(containerRef)
// 单独检测鼠标是否悬停在图形上（用于惊恐状态）
const { isOutside: isOutsideShape1 } = useMouseInElement(shape1Ref)
const { isOutside: isOutsideShape2 } = useMouseInElement(shape2Ref)

// 计算眼球跟随逻辑
const mousePos = computed(() => {
  if (props.isBlind || elementWidth.value === 0 || elementHeight.value === 0) {
    return { x: 0, y: 0 }
  }

  const x = elementX.value / elementWidth.value
  const y = elementY.value / elementHeight.value

  return {
    x: (x - 0.5) * 30,
    y: (y - 0.5) * 30
  }
})

const isBlinking = ref(false)
let blinkTimer: number

const scheduleNextBlink = () => {
  // 随机 2~6 秒眨眼一次
  const nextBlinkDelay = 2000 + Math.random() * 4000
  blinkTimer = window.setTimeout(() => {
    // 只有在非密码输入(没被强制闭眼)时才执行眨眼动画
    if (!props.isBlind) {
      isBlinking.value = true
      // 眨眼持续 150ms 后睁开
      setTimeout(() => {
        isBlinking.value = false
      }, 150)
    }
    scheduleNextBlink()
  }, nextBlinkDelay)
}

onMounted(() => {
  scheduleNextBlink()
})

onUnmounted(() => {
  clearTimeout(blinkTimer)
})
</script>

<template>
  <div ref="containerRef" class="abstract-bg">
    <!-- 左上角蓝紫块 -->
    <div ref="shape1Ref" class="shape shape-1">
      <div class="face face-top" :class="{ 'is-surprised': !isOutsideShape1, 'is-blind': isBlind }">
        <div class="eyes-container">
          <div class="eye">
            <div
              class="pupil"
              :style="{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }"
            ></div>
            <div class="eyelid-top" :class="{ 'is-closed': isBlind || isBlinking }"></div>
            <div class="eyelid-bottom" :class="{ 'is-closed': isBlind || isBlinking }"></div>
          </div>
          <div class="eye">
            <div
              class="pupil"
              :style="{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }"
            ></div>
            <div class="eyelid-top" :class="{ 'is-closed': isBlind || isBlinking }"></div>
            <div class="eyelid-bottom" :class="{ 'is-closed': isBlind || isBlinking }"></div>
          </div>
        </div>
        <!-- 弧形嘴巴 -->
        <div class="mouth"></div>
      </div>
    </div>

    <!-- 右下角浅蓝半圆 -->
    <div ref="shape2Ref" class="shape shape-2">
      <div
        class="face face-bottom"
        :class="{ 'is-surprised': !isOutsideShape2, 'is-blind': isBlind }"
      >
        <div class="eyes-container">
          <div class="eye">
            <div
              class="pupil"
              :style="{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }"
            ></div>
            <div class="eyelid-top" :class="{ 'is-closed': isBlind || isBlinking }"></div>
            <div class="eyelid-bottom" :class="{ 'is-closed': isBlind || isBlinking }"></div>
          </div>
          <div class="eye">
            <div
              class="pupil"
              :style="{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }"
            ></div>
            <div class="eyelid-top" :class="{ 'is-closed': isBlind || isBlinking }"></div>
            <div class="eyelid-bottom" :class="{ 'is-closed': isBlind || isBlinking }"></div>
          </div>
        </div>
        <!-- 弧形嘴巴 -->
        <div class="mouth"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.abstract-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  .shape {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 顶部蓝紫圆角块 */
  .shape-1 {
    top: 0;
    left: 0;
    width: 50%;
    height: 40%;
    background: linear-gradient(135deg, var(--c-primary-light) 0%, var(--c-primary) 100%);
    box-shadow: 10px 10px 40px rgba(37, 99, 235, 0.2);
    border-bottom-right-radius: 50%;
    animation: breathe 5s ease-in-out infinite alternate;
    --eyelid-color: var(--c-primary);
  }

  /* 底部浅蓝半圆 */
  .shape-2 {
    bottom: 0;
    right: 0;
    width: 60%;
    height: 60%;
    background: linear-gradient(135deg, var(--c-primary-lighter) 0%, var(--c-primary-light) 100%);
    box-shadow: -10px -10px 40px rgba(59, 130, 246, 0.2);
    border-top-left-radius: 100%;
    animation: breathe 6s ease-in-out infinite alternate-reverse;
    --eyelid-color: var(--c-primary-light);
  }

  /* 呼吸律动动画 - 增强幅度 */
  @keyframes breathe {
    0% {
      transform: scale(1) translate(0, 0);
    }
    100% {
      transform: scale(1.05) translate(2%, 3%);
    }
  }

  /* 脸部容器（包含眼睛和嘴巴） */
  .face {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.face-top {
      transform: translate(-10%, -10%);
    }

    &.face-bottom {
      transform: translate(10%, 10%);
    }

    &.is-surprised {
      .eye {
        transform: scale(1.1);
        box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
      }
      .pupil {
        transform: scale(0.6) !important;
        transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .mouth {
        width: 20px;
        height: 20px;
        border: 4px solid var(--bg-dark);
        border-radius: 50%;
        margin-top: 14px;
      }
    }

    &.is-blind {
      .mouth {
        width: 24px;
        height: 0;
        border: 0;
        border-bottom: 4px solid var(--bg-dark);
        border-radius: var(--radius-xs);
        margin-top: 22px;
      }
    }
  }

  /* 眼睛容器 */
  .eyes-container {
    display: flex;
    gap: clamp(10px, 2vw, 20px);
  }

  /* 嘴巴 */
  .mouth {
    width: 36px;
    height: 18px;
    border: 4px solid var(--bg-dark);
    border-top: 0;
    border-radius: 0 0 36px 36px;
    margin-top: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 眼睛白底 */
  .eye {
    width: clamp(50px, 7vw, 80px);
    height: clamp(50px, 7vw, 80px);
    background-color: #ffffff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 上下眼皮 */
    .eyelid-top,
    .eyelid-bottom {
      position: absolute;
      left: 0;
      width: 100%;
      height: 50%;
      z-index: 10;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-closed {
        transform: translateY(0);
      }
    }

    /* 睁眼状态（默认）：眼皮分别藏在上下方 */
    .eyelid-top {
      top: 0;
      transform: translateY(-100%);
      background-color: var(--eyelid-color);
      border-bottom: 2px solid var(--bg-dark);
    }

    .eyelid-bottom {
      bottom: 0;
      transform: translateY(100%);
      background-color: var(--eyelid-color);
      border-top: 2px solid var(--bg-dark);
    }

    /* 眼球黑点 */
    .pupil {
      width: clamp(18px, 2.5vw, 30px);
      height: clamp(18px, 2.5vw, 30px);
      background-color: #111827;
      border-radius: 50%;
      transition:
        transform 0.1s ease-out,
        opacity 0.2s ease;
      box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.5);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 5px;
        left: 5px;
        width: 8px;
        height: 8px;
        background-color: #ffffff;
        border-radius: 50%;
      }
    }
  }
}
</style>
