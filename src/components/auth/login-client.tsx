'use client'

import { motion, Variants } from 'framer-motion'
import { Images, Lock, Users } from 'lucide-react'

import { SocialLogin } from '@/components/auth'

import { cn } from '@/utils'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const backgroundOrbVariants: Variants = {
  animate: (custom: number) => ({
    x: [0, custom * 30, custom * -20, 0],
    y: [0, custom * -30, custom * 20, 0],
    transition: {
      duration: 20 + custom * 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
}

const textVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const featuresVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
    },
  },
}

const featureItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const patternVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.05,
    },
  },
}

const patternBoxVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
    },
  },
}

const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
}

interface LoginClientProps {
  loginTo: string
  loginName: string
  loginText: string
  buildYourTreeTitle: string
  buildYourTreeDescription: string
  shareMemoriesTitle: string
  shareMemoriesDescription: string
  privateAndSecureTitle: string
  privateAndSecureDescription: string
}

export function LoginClient({
  loginTo,
  loginName,
  loginText,
  buildYourTreeTitle,
  buildYourTreeDescription,
  shareMemoriesTitle,
  shareMemoriesDescription,
  privateAndSecureTitle,
  privateAndSecureDescription,
}: LoginClientProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-ocean-400 relative flex min-h-screen w-full items-center justify-center p-4"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          custom={1}
          animate="animate"
          variants={backgroundOrbVariants}
          className="bg-ocean-500 absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
        />
        <motion.div
          custom={-1}
          animate="animate"
          variants={backgroundOrbVariants}
          className="bg-ocean-500 absolute -right-32 -bottom-32 h-[500px] w-[500px] rounded-full opacity-60 blur-3xl"
        />
        <motion.div
          custom={0.5}
          animate="animate"
          variants={backgroundOrbVariants}
          className="bg-ocean-500 absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        />
      </div>
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row lg:justify-between lg:px-8">
        <motion.div
          variants={featuresVariants}
          className="flex w-full flex-1 justify-center lg:justify-end"
        >
          <div className="grid w-full max-w-sm grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-0 lg:space-y-6">
            <motion.div
              variants={featureItemVariants}
              className="flex flex-col items-center gap-2 text-center lg:flex-row lg:items-start lg:gap-3 lg:text-left"
            >
              <div className="bg-ocean-300 rounded-lg p-2">
                <Users className="text-ocean-100 h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h4 className="text-ocean-100 text-xs font-bold lg:text-lg">
                  {buildYourTreeTitle}
                </h4>
                <p className="text-ocean-200 text-[10px] lg:text-sm">{buildYourTreeDescription}</p>
              </div>
            </motion.div>
            <motion.div
              variants={featureItemVariants}
              className="flex flex-col items-center gap-2 text-center lg:flex-row lg:items-start lg:gap-3 lg:text-left"
            >
              <div className="bg-ocean-300 rounded-lg p-2">
                <Images className="text-ocean-100 h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h4 className="text-ocean-100 text-xs font-bold lg:text-lg">
                  {shareMemoriesTitle}
                </h4>
                <p className="text-ocean-200 text-[10px] lg:text-sm">{shareMemoriesDescription}</p>
              </div>
            </motion.div>
            <motion.div
              variants={featureItemVariants}
              className="flex flex-col items-center gap-2 text-center lg:flex-row lg:items-start lg:gap-3 lg:text-left"
            >
              <div className="bg-ocean-300 rounded-lg p-2">
                <Lock className="text-ocean-100 h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h4 className="text-ocean-100 text-xs font-bold lg:text-lg">
                  {privateAndSecureTitle}
                </h4>
                <p className="text-ocean-200 text-[10px] lg:text-sm">
                  {privateAndSecureDescription}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          variants={textVariants}
          className={cn(
            'bg-ocean-500 shadow-center w-full max-w-sm shrink-0 overflow-hidden rounded-3xl'
          )}
        >
          <div className="text-ocean-300 flex flex-col items-center justify-center p-6 text-center">
            <motion.img
              src={'/logo.svg'}
              width={96}
              height={96}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              whileHover={{
                scale: 1.1,
                rotate: 5,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            />
            <motion.h3
              variants={textVariants}
              className="text-ocean-100 py-3 text-2xl leading-none font-semibold tracking-tight md:text-3xl"
            >
              {loginTo}
              <motion.p
                variants={textVariants}
                className="text-ocean-50 relative text-3xl font-extrabold md:text-4xl"
              >
                {loginName.toLowerCase()}
                <motion.span
                  className="text-ocean-100 absolute right-0 text-sm font-semibold sm:text-lg"
                  initial={{ opacity: 0, x: 0, y: 12 }}
                  animate={{ opacity: 1, x: 25, y: 12 }}
                  transition={{ duration: 0.2, delay: 1 }}
                >
                  beta
                </motion.span>
              </motion.p>
            </motion.h3>
            <motion.p
              variants={textVariants}
              className="text-ocean-100 mt-5 px-5 text-base font-medium md:text-lg"
            >
              {loginText}
            </motion.p>
          </div>
          <motion.div variants={textVariants} className="grid gap-4 p-6 pt-0">
            <motion.div variants={buttonVariants} initial="idle" whileHover="hover">
              <SocialLogin />
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div
          variants={patternVariants}
          className="flex w-full flex-1 items-center justify-center"
        >
          <div className="grid grid-cols-3 gap-2 opacity-30 lg:gap-3">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                variants={patternBoxVariants}
                className="bg-ocean-300 h-12 w-12 rounded-lg lg:h-16 lg:w-16"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
