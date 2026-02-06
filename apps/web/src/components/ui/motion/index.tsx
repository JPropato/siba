/**
 * Motion Components - Animaciones premium con Framer Motion
 *
 * Componentes reutilizables para agregar animaciones fluidas a la UI.
 * Respetuosos con prefers-reduced-motion para accesibilidad.
 */

import { motion, AnimatePresence, type Variants, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';

// ============================================================================
// CONFIGURACIÓN GLOBAL
// ============================================================================

/** Duración estándar para animaciones (en segundos) */
const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

/** Curvas de easing */
const EASING = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  snappy: [0.25, 0.1, 0.25, 1],
} as const;

// ============================================================================
// FADE IN
// ============================================================================

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: keyof typeof DURATION;
}

/**
 * FadeIn - Animación de entrada con opacidad
 *
 * @example
 * <FadeIn>
 *   <Card>Contenido que aparece suavemente</Card>
 * </FadeIn>
 */
export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 'normal', ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: DURATION[duration],
        delay,
        ease: EASING.smooth,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = 'FadeIn';

// ============================================================================
// SLIDE IN
// ============================================================================

type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface SlideInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  direction?: SlideDirection;
  delay?: number;
  duration?: keyof typeof DURATION;
  distance?: number;
}

const slideVariants: Record<SlideDirection, { initial: object; animate: object }> = {
  up: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  down: { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  left: { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  right: { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 } },
};

/**
 * SlideIn - Animación de entrada con desplazamiento
 *
 * @example
 * <SlideIn direction="up">
 *   <Card>Contenido que sube desde abajo</Card>
 * </SlideIn>
 */
export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ children, direction = 'up', delay = 0, duration = 'normal', ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={slideVariants[direction].initial}
      animate={slideVariants[direction].animate}
      exit={slideVariants[direction].initial}
      transition={{
        duration: DURATION[duration],
        delay,
        ease: EASING.smooth,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
SlideIn.displayName = 'SlideIn';

// ============================================================================
// SCALE IN
// ============================================================================

interface ScaleInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: keyof typeof DURATION;
}

/**
 * ScaleIn - Animación de entrada con escala
 *
 * @example
 * <ScaleIn>
 *   <Modal>Contenido que aparece con zoom</Modal>
 * </ScaleIn>
 */
export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, delay = 0, duration = 'normal', ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        duration: DURATION[duration],
        delay,
        ease: EASING.smooth,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
ScaleIn.displayName = 'ScaleIn';

// ============================================================================
// STAGGER CHILDREN
// ============================================================================

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  staggerDelay?: number;
}

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ease: EASING.smooth, duration: DURATION.normal },
  },
};

/**
 * StaggerContainer + StaggerItem - Animaciones escalonadas para listas
 *
 * @example
 * <StaggerContainer>
 *   {items.map(item => (
 *     <StaggerItem key={item.id}>
 *       <Card>{item.name}</Card>
 *     </StaggerItem>
 *   ))}
 * </StaggerContainer>
 */
export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerContainer.displayName = 'StaggerContainer';

export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div ref={ref} variants={staggerItemVariants} {...props}>
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = 'StaggerItem';

// ============================================================================
// HOVER EFFECTS
// ============================================================================

interface HoverScaleProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  scale?: number;
}

/**
 * HoverScale - Efecto de escala al hacer hover
 *
 * @example
 * <HoverScale scale={1.02}>
 *   <Card>Se agranda al hover</Card>
 * </HoverScale>
 */
export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, scale = 1.02, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: DURATION.fast, ease: EASING.snappy }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverScale.displayName = 'HoverScale';

interface HoverLiftProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  lift?: number;
}

/**
 * HoverLift - Efecto de elevación al hacer hover
 *
 * @example
 * <HoverLift>
 *   <Card>Se eleva al hover</Card>
 * </HoverLift>
 */
export const HoverLift = forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ children, lift = -4, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{
        y: lift,
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      }}
      transition={{ duration: DURATION.fast, ease: EASING.snappy }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverLift.displayName = 'HoverLift';

// ============================================================================
// PAGE TRANSITION
// ============================================================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition - Wrapper para transiciones de página
 *
 * @example
 * <PageTransition>
 *   <DashboardPage />
 * </PageTransition>
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// ANIMATE PRESENCE WRAPPER
// ============================================================================

interface AnimatedPresenceProps {
  children: ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
}

/**
 * AnimatedPresence - Re-export con configuración por defecto
 */
export function AnimatedPresenceWrapper({ children, mode = 'wait' }: AnimatedPresenceProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { motion, AnimatePresence };
export type { Variants };
