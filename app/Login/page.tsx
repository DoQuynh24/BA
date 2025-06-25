"use client";
import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./styleLogin.css";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        phone_number: phoneNumber,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        const userInfo = {
          full_name: response.data.full_name || "Người dùng",
          phone_number: phoneNumber,
          perID: response.data.perID,
          role: response.data.role,
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        const userFavouritesKey = `favouriteProducts_${response.data.perID}`;
        const storedFavourites = localStorage.getItem(userFavouritesKey);
        if (!storedFavourites) {
          localStorage.setItem(userFavouritesKey, JSON.stringify([]));
        }

        if (response.data.role === "Admin") {
          router.push("/ADMIN/home");
        } else if (response.data.role === "Khách hàng") {
          router.push("/USER/Home");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với điều khoản dịch vụ!");
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        full_name: fullName,
        phone_number: phoneNumber,
        password,
      });

      if (response.data.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setActiveTab("login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setError("");
    setPhoneNumber("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        phone_number: phoneNumber,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.data.success) {
        alert(response.data.message);
        setIsForgotPassword(false);
        setPhoneNumber("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    }
  };

  return (
    <div className="auth-page">
      <h1>Jewelry</h1>
      <div className="auth-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "login" ? "active" : ""}`}
            onClick={() => { setActiveTab("login"); setIsForgotPassword(false); }}
          >
            Đăng nhập
          </button>
          <button
            className={`tab-button ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "login" ? (
            isForgotPassword ? (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="input-group">
                  <Image src="/images/phone_number.png" alt="phone" width={18} height={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                  <input
                    type={showForgotPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                  >
                    <Image
                      src={showForgotPassword ? "/images/eye-off.png" : "/images/eye.png"}
                      alt="toggle password"
                      width={18}
                      height={18}
                    />
                  </button>
                </div>
                <div className="input-group">
                  <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Image
                      src={showConfirmPassword ? "/images/eye-off.png" : "/images/eye.png"}
                      alt="toggle password"
                      width={18}
                      height={18}
                    />
                  </button>
                </div>
                <div className="forgot-password">
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Bạn muốn đăng nhập?
                  </button>
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">
                  ĐẶT LẠI MẬT KHẨU
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="input-group">
                  <Image src="/images/phone_number.png" alt="user" width={18} height={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    <Image
                      src={showLoginPassword ? "/images/eye-off.png" : "/images/eye.png"}
                      alt="toggle password"
                      width={18}
                      height={18}
                    />
                  </button>
                </div>
                <div className="forgot-password">
                  <button type="button" onClick={handleForgotPassword} className="forgot-password-link">
                    Quên mật khẩu?
                  </button>
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">
                  ĐĂNG NHẬP
                </button>
              </form>
            )
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-group">
                <Image src="/images/user.png" alt="user" width={18} height={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Image src="/images/phone_number.png" alt="phone" width={18} height={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  <Image
                    src={showRegisterPassword ? "/images/eye-off.png" : "/images/eye.png"}
                    alt="toggle password"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setActiveTab("login")}
                >
                  Bạn đã có tài khoản?
                </button>
              </div>
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label>
                  Tôi đồng ý với <a href="/terms">điều khoản dịch vụ</a>
                </label>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="auth-button">
                ĐĂNG KÝ
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}