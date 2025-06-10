'use client'

import { useState, useEffect, useRef } from 'react'

interface FlipDigitProps {
  digit: string
  isAnimating: boolean
}

const FlipDigit = ({ digit, isAnimating }: FlipDigitProps) => {
  const [currentDigit, setCurrentDigit] = useState(digit)
  const [nextDigit, setNextDigit] = useState(digit)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (digit !== currentDigit) {
      setNextDigit(digit)
      setIsFlipping(true)
      
      // 动画完成后更新当前数字
      const timer = setTimeout(() => {
        setCurrentDigit(digit)
        setIsFlipping(false)
      }, 300) // 300ms翻页动画

      return () => clearTimeout(timer)
    }
  }, [digit, currentDigit])

  return (
    <div className="relative inline-block w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-24 perspective-1000">
      {/* 背景卡片 - 统一的橙红渐变风格 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-xl shadow-2xl border-2 border-white/20">
        {/* 中间分割线 */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 z-10 shadow-sm"></div>

        {/* 上半部分背景 */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-orange-300/20 to-transparent rounded-t-xl"></div>

        {/* 下半部分背景 */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-pink-600/20 to-transparent rounded-b-xl"></div>

        {/* 当前数字 */}
        <div className={`absolute inset-0 flex items-center justify-center text-white font-black text-2xl md:text-3xl lg:text-4xl transition-transform duration-300 z-20 drop-shadow-lg ${
          isFlipping ? 'animate-flip-out' : isAnimating ? 'animate-glow-pulse' : ''
        }`} style={{ transformStyle: 'preserve-3d' }}>
          {currentDigit}
        </div>

        {/* 翻页数字 */}
        {isFlipping && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl md:text-3xl lg:text-4xl animate-flip-in animate-glow-pulse z-20 drop-shadow-lg" style={{ transformStyle: 'preserve-3d' }}>
            {nextDigit}
          </div>
        )}
      </div>

      {/* 高光效果 - 增强光泽感 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent rounded-xl pointer-events-none"></div>

      {/* 边缘阴影 - 柔和的内阴影 */}
      <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none" style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.1)' }}></div>

      {/* 外发光效果 */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: '0 0 20px rgba(251, 146, 60, 0.3)' }}></div>
    </div>
  )
}

interface FlipCounterProps {
  value: number
  isAnimating?: boolean
  className?: string
}

export const FlipCounter = ({ value, isAnimating = false, className = '' }: FlipCounterProps) => {
  const [digits, setDigits] = useState<string[]>(['0'])
  const prevValueRef = useRef(value)

  // 注入样式
  useFlipStyles()

  useEffect(() => {
    const valueStr = value.toString()
    const newDigits = valueStr.split('')
    
    // 确保至少有一位数字
    if (newDigits.length === 0) {
      newDigits.push('0')
    }
    
    setDigits(newDigits)
    prevValueRef.current = value
  }, [value])

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {digits.map((digit, index) => (
        <FlipDigit
          key={`${index}-${digits.length}`}
          digit={digit}
          isAnimating={isAnimating}
        />
      ))}
    </div>
  )
}

// 使用useEffect来注入样式
export const useFlipStyles = () => {
  useEffect(() => {
    const flipStyles = `
      .perspective-1000 {
        perspective: 1000px;
      }

      @keyframes flip-out {
        0% {
          transform: rotateX(0deg);
          transform-origin: center bottom;
        }
        100% {
          transform: rotateX(-90deg);
          transform-origin: center bottom;
        }
      }

      @keyframes flip-in {
        0% {
          transform: rotateX(90deg);
          transform-origin: center top;
        }
        100% {
          transform: rotateX(0deg);
          transform-origin: center top;
        }
      }

      .animate-flip-out {
        animation: flip-out 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform-style: preserve-3d;
      }

      .animate-flip-in {
        animation: flip-in 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform-style: preserve-3d;
      }

      /* 数字发光效果 */
      @keyframes glow-pulse {
        0%, 100% {
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.8), 0 0 10px rgba(255, 255, 255, 0.4);
        }
        50% {
          text-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(251, 146, 60, 0.4);
        }
      }

      .animate-glow-pulse {
        animation: glow-pulse 2s ease-in-out infinite;
      }

      /* 自定义动画 */
      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .animate-spin-slow {
        animation: spin-slow 8s linear infinite;
      }
    `

    // 检查是否已经注入过样式
    if (!document.querySelector('#flip-counter-styles')) {
      const styleElement = document.createElement('style')
      styleElement.id = 'flip-counter-styles'
      styleElement.textContent = flipStyles
      document.head.appendChild(styleElement)
    }
  }, [])
}
