'use client'

import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="flex inset-0 h-full w-full items-center justify-center bg-transparent">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />
    </div>
  )
})

interface SplineWrapperProps {
  scene: string
  className?: string
}

export default function SplineWrapper({ scene, className }: SplineWrapperProps) {
  return (
    <Spline scene={scene} className={className} />
  )
}
