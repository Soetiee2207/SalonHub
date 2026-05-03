import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiX, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function EmailVerifyModal({ isOpen, onClose, email, onVerify }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const otpInputs = useRef([]);

  useEffect(() => {
    let interval;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã 6 số');
      return;
    }

    setLoading(true);
    try {
      await onVerify({
        email,
        otp: otpValue,
        registrationData
      });
      // Toast and navigation are handled by the parent/onVerify
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await authService.resendOtp({ email });
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
      toast.success('Mã xác thực mới đã được gửi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="p-8 sm:p-10">
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6" 
                  style={{ backgroundColor: 'var(--bg-warm)', color: 'var(--primary)' }}
                >
                  <FiMail size={36} className="animate-bounce" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark)' }}>
                  Xác thực Email
                </h2>
                <p className="text-sm text-gray-500 mb-8 max-w-xs">
                  Mã OTP đã được gửi đến <span className="font-semibold text-gray-800">{email}</span>. Vui lòng kiểm tra hộp thư.
                </p>

                <form onSubmit={handleSubmit} className="w-full space-y-8">
                  <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all focus:ring-4 focus:ring-primary/10"
                        style={{
                          borderColor: otp[index] ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: otp[index] ? 'var(--bg-light)' : 'white',
                          color: 'var(--text-dark)'
                        }}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading || otp.join('').length < 6}
                      className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {loading ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <>
                          <FiCheckCircle size={18} />
                          Xác thực ngay
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Không nhận được mã?{' '}
                        {timer > 0 ? (
                          <span className="font-semibold text-gray-800">Gửi lại sau {timer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            className="font-bold hover:underline transition-colors"
                            style={{ color: 'var(--primary)' }}
                          >
                            Gửi lại mã
                          </button>
                        )}
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Design Element */}
            <div className="h-2 w-full bg-gradient-to-r from-primary-light via-primary to-primary-dark" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
