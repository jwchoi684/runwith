"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    // 인앱 브라우저 감지 (Google 로그인 차단용)
    const ua = navigator.userAgent || navigator.vendor;
    const isInApp =
      /KAKAOTALK/i.test(ua) ||
      /NAVER/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /FBAN|FBAV/i.test(ua) || // Facebook
      /Line/i.test(ua) ||
      /wv\)/i.test(ua) || // Android WebView
      /WebView/i.test(ua);

    setIsInAppBrowser(isInApp);
  }, []);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleKakaoLogin = () => {
    signIn("kakao", { callbackUrl: "/" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.origin;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Running Crew</h1>
          <p className="text-slate-400">함께 달리고, 함께 성장하세요</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            로그인
          </h2>

          <div className="space-y-3">
            {/* Kakao Login - 인앱 브라우저에서도 가능 */}
            <button
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.545-4.287a.59.59 0 0 0-.559-.393.59.59 0 0 0-.559.393l-1.545 4.287a.472.472 0 0 0 .885.32l.347-.926h1.912l.347.926c.078.21.274.341.49.341a.472.472 0 0 0 .352-.325zm-6.876.604h1.778a.472.472 0 1 0 0-.944H6.79V9.282a.472.472 0 0 0-.944 0v4.187c0 .26.21.472.472.472h.012z" />
              </svg>
              카카오로 계속하기
            </button>

            {/* Google Login */}
            {isInAppBrowser ? (
              <div className="space-y-3">
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3">
                  <p className="text-slate-400 text-xs text-center">
                    Google 로그인은 외부 브라우저에서만 가능합니다
                  </p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                >
                  {showCopySuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      링크 복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      외부 브라우저로 열기 (링크 복사)
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-400 text-sm mt-6">
            간편하게 로그인하고 시작하세요
          </p>
        </div>
      </div>
    </div>
  );
}
