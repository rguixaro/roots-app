import React from 'react'
import { getBezierPath, ConnectionLineComponentProps } from 'reactflow'

import { ocean } from '@/styles/colors'

export const StyledEdge: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    curvature: 0.5,
  })

  return (
    <g>
      <path
        fill="none"
        d={path}
        stroke={ocean[200]}
        strokeWidth={3}
        strokeDasharray="8 4"
        style={connectionLineStyle}
      />
    </g>
  )
}
