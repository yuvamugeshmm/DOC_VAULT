import { motion } from 'framer-motion';

function UploadProgress({ progress, filename }) {
  const variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  const progressVariants = {
    hidden: { width: '0%' },
    visible: { width: `${progress}%` },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="glass-dark rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text truncate flex-1 mr-2">{filename}</span>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          variants={progressVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
        />
      </div>
    </motion.div>
  );
}

export default UploadProgress;
