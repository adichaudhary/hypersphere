import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, CheckCircle, Waves } from "lucide-react";

type PaymentState = "idle" | "processing" | "success";

export function TapToPayScreen() {
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [amount] = useState("$45.99");

  const handleTap = () => {
    if (paymentState !== "idle") return;
    
    setPaymentState("processing");
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentState("success");
      
      // Reset after showing success
      setTimeout(() => {
        setPaymentState("idle");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-8 text-white">
        <div className="text-center">
          <p className="text-blue-100 mb-2">Amount Due</p>
          <h1 className="text-5xl tracking-tight mb-1">{amount}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12">
        <AnimatePresence mode="wait">
          {paymentState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Tap Area */}
              <motion.button
                onClick={handleTap}
                className="w-full aspect-square max-w-[280px] mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-blue-200 border-dashed flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  animate={{
                    boxShadow: [
                      "inset 0 0 0 0px rgba(59, 130, 246, 0.3)",
                      "inset 0 0 0 20px rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Smartphone className="w-20 h-20 text-blue-600 mb-4" strokeWidth={1.5} />
                </motion.div>
                
                <div className="space-y-2">
                  <p className="text-blue-900">Hold card or device near screen</p>
                  <p className="text-blue-600 text-sm">Tap to simulate payment</p>
                </div>
              </motion.button>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-left">
                  <Waves className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">Contactless payment</p>
                    <p className="text-gray-500 text-sm">Support for all NFC-enabled cards and devices</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {paymentState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-6 relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent" />
              </motion.div>
              
              <motion.p
                className="text-gray-900 mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Processing payment...
              </motion.p>
              <p className="text-gray-500 text-sm">Please wait</p>
            </motion.div>
          )}

          {paymentState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.1 
                }}
                className="mb-6"
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <CheckCircle className="w-24 h-24 text-green-500 mx-auto" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-green-600 text-2xl mb-2">Payment Successful</h2>
                <p className="text-gray-600 mb-1">{amount} charged</p>
                <p className="text-gray-400 text-sm">Transaction complete</p>
              </motion.div>

              {/* Success confetti effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1 }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-green-400 rounded-full"
                    initial={{
                      x: "50%",
                      y: "30%",
                    }}
                    animate={{
                      x: `${50 + (Math.cos((i * Math.PI * 2) / 12) * 40)}%`,
                      y: `${30 + (Math.sin((i * Math.PI * 2) / 12) * 40)}%`,
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-sm">Secured by encryption</p>
        </div>
      </div>
    </div>
  );
}
