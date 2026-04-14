import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/auth/Login.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=e3688b2c"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=e3688b2c"; const useState = __vite__cjsImport3_react["useState"]; const useEffect = __vite__cjsImport3_react["useEffect"];
import { Link, useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=e3688b2c";
import { FiMail, FiLock, FiEye, FiEyeOff } from "/node_modules/.vite/deps/react-icons_fi.js?v=e3688b2c";
import { FcGoogle } from "/node_modules/.vite/deps/react-icons_fc.js?v=e3688b2c";
import { useGoogleLogin } from "/node_modules/.vite/deps/@react-oauth_google.js?v=e3688b2c";
import toast from "/node_modules/.vite/deps/react-hot-toast.js?v=e3688b2c";
import { useAuth } from "/src/contexts/AuthContext.jsx";
export default function Login() {
  _s();
  const { user, login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (user) {
      if (user.role !== "customer") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, "", "/login");
      const processGoogleLogin = async () => {
        setLoading(true);
        try {
          await googleLogin({ code });
          toast.success("Đăng nhập Google thành công!");
        } catch (err) {
          toast.error(err.message || "Đăng nhập Google thất bại");
        } finally {
          setLoading(false);
        }
      };
      processGoogleLogin();
    }
  }, [googleLogin]);
  const googleLoginRedirect = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: window.location.origin + "/login"
  });
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      await login(form);
      toast.success("Đăng nhập thành công!");
    } catch (err) {
      toast.error(err.message || "Email, Số điện thoại hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      toast.success("Đăng nhập Google thành công!");
    } catch (err) {
      toast.error(err.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen flex", style: { backgroundColor: "var(--bg-light)" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "hidden lg:flex lg:w-1/2 relative overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
          alt: "Salon",
          className: "w-full h-full object-cover"
        },
        void 0,
        false,
        {
          fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
          lineNumber: 114,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0", style: { backgroundColor: "rgba(30, 20, 12, 0.55)" } }, void 0, false, {
        fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
        lineNumber: 119,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 flex flex-col justify-end p-12", children: [
        /* @__PURE__ */ jsxDEV(
          "h2",
          {
            className: "text-4xl font-bold text-white mb-3",
            style: { fontFamily: "var(--font-display)" },
            children: "SalonHub"
          },
          void 0,
          false,
          {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 121,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("p", { className: "text-lg", style: { color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-body)" }, children: "Không gian tóc đẳng cấp" }, void 0, false, {
          fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
          lineNumber: 127,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
        lineNumber: 120,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
      lineNumber: 113,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "w-full lg:w-1/2 flex items-center justify-center px-6 py-12", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "lg:hidden text-center mb-10", children: [
        /* @__PURE__ */ jsxDEV(
          "h2",
          {
            className: "text-3xl font-bold mb-1",
            style: { fontFamily: "var(--font-display)", color: "var(--primary)" },
            children: "SalonHub"
          },
          void 0,
          false,
          {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 138,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("p", { className: "text-sm", style: { color: "var(--text-gray)" }, children: "Không gian tóc đẳng cấp" }, void 0, false, {
          fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
          lineNumber: 144,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
        lineNumber: 137,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-2xl p-8 sm:p-10 border", style: { borderColor: "var(--border)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsxDEV(
            "h1",
            {
              className: "text-2xl font-bold mb-2",
              style: { fontFamily: "var(--font-display)", color: "var(--primary-dark, #5A3A24)" },
              children: "Chào mừng trở lại"
            },
            void 0,
            false,
            {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 151,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("p", { className: "text-sm", style: { color: "var(--text-gray)", fontFamily: "var(--font-body)" }, children: "Đăng nhập để tiếp tục" }, void 0, false, {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 157,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
          lineNumber: 150,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV(
              "label",
              {
                className: "block text-sm font-medium mb-1.5",
                style: { color: "var(--text-dark)", fontFamily: "var(--font-body)" },
                children: "Email hoặc Số điện thoại"
              },
              void 0,
              false,
              {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 165,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2", style: { color: "var(--text-gray)" }, children: /* @__PURE__ */ jsxDEV(FiMail, { size: 18 }, void 0, false, {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 173,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 172,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  name: "email",
                  value: form.email,
                  onChange: handleChange,
                  placeholder: "Email hoặc Số điện thoại",
                  className: "w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none",
                  style: {
                    borderColor: "var(--border)",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.3s ease"
                  },
                  onFocus: (e) => e.target.style.borderColor = "var(--primary)",
                  onBlur: (e) => e.target.style.borderColor = "var(--border)"
                },
                void 0,
                false,
                {
                  fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                  lineNumber: 175,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 171,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 164,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV(
              "label",
              {
                className: "block text-sm font-medium mb-1.5",
                style: { color: "var(--text-dark)", fontFamily: "var(--font-body)" },
                children: "Mật khẩu"
              },
              void 0,
              false,
              {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 195,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2", style: { color: "var(--text-gray)" }, children: /* @__PURE__ */ jsxDEV(FiLock, { size: 18 }, void 0, false, {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 203,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                lineNumber: 202,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  name: "password",
                  value: form.password,
                  onChange: handleChange,
                  placeholder: "Nhập mật khẩu",
                  className: "w-full pl-11 pr-11 py-3 rounded-xl border text-sm outline-none",
                  style: {
                    borderColor: "var(--border)",
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.3s ease"
                  },
                  onFocus: (e) => e.target.style.borderColor = "var(--primary)",
                  onBlur: (e) => e.target.style.borderColor = "var(--border)"
                },
                void 0,
                false,
                {
                  fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                  lineNumber: 205,
                  columnNumber: 19
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer",
                  style: { color: "var(--text-gray)" },
                  children: showPassword ? /* @__PURE__ */ jsxDEV(FiEyeOff, { size: 18 }, void 0, false, {
                    fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                    lineNumber: 226,
                    columnNumber: 37
                  }, this) : /* @__PURE__ */ jsxDEV(FiEye, { size: 18 }, void 0, false, {
                    fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                    lineNumber: 226,
                    columnNumber: 62
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                  lineNumber: 220,
                  columnNumber: 19
                },
                this
              )
            ] }, void 0, true, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 201,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 194,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "submit",
              disabled: loading,
              className: "w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer",
              style: {
                backgroundColor: "var(--primary)",
                fontFamily: "var(--font-body)",
                transition: "opacity 0.2s ease"
              },
              onMouseEnter: (e) => {
                if (!loading) e.target.style.opacity = "0.9";
              },
              onMouseLeave: (e) => {
                e.target.style.opacity = "1";
              },
              children: loading ? "Đang xử lý..." : "Đăng nhập"
            },
            void 0,
            false,
            {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 232,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "relative my-6", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full border-t border-slate-100" }, void 0, false, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 249,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 248,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "relative flex justify-center text-xs uppercase tracking-widest font-bold", children: /* @__PURE__ */ jsxDEV("span", { className: "bg-white px-4 text-slate-300", children: "Hoặc" }, void 0, false, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 252,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 251,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 247,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              onClick: () => googleLoginRedirect(),
              disabled: loading,
              className: "w-full flex items-center justify-center gap-3 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700",
              style: { fontFamily: "var(--font-body)" },
              children: [
                /* @__PURE__ */ jsxDEV(FcGoogle, { size: 22 }, void 0, false, {
                  fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                  lineNumber: 264,
                  columnNumber: 19
                }, this),
                "Tiếp tục với Google"
              ]
            },
            void 0,
            true,
            {
              fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
              lineNumber: 257,
              columnNumber: 17
            },
            this
          ) }, void 0, false, {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 256,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
          lineNumber: 162,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "p",
          {
            className: "text-center text-sm mt-8",
            style: { color: "var(--text-gray)", fontFamily: "var(--font-body)" },
            children: [
              "Chưa có tài khoản?",
              " ",
              /* @__PURE__ */ jsxDEV(
                Link,
                {
                  to: "/register",
                  className: "font-semibold hover:underline",
                  style: { color: "var(--primary)" },
                  children: "Đăng ký ngay"
                },
                void 0,
                false,
                {
                  fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
                  lineNumber: 275,
                  columnNumber: 15
                },
                this
              )
            ]
          },
          void 0,
          true,
          {
            fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
            lineNumber: 270,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
        lineNumber: 149,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
      lineNumber: 135,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
      lineNumber: 134,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx",
    lineNumber: 111,
    columnNumber: 5
  }, this);
}
_s(Login, "GUfJQV9ONNQzpvHzJGtE8VOnycA=", false, function() {
  return [useAuth, useNavigate, useGoogleLogin];
});
_c = Login;
var _c;
$RefreshReg$(_c, "Login");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("E:/Studying Document/A_2026_Work/K2N1-25.26/SalonHub/frontend/src/pages/auth/Login.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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LGlCQVdBO0FBQUEsYUF6R0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQTBHQTtBQUFBLFFBRUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLFdBQVU7QUFBQSxZQUNWLE9BQU8sRUFBRUMsT0FBTyxvQkFBb0JELFlBQVksbUJBQW1CO0FBQUEsWUFBRTtBQUFBO0FBQUEsY0FFbEQ7QUFBQSxjQUNuQjtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxJQUFHO0FBQUEsa0JBQ0gsV0FBVTtBQUFBLGtCQUNWLE9BQU8sRUFBRUMsT0FBTyxpQkFBaUI7QUFBQSxrQkFBRTtBQUFBO0FBQUEsZ0JBSHJDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQU1BO0FBQUE7QUFBQTtBQUFBLFVBWEY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBWUE7QUFBQSxXQXJJRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBc0lBO0FBQUEsU0FwSkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQXFKQSxLQXRKRjtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBdUpBO0FBQUEsT0E5S0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQStLQTtBQUVKO0FBQUMvQyxHQXBRdUJELE9BQUs7QUFBQSxVQUNVRCxTQUNwQlIsYUF3Q1dNLGNBQWM7QUFBQTtBQUFBLEtBMUNwQkc7QUFBSyxJQUFBcUQ7QUFBQSxhQUFBQSxJQUFBIiwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJMaW5rIiwidXNlTmF2aWdhdGUiLCJGaU1haWwiLCJGaUxvY2siLCJGaUV5ZSIsIkZpRXllT2ZmIiwiRmNHb29nbGUiLCJ1c2VHb29nbGVMb2dpbiIsInRvYXN0IiwidXNlQXV0aCIsIkxvZ2luIiwiX3MiLCJ1c2VyIiwibG9naW4iLCJnb29nbGVMb2dpbiIsIm5hdmlnYXRlIiwiZm9ybSIsInNldEZvcm0iLCJlbWFpbCIsInBhc3N3b3JkIiwic2hvd1Bhc3N3b3JkIiwic2V0U2hvd1Bhc3N3b3JkIiwibG9hZGluZyIsInNldExvYWRpbmciLCJyb2xlIiwicmVwbGFjZSIsInBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsIndpbmRvdyIsImxvY2F0aW9uIiwic2VhcmNoIiwiY29kZSIsImdldCIsImhpc3RvcnkiLCJyZXBsYWNlU3RhdGUiLCJwcm9jZXNzR29vZ2xlTG9naW4iLCJzdWNjZXNzIiwiZXJyIiwiZXJyb3IiLCJtZXNzYWdlIiwiZ29vZ2xlTG9naW5SZWRpcmVjdCIsImZsb3ciLCJ1eF9tb2RlIiwicmVkaXJlY3RfdXJpIiwib3JpZ2luIiwiaGFuZGxlQ2hhbmdlIiwiZSIsInByZXYiLCJ0YXJnZXQiLCJuYW1lIiwidmFsdWUiLCJoYW5kbGVTdWJtaXQiLCJwcmV2ZW50RGVmYXVsdCIsImhhbmRsZUdvb2dsZVN1Y2Nlc3MiLCJjcmVkZW50aWFsUmVzcG9uc2UiLCJjcmVkZW50aWFsIiwiYmFja2dyb3VuZENvbG9yIiwiZm9udEZhbWlseSIsImNvbG9yIiwiYm9yZGVyQ29sb3IiLCJ0cmFuc2l0aW9uIiwic3R5bGUiLCJvcGFjaXR5IiwiX2MiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiTG9naW4uanN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IExpbmssIHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XHJcbmltcG9ydCB7IEZpTWFpbCwgRmlMb2NrLCBGaUV5ZSwgRmlFeWVPZmYgfSBmcm9tICdyZWFjdC1pY29ucy9maSc7XHJcbmltcG9ydCB7IEZjR29vZ2xlIH0gZnJvbSAncmVhY3QtaWNvbnMvZmMnO1xyXG5pbXBvcnQgeyB1c2VHb29nbGVMb2dpbiB9IGZyb20gJ0ByZWFjdC1vYXV0aC9nb29nbGUnO1xyXG5pbXBvcnQgdG9hc3QgZnJvbSAncmVhY3QtaG90LXRvYXN0JztcclxuaW1wb3J0IHsgdXNlQXV0aCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL0F1dGhDb250ZXh0JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIExvZ2luKCkge1xyXG4gIGNvbnN0IHsgdXNlciwgbG9naW4sIGdvb2dsZUxvZ2luIH0gPSB1c2VBdXRoKCk7XHJcbiAgY29uc3QgbmF2aWdhdGUgPSB1c2VOYXZpZ2F0ZSgpO1xyXG5cclxuICBjb25zdCBbZm9ybSwgc2V0Rm9ybV0gPSB1c2VTdGF0ZSh7IGVtYWlsOiAnJywgcGFzc3dvcmQ6ICcnIH0pO1xyXG4gIGNvbnN0IFtzaG93UGFzc3dvcmQsIHNldFNob3dQYXNzd29yZF0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgaWYgKHVzZXIpIHtcclxuICAgICAgaWYgKHVzZXIucm9sZSAhPT0gJ2N1c3RvbWVyJykge1xyXG4gICAgICAgIG5hdmlnYXRlKCcvYWRtaW4nLCB7IHJlcGxhY2U6IHRydWUgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmF2aWdhdGUoJy8nLCB7IHJlcGxhY2U6IHRydWUgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCBbdXNlciwgbmF2aWdhdGVdKTtcclxuXHJcbiAgLy8gSGFuZGxlIEdvb2dsZSBSZWRpcmVjdCBjYWxsYmFjayAoY29kZSBpbiBVUkwpXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbiAgICBjb25zdCBjb2RlID0gcGFyYW1zLmdldCgnY29kZScpO1xyXG4gICAgaWYgKGNvZGUpIHtcclxuICAgICAgLy8gQ2xlYXIgY29kZSBmcm9tIFVSTCB0byBrZWVwIGl0IGNsZWFuXHJcbiAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsICcvbG9naW4nKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHByb2Nlc3NHb29nbGVMb2dpbiA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICBzZXRMb2FkaW5nKHRydWUpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBhd2FpdCBnb29nbGVMb2dpbih7IGNvZGUgfSk7XHJcbiAgICAgICAgICB0b2FzdC5zdWNjZXNzKCfEkMSDbmcgbmjhuq1wIEdvb2dsZSB0aMOgbmggY8O0bmchJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICB0b2FzdC5lcnJvcihlcnIubWVzc2FnZSB8fCAnxJDEg25nIG5o4bqtcCBHb29nbGUgdGjhuqV0IGLhuqFpJyk7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIHByb2Nlc3NHb29nbGVMb2dpbigpO1xyXG4gICAgfVxyXG4gIH0sIFtnb29nbGVMb2dpbl0pO1xyXG5cclxuICBjb25zdCBnb29nbGVMb2dpblJlZGlyZWN0ID0gdXNlR29vZ2xlTG9naW4oe1xyXG4gICAgZmxvdzogJ2F1dGgtY29kZScsXHJcbiAgICB1eF9tb2RlOiAncmVkaXJlY3QnLFxyXG4gICAgcmVkaXJlY3RfdXJpOiB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgJy9sb2dpbicsXHJcbiAgfSk7XHJcblxyXG4gIC8vIEZvcm0gc3VibWl0IGhhbmRsZXJcclxuICBjb25zdCBoYW5kbGVDaGFuZ2UgPSAoZSkgPT4ge1xyXG4gICAgc2V0Rm9ybShwcmV2ID0+ICh7IC4uLnByZXYsIFtlLnRhcmdldC5uYW1lXTogZS50YXJnZXQudmFsdWUgfSkpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZVN1Ym1pdCA9IGFzeW5jIChlKSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoIWZvcm0uZW1haWwgfHwgIWZvcm0ucGFzc3dvcmQpIHtcclxuICAgICAgdG9hc3QuZXJyb3IoJ1Z1aSBsw7JuZyDEkWnhu4FuIMSR4bqneSDEkeG7pyB0aMO0bmcgdGluJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHNldExvYWRpbmcodHJ1ZSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBsb2dpbihmb3JtKTtcclxuICAgICAgdG9hc3Quc3VjY2VzcygnxJDEg25nIG5o4bqtcCB0aMOgbmggY8O0bmchJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdG9hc3QuZXJyb3IoZXJyLm1lc3NhZ2UgfHwgJ0VtYWlsLCBT4buRIMSRaeG7h24gdGhv4bqhaSBob+G6t2MgbeG6rXQga2jhuql1IGtow7RuZyDEkcO6bmcnKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZUdvb2dsZVN1Y2Nlc3MgPSBhc3luYyAoY3JlZGVudGlhbFJlc3BvbnNlKSA9PiB7XHJcbiAgICBzZXRMb2FkaW5nKHRydWUpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZ29vZ2xlTG9naW4oY3JlZGVudGlhbFJlc3BvbnNlLmNyZWRlbnRpYWwpO1xyXG4gICAgICB0b2FzdC5zdWNjZXNzKCfEkMSDbmcgbmjhuq1wIEdvb2dsZSB0aMOgbmggY8O0bmchJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdG9hc3QuZXJyb3IoZXJyLm1lc3NhZ2UgfHwgJ8SQxINuZyBuaOG6rXAgR29vZ2xlIHRo4bqldCBi4bqhaScpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGZsZXhcIiBzdHlsZT17eyBiYWNrZ3JvdW5kQ29sb3I6ICd2YXIoLS1iZy1saWdodCknIH19PlxyXG4gICAgICB7LyogTGVmdCAtIEltYWdlIFBhbmVsICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGRlbiBsZzpmbGV4IGxnOnctMS8yIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlblwiPlxyXG4gICAgICAgIDxpbWdcclxuICAgICAgICAgIHNyYz1cImh0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNTIyMzM3MzYwNzg4LThiMTNkZWU3YTM3ZT93PTgwMCZxPTgwXCJcclxuICAgICAgICAgIGFsdD1cIlNhbG9uXCJcclxuICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyXCJcclxuICAgICAgICAvPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgaW5zZXQtMFwiIHN0eWxlPXt7IGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMzAsIDIwLCAxMiwgMC41NSknIH19IC8+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGZsZXggZmxleC1jb2wganVzdGlmeS1lbmQgcC0xMlwiPlxyXG4gICAgICAgICAgPGgyXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtNHhsIGZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1iLTNcIlxyXG4gICAgICAgICAgICBzdHlsZT17eyBmb250RmFtaWx5OiAndmFyKC0tZm9udC1kaXNwbGF5KScgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgU2Fsb25IdWJcclxuICAgICAgICAgIDwvaDI+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWxnXCIgc3R5bGU9e3sgY29sb3I6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuOCknLCBmb250RmFtaWx5OiAndmFyKC0tZm9udC1ib2R5KScgfX0+XHJcbiAgICAgICAgICAgIEtow7RuZyBnaWFuIHTDs2MgxJHhurNuZyBj4bqlcFxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBSaWdodCAtIExvZ2luIEZvcm0gKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIGxnOnctMS8yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHB4LTYgcHktMTJcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1tZFwiPlxyXG4gICAgICAgICAgey8qIE1vYmlsZSBicmFuZGluZyAqL31cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGc6aGlkZGVuIHRleHQtY2VudGVyIG1iLTEwXCI+XHJcbiAgICAgICAgICAgIDxoMlxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtM3hsIGZvbnQtYm9sZCBtYi0xXCJcclxuICAgICAgICAgICAgICBzdHlsZT17eyBmb250RmFtaWx5OiAndmFyKC0tZm9udC1kaXNwbGF5KScsIGNvbG9yOiAndmFyKC0tcHJpbWFyeSknIH19XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICBTYWxvbkh1YlxyXG4gICAgICAgICAgICA8L2gyPlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS10ZXh0LWdyYXkpJyB9fT5cclxuICAgICAgICAgICAgICBLaMO0bmcgZ2lhbiB0w7NjIMSR4bqzbmcgY+G6pXBcclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTggc206cC0xMCBib3JkZXJcIiBzdHlsZT17eyBib3JkZXJDb2xvcjogJ3ZhcigtLWJvcmRlciknIH19PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLThcIj5cclxuICAgICAgICAgICAgICA8aDFcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCBtYi0yXCJcclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7IGZvbnRGYW1pbHk6ICd2YXIoLS1mb250LWRpc3BsYXkpJywgY29sb3I6ICd2YXIoLS1wcmltYXJ5LWRhcmssICM1QTNBMjQpJyB9fVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIENow6BvIG3hu6tuZyB0cuG7nyBs4bqhaVxyXG4gICAgICAgICAgICAgIDwvaDE+XHJcbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbVwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tdGV4dC1ncmF5KScsIGZvbnRGYW1pbHk6ICd2YXIoLS1mb250LWJvZHkpJyB9fT5cclxuICAgICAgICAgICAgICAgIMSQxINuZyBuaOG6rXAgxJHhu4MgdGnhur9wIHThu6VjXHJcbiAgICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTdWJtaXR9IGNsYXNzTmFtZT1cInNwYWNlLXktNVwiPlxyXG4gICAgICAgICAgICAgIHsvKiBFbWFpbCAqL31cclxuICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsXHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gbWItMS41XCJcclxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS10ZXh0LWRhcmspJywgZm9udEZhbWlseTogJ3ZhcigtLWZvbnQtYm9keSknIH19XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIEVtYWlsIGhv4bq3YyBT4buRIMSRaeG7h24gdGhv4bqhaVxyXG4gICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmVcIj5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC0zLjUgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS10ZXh0LWdyYXkpJyB9fT5cclxuICAgICAgICAgICAgICAgICAgICA8RmlNYWlsIHNpemU9ezE4fSAvPlxyXG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgICAgICBuYW1lPVwiZW1haWxcIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtLmVtYWlsfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFbWFpbCBob+G6t2MgU+G7kSDEkWnhu4duIHRob+G6oWlcIlxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwbC0xMSBwci00IHB5LTMgcm91bmRlZC14bCBib3JkZXIgdGV4dC1zbSBvdXRsaW5lLW5vbmVcIlxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3ZhcigtLWJvcmRlciknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgZm9udEZhbWlseTogJ3ZhcigtLWZvbnQtYm9keSknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJ2JvcmRlci1jb2xvciAwLjNzIGVhc2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgb25Gb2N1cz17KGUpID0+IGUudGFyZ2V0LnN0eWxlLmJvcmRlckNvbG9yID0gJ3ZhcigtLXByaW1hcnkpJ31cclxuICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eyhlKSA9PiBlLnRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9ICd2YXIoLS1ib3JkZXIpJ31cclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7LyogUGFzc3dvcmQgKi99XHJcbiAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxsYWJlbFxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXNtIGZvbnQtbWVkaXVtIG1iLTEuNVwiXHJcbiAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tdGV4dC1kYXJrKScsIGZvbnRGYW1pbHk6ICd2YXIoLS1mb250LWJvZHkpJyB9fVxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICBN4bqtdCBraOG6qXVcclxuICAgICAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMy41IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMlwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tdGV4dC1ncmF5KScgfX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPEZpTG9jayBzaXplPXsxOH0gLz5cclxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgICAgICB0eXBlPXtzaG93UGFzc3dvcmQgPyAndGV4dCcgOiAncGFzc3dvcmQnfVxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU9XCJwYXNzd29yZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm0ucGFzc3dvcmR9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUNoYW5nZX1cclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIk5o4bqtcCBt4bqtdCBraOG6qXVcIlxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBwbC0xMSBwci0xMSBweS0zIHJvdW5kZWQteGwgYm9yZGVyIHRleHQtc20gb3V0bGluZS1ub25lXCJcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xyXG4gICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICd2YXIoLS1ib3JkZXIpJyxcclxuICAgICAgICAgICAgICAgICAgICAgIGZvbnRGYW1pbHk6ICd2YXIoLS1mb250LWJvZHkpJyxcclxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdib3JkZXItY29sb3IgMC4zcyBlYXNlJyxcclxuICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgIG9uRm9jdXM9eyhlKSA9PiBlLnRhcmdldC5zdHlsZS5ib3JkZXJDb2xvciA9ICd2YXIoLS1wcmltYXJ5KSd9XHJcbiAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4gZS50YXJnZXQuc3R5bGUuYm9yZGVyQ29sb3IgPSAndmFyKC0tYm9yZGVyKSd9XHJcbiAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93UGFzc3dvcmQoIXNob3dQYXNzd29yZCl9XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgcmlnaHQtMy41IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiBjdXJzb3ItcG9pbnRlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS10ZXh0LWdyYXkpJyB9fVxyXG4gICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAge3Nob3dQYXNzd29yZCA/IDxGaUV5ZU9mZiBzaXplPXsxOH0gLz4gOiA8RmlFeWUgc2l6ZT17MTh9IC8+fVxyXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICB7LyogU3VibWl0ICovfVxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIHR5cGU9XCJzdWJtaXRcIlxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2xvYWRpbmd9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHktMyByb3VuZGVkLXhsIHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LXNtIGRpc2FibGVkOm9wYWNpdHktNjAgY3Vyc29yLXBvaW50ZXJcIlxyXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tcHJpbWFyeSknLFxyXG4gICAgICAgICAgICAgICAgICBmb250RmFtaWx5OiAndmFyKC0tZm9udC1ib2R5KScsXHJcbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdvcGFjaXR5IDAuMnMgZWFzZScsXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4geyBpZiAoIWxvYWRpbmcpIGUudGFyZ2V0LnN0eWxlLm9wYWNpdHkgPSAnMC45JzsgfX1cclxuICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KGUpID0+IHsgZS50YXJnZXQuc3R5bGUub3BhY2l0eSA9ICcxJzsgfX1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICB7bG9hZGluZyA/ICfEkGFuZyB44butIGzDvS4uLicgOiAnxJDEg25nIG5o4bqtcCd9XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcblxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgbXktNlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIGJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDBcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBmbGV4IGp1c3RpZnktY2VudGVyIHRleHQteHMgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBmb250LWJvbGRcIj5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiYmctd2hpdGUgcHgtNCB0ZXh0LXNsYXRlLTMwMFwiPkhv4bq3Yzwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXHJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGdvb2dsZUxvZ2luUmVkaXJlY3QoKX1cclxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2xvYWRpbmd9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMyBweS0zIHJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLWdyYXktMjAwIGhvdmVyOmJnLWdyYXktNTAgdHJhbnNpdGlvbi1jb2xvcnMgZm9udC1tZWRpdW0gdGV4dC1zbSB0ZXh0LWdyYXktNzAwXCJcclxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgZm9udEZhbWlseTogJ3ZhcigtLWZvbnQtYm9keSknIH19XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxGY0dvb2dsZSBzaXplPXsyMn0gLz5cclxuICAgICAgICAgICAgICAgICAgVGnhur9wIHThu6VjIHbhu5tpIEdvb2dsZVxyXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZm9ybT5cclxuXHJcbiAgICAgICAgICAgIDxwXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1zbSBtdC04XCJcclxuICAgICAgICAgICAgICBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLXRleHQtZ3JheSknLCBmb250RmFtaWx5OiAndmFyKC0tZm9udC1ib2R5KScgfX1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIENoxrBhIGPDsyB0w6BpIGtob+G6o24/eycgJ31cclxuICAgICAgICAgICAgICA8TGlua1xyXG4gICAgICAgICAgICAgICAgdG89XCIvcmVnaXN0ZXJcIlxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCBob3Zlcjp1bmRlcmxpbmVcIlxyXG4gICAgICAgICAgICAgICAgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1wcmltYXJ5KScgfX1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICDEkMSDbmcga8O9IG5nYXlcclxuICAgICAgICAgICAgICA8L0xpbms+XHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuIl0sImZpbGUiOiJFOi9TdHVkeWluZyBEb2N1bWVudC9BXzIwMjZfV29yay9LMk4xLTI1LjI2L1NhbG9uSHViL2Zyb250ZW5kL3NyYy9wYWdlcy9hdXRoL0xvZ2luLmpzeCJ9