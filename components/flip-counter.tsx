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
      {/* 背景卡片 */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 rounded-lg shadow-2xl border border-gray-700">
        {/* 中间分割线 */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600 z-10 shadow-sm"></div>

        {/* 上半部分背景 */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-750 to-gray-800 rounded-t-lg"></div>

        {/* 下半部分背景 */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-850 to-gray-900 rounded-b-lg"></div>

        {/* 当前数字 */}
        <div className={`absolute inset-0 flex items-center justify-center text-white font-black text-2xl md:text-3xl lg:text-4xl transition-transform duration-300 z-20 ${
          isFlipping ? 'animate-flip-out' : ''
        }`} style={{ transformStyle: 'preserve-3d' }}>
          {currentDigit}
        </div>

        {/* 翻页数字 */}
        {isFlipping && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl md:text-3xl lg:text-4xl animate-flip-in z-20" style={{ transformStyle: 'preserve-3d' }}>
            {nextDigit}
          </div>
        )}
      </div>

      {/* 高光效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg pointer-events-none"></div>

      {/* 边缘阴影 */}
      <div className="absolute inset-0 rounded-lg shadow-inner pointer-events-none" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}></div>
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

      /* 自定义灰色 */
      .bg-gray-750 {
        background-color: rgb(55, 65, 81);
      }

      .bg-gray-850 {
        background-color: rgb(31, 41, 55);
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
