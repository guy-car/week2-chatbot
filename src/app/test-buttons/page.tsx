'use client'

import { buttonVariants } from '~/styles/component-styles'

export default function TestButtonsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Button Variants Test Page</h1>
        
        <div className="space-y-8">
          {/* Working Variant */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Working Chip Button</h2>
            <div className="flex flex-wrap gap-4">
              <button className={buttonVariants.new_chip_1}>
                New Chip Button - Minimal Style
              </button>
            </div>
          </div>

          {/* Comparison with Original */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Comparison</h2>
            <div className="flex flex-wrap gap-4">
              <button className={buttonVariants.chip}>
                Original Chip Style
              </button>
              <button className={buttonVariants.new_chip_1}>
                New Minimal Style
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">What We Achieved:</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• <strong>Clean Design:</strong> Removed all complex shadows and effects</li>
            <li>• <strong>Thin Border:</strong> Uses 0.5px border for crisp appearance</li>
            <li>• <strong>Gradient Background:</strong> Maintains the orange gradient effect</li>
            <li>• <strong>Reliable Rendering:</strong> No more browser compatibility issues</li>
            <li>• <strong>Simple Maintenance:</strong> Easy to modify and update</li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-blue-900 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Technical Details:</h3>
          <ul className="text-blue-200 space-y-2">
            <li>• <strong>CSS Class:</strong> <code>bg-new-chip-1</code></li>
            <li>• <strong>Border:</strong> <code>0.5px solid #ca7223</code></li>
            <li>• <strong>Background:</strong> Multi-layer gradient with orange fade</li>
            <li>• <strong>Border Radius:</strong> 11px for rounded corners</li>
            <li>• <strong>Hover Effect:</strong> Subtle lift and glow</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
