export const ELASTIC_STACK = {
  dragThreshold: 6,

  falloff: 1.6,

  dragStrength: 0.72,
  velocityBoost: 0.22,

  maxElasticOffset: 72,

  globalScrollRatio: 0.7,

  velocitySmoothing: 0.25,

  momentumMultiplier: 0.22,
  maxMomentumDistance: 140,

  releaseSpring: {
    stiffness: 260,
    damping: 28,
  },

  momentumSpring: {
    stiffness: 180,
    damping: 30,
  },
} as const
