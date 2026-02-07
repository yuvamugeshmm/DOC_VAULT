import { motion } from 'framer-motion';

function SkeletonLoader({ count = 1, className = '' }) {
  const skeletonVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className={`bg-gray-200 rounded-lg ${className}`}
        />
      ))}
    </>
  );
}

export default SkeletonLoader;
