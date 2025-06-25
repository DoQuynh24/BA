"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Header from '../components/Header';
import Footer from '../components/Footer';
import "./styleOrder.css";
import { motion } from 'framer-motion';

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface OrderData {
  productID: string;
  product_name: string;
  price: string;
  selectedMaterial: Material;
  imageURL: string;
  quantity: number;
  paymentExpiry?: string | null;
}

interface UserInfo {
  full_name: string;
  phone_number: string;
  perID: number;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Voucher {
  voucherID: string;
  code: string;
  discountType: 'percentage' | 'free_shipping';
  discountValue: number;
  status: string;
  expiresAt: string;
  expiryStatus: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

export default function Order() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    province: "",
    district: "",
    ringSize: "",
    perID: 0,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash-on-delivery");
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [stock, setStock] = useState<number>(0);
  const [originalStock, setOriginalStock] = useState<number>(0);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const shippingFee = 30000;

  useEffect(() => {
    if (isOrderSuccess) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigationEntry && navigationEntry.type === "reload") {
        return;
      }
      event.preventDefault();
      setShowLeavePopup(true);
      event.returnValue = "Đang thực hiện đặt hàng, bạn có chắc chắn muốn thoát không?";
    };

    const handleNavigation = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href) {
        const url = new URL(anchor.href, window.location.origin);
        if (url.pathname !== window.location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setTargetUrl(anchor.href);
          setShowLeavePopup(true);
        }
      }
    };

    const handlePopstate = () => {
      setShowLeavePopup(true);
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleNavigation, { capture: true });
    window.addEventListener("popstate", handlePopstate);
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleNavigation, { capture: true });
      window.removeEventListener("popstate", handlePopstate);
    };
  }, [isOrderSuccess]);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
        setCustomerInfo((prev) => ({
          ...prev,
          fullName: parsedUserInfo.full_name,
          phoneNumber: parsedUserInfo.phone_number,
          perID: parsedUserInfo.perID,
        }));
        fetchVouchers(parsedUserInfo.perID);
      } catch (error) {
        console.error("Lỗi khi parse userInfo từ localStorage:", error);
      }
    }

    const productID = searchParams.get("productID");
    const product_name = searchParams.get("product_name");
    const price = searchParams.get("price");
    const selectedMaterial = searchParams.get("selectedMaterial");
    const imageURL = searchParams.get("imageURL");

    if (productID && product_name && price && selectedMaterial && imageURL) {
      let parsedMaterial: Material;
      try {
        parsedMaterial = JSON.parse(selectedMaterial);
      } catch (error) {
        console.error("Lỗi phân tích JSON:", error);
        parsedMaterial = { materialID: 0, material_name: "Không xác định", price: 0 };
      }

      setOrderData({
        productID,
        product_name,
        price,
        selectedMaterial: parsedMaterial,
        imageURL,
        quantity: 1,
      });

      fetch(`${API_URL}/products/${productID}`)
        .then((response) => response.json())
        .then((response) => {
          if (response.success && response.data) {
            setStock(response.data.stock);
            setOriginalStock(response.data.stock);
          } else {
            setError("Không thể lấy thông tin tồn kho sản phẩm.");
          }
        })
        .catch((error) => {
          console.error("Lỗi khi lấy stock:", error);
          setError("Lỗi khi lấy thông tin tồn kho sản phẩm.");
        });
    } else {
      router.push("/USER/invoices");
    }

    fetch("https://provinces.open-api.vn/api/p/")
      .then((response) => response.json())
      .then((data) => setProvinces(data))
      .catch((error) => console.error("Lỗi khi lấy danh sách tỉnh:", error));
  }, [searchParams, router]);

  const fetchVouchers = async (userID: number) => {
    try {
        const response = await fetch(`${API_URL}/vouchers/user?userID=${userID}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || "Lỗi khi lấy danh sách voucher");
        }
        setVouchers(result.data || []);
        localStorage.setItem(`vouchers_${userID}`, JSON.stringify(result.data || []));
    } catch (error) {
        console.error("Lỗi khi lấy voucher:", error);
        setError("Không thể tải danh sách voucher.");
    }
};

  useEffect(() => {
    if (customerInfo.province) {
      fetch(`https://provinces.open-api.vn/api/p/${customerInfo.province}?depth=2`)
        .then((response) => response.json())
        .then((data) => setDistricts(data.districts || []))
        .catch((error) => {
          console.error("Lỗi khi lấy danh sách huyện:", error);
          setDistricts([]);
        });
    } else {
      setDistricts([]);
    }
  }, [customerInfo.province]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    setError("");
  };

  const increaseQuantity = () => {
    if (orderData) {
      const newQuantity = orderData.quantity + 1;
      if (newQuantity > stock) {
        setError("Sản phẩm không đủ số lượng!");
        return;
      }
      setError("");
      setOrderData((prev) => prev && { ...prev, quantity: newQuantity });
    }
  };

  const decreaseQuantity = () => {
    if (orderData && orderData.quantity > 1) {
      setOrderData((prev) => prev && { ...prev, quantity: prev.quantity - 1 });
      setError("");
    }
  };

  const calculateTotal = () => {
    if (!orderData) return 0;
    const productPrice = parseFloat(orderData.price) * orderData.quantity;
    let total = productPrice + shippingFee;
    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v.voucherID === selectedVoucher);
      if (voucher && voucher.expiryStatus !== "Đã hết hạn") {
        if (voucher.discountType === "free_shipping") {
          total = productPrice;
        } else if (voucher.discountType === "percentage") {
          total = productPrice * (1 - voucher.discountValue / 100) + shippingFee;
        }
      }
    }
    return total;
  };

  const updateStock = async (productID: string, newStock: number) => {
    try {
      const response = await fetch(`${API_URL}/products/${productID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi cập nhật stock");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật stock:", error);
      setError("Lỗi khi cập nhật tồn kho sản phẩm.");
    }
  };

  const updateLocalVoucherStatus = (voucherID: string, status: string) => {
    const updatedVouchers = vouchers.filter((v) => v.voucherID !== voucherID);
    setVouchers(updatedVouchers);
    localStorage.setItem(`vouchers_${customerInfo.perID}`, JSON.stringify(updatedVouchers));
  };

  const handleConfirmOrder = async () => {
    if (
      !customerInfo.fullName ||
      !customerInfo.phoneNumber ||
      !customerInfo.address ||
      !customerInfo.province ||
      !customerInfo.district
    ) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng");
      return;
    }

    if (!customerInfo.ringSize) {
      setError("Vui lòng nhập size nhẫn");
      return;
    }

    if (!customerInfo.perID) {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    if (!orderData) {
      setError("Dữ liệu đơn hàng không hợp lệ. Vui lòng thử lại.");
      return;
    }

    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v.voucherID === selectedVoucher);
      if (voucher && voucher.expiryStatus === "Đã hết hạn") {
        setError("Voucher đã hết hạn. Vui lòng chọn voucher khác.");
        return;
      }
    }

    const provinceName = provinces.find((p) => p.code === parseInt(customerInfo.province))?.name;
    const districtName = districts.find((d) => d.code === parseInt(customerInfo.district))?.name;
    if (!provinceName || !districtName) {
      setError("Tỉnh hoặc huyện không hợp lệ. Vui lòng chọn lại.");
      return;
    }
    const fullAddress = `${customerInfo.address}, ${districtName}, ${provinceName}`;

    const unitPrice = parseFloat(orderData.price);
    const invoiceData = {
      invoice: {
        perID: customerInfo.perID,
        receiverName: customerInfo.fullName,
        receiverPhone: customerInfo.phoneNumber,
        fullAddress,
        paymentMethod: selectedPaymentMethod,
        status: selectedPaymentMethod === "momo" ? "Chờ thanh toán" : "Chờ xác nhận",
      },
      invoiceDetail: {
        productID: orderData.productID,
        materialID: orderData.selectedMaterial.materialID,
        unitPrice,
        shippingFee,
        totalPrice: calculateTotal(),
        ringSize: customerInfo.ringSize,
        quantity: orderData.quantity,
        voucherID: selectedVoucher || null,
      },
      voucherID: selectedVoucher || null,
    };

    if (selectedPaymentMethod === "momo") {
      setShowConfirmPopup(true);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/invoices/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi tạo hóa đơn");
      }

      if (selectedVoucher) {
        updateLocalVoucherStatus(selectedVoucher, "used");
      }

      setIsLoading(false);
      setIsOrderSuccess(true);

      setTimeout(() => {
        router.push("/USER/invoices");
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      setError("Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const handleMoMoPayment = async () => {
    if (
      !customerInfo.fullName ||
      !customerInfo.phoneNumber ||
      !customerInfo.address ||
      !customerInfo.province ||
      !customerInfo.district
    ) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng");
      return;
    }

    if (!customerInfo.ringSize) {
      setError("Vui lòng nhập size nhẫn");
      return;
    }

    if (!customerInfo.perID) {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    if (!orderData) {
      setError("Dữ liệu đơn hàng không hợp lệ. Vui lòng thử lại.");
      return;
    }

    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v.voucherID === selectedVoucher);
      if (voucher && voucher.expiryStatus === "Đã hết hạn") {
        setError("Voucher đã hết hạn. Vui lòng chọn voucher khác.");
        return;
      }
    }

    const provinceName = provinces.find((p) => p.code === parseInt(customerInfo.province))?.name;
    const districtName = districts.find((d) => d.code === parseInt(customerInfo.district))?.name;
    if (!provinceName || !districtName) {
      setError("Tỉnh hoặc huyện không hợp lệ. Vui lòng chọn lại.");
      return;
    }
    const fullAddress = `${customerInfo.address}, ${districtName}, ${provinceName}`;

    const unitPrice = parseFloat(orderData.price);
    const invoiceData = {
      invoice: {
        perID: customerInfo.perID,
        receiverName: customerInfo.fullName,
        receiverPhone: customerInfo.phoneNumber,
        fullAddress,
        paymentMethod: selectedPaymentMethod,
        status: "Chờ thanh toán",
      },
      invoiceDetail: {
        productID: orderData.productID,
        materialID: orderData.selectedMaterial.materialID,
        unitPrice,
        shippingFee,
        totalPrice: calculateTotal(),
        ringSize: customerInfo.ringSize,
        quantity: orderData.quantity,
        voucherID: selectedVoucher || null,
      },
      voucherID: selectedVoucher || null,
    };

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/invoices/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi tạo hóa đơn");
      }

      const invoiceID = result.invoiceID;
      const uniqueOrderId = `${invoiceID}-${Date.now()}`;

      const momoResponse = await fetch(`${API_URL}/invoices/momo-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: uniqueOrderId,
          amount: Math.round(calculateTotal()),
          orderInfo: `Thanh toán đơn hàng ${invoiceID}`,
          redirectUrl: `${window.location.origin}/USER/invoices?invoiceID=${invoiceID}`,
          extraData: invoiceID,
        }),
      });

      const momoResult = await momoResponse.json();
      if (momoResult.success && momoResult.payUrl) {
        if (selectedVoucher) {
          updateLocalVoucherStatus(selectedVoucher, "used");
        }
        setIsOrderSuccess(true);
        window.location.href = momoResult.payUrl;
      } else {
        throw new Error(momoResult.message || "Không thể tạo liên kết thanh toán MoMo");
      }
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán MoMo:", error);
      setError(error instanceof Error ? error.message : "Lỗi khi tích hợp thanh toán MoMo. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  if (!orderData) return <div>Đang tải...</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12,
        duration: 0.6,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
  };

  const successOverlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const confirmPopupVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <Layout>
      <div id="content-order">
        <motion.h1
          className="order-title"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          Thanh Toán Sản Phẩm
        </motion.h1>
        <motion.div
          className="order-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="order-section order-product-info"
            variants={itemVariants}
          >
            <h2 className="section-title">Thông tin sản phẩm</h2>
            <div className="product-details">
              <Image
                src={orderData.imageURL}
                alt={orderData.product_name}
                width={120}
                height={120}
                className="product-image"
              />
              <div className="product-info">
                <p className="product-name">{orderData.product_name}</p>
                <p className="product-detail">
                  {orderData.selectedMaterial.material_name} -{" "}
                  {parseInt(orderData.price).toLocaleString("vi-VN")} ₫
                </p>
                <div className="quantity-control">
                  <motion.button
                    onClick={decreaseQuantity}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    -
                  </motion.button>
                  <span>{orderData.quantity}</span>
                  <motion.button
                    onClick={increaseQuantity}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>
                Size nhẫn <span className="required">*</span>
              </label>
              <input
                type="text"
                name="ringSize"
                value={customerInfo.ringSize}
                onChange={handleInputChange}
                placeholder="Nhập size nhẫn (ví dụ: 6, 7, 8...)"
                required
              />
            </div>
            <div className="total-section">
              <div className="form-group">
                <label>Chọn voucher</label>
                <select
                    name="voucher"
                    value={selectedVoucher}
                    onChange={(e) => setSelectedVoucher(e.target.value)}
                >
                    <option value="">Không sử dụng voucher</option>
                    {vouchers.filter(v => v.status === "unused" && v.expiryStatus !== "Đã hết hạn").map((voucher) => (
                        <option key={voucher.voucherID} value={voucher.voucherID}>
                            {voucher.discountType === "percentage"
                                ? `${voucher.discountValue}% OFF (${voucher.code}) - ${voucher.expiryStatus}`
                                : `Miễn phí vận chuyển (${voucher.code}) - ${voucher.expiryStatus}`}
                        </option>
                    ))}
                </select>
              </div>
              <p>Phí sản phẩm: {(parseFloat(orderData.price) * orderData.quantity).toLocaleString("vi-VN")} ₫</p>
              <p>Phí vận chuyển: {selectedVoucher && vouchers.find((v) => v.voucherID === selectedVoucher)?.discountType === "free_shipping" ? "0" : shippingFee.toLocaleString("vi-VN")} ₫</p>
              <p className="total-price">
                Thành tiền: {calculateTotal().toLocaleString("vi-VN")} ₫
              </p>
            </div>
          </motion.div>

          <motion.div
            className="order-section order-customer-info"
            variants={itemVariants}
          >
            <p className="section-title">THÔNG TIN GIAO HÀNG</p>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Họ và tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={customerInfo.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Số điện thoại <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={customerInfo.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Tỉnh/Thành phố <span className="required">*</span>
                </label>
                <select
                  name="province"
                  value={customerInfo.province}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Quận/Huyện <span className="required">*</span>
                </label>
                <select
                  name="district"
                  value={customerInfo.district}
                  onChange={handleInputChange}
                  required
                  disabled={!customerInfo.province}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Địa chỉ giao hàng <span className="required">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ giao hàng (số nhà, tên đường, ...)"
                required
              />
            </div>

            <div className="payment-methods">
              <p className="section-title">PHƯƠNG THỨC THANH TOÁN</p>
              <motion.div
                className="payment-options"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { method: "cash-on-delivery", icon: "/images/receive.png", label: "Khi nhận hàng", width: 35, height: 35 },
                  { method: "atm", icon: "/images/atm.png", label: "Thẻ ATM nội địa", width: 50, height: 50 },
                  { method: "momo", icon: "/images/momo.png", label: "MoMo", width: 50, height: 50 },
                ].map((option) => (
                  <motion.div
                    key={option.method}
                    className={`payment-option ${selectedPaymentMethod === option.method ? "selected" : ""}`}
                    onClick={() => handlePaymentMethodChange(option.method)}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Image src={option.icon} alt={option.label} width={option.width} height={option.height} />
                    <p>{option.label}</p>
                    <span className="status">
                      {selectedPaymentMethod === option.method ? "Đã áp dụng" : "Chưa áp dụng"}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {isOrderSuccess && (
              <motion.div
                className="success-overlay"
                variants={successOverlayVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="success-animation">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                  <p>Đặt hàng thành công!</p>
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                className="loading-overlay"
                variants={successOverlayVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="spinner"></div>
                <p>Đang xử lý đơn hàng...</p>
              </motion.div>
            )}

            {showLeavePopup && (
              <motion.div
                className="qr-code-popup"
                variants={confirmPopupVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="qr-code-content">
                  <h3>Xác nhận rời trang</h3>
                  <p>Đang thực hiện đặt hàng, bạn có chắc muốn rời trang?</p>
                  <div className="qr-code-buttons">
                    <motion.button
                      className="qr-confirm-btn"
                      onClick={() => {
                        setShowLeavePopup(false);
                        if (targetUrl) {
                          window.location.href = targetUrl;
                        } else {
                          window.history.back();
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      OK
                    </motion.button>
                    <motion.button
                      className="qr-cancel-btn"
                      onClick={() => {
                        setShowLeavePopup(false);
                        setTargetUrl(null);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Hủy
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {showConfirmPopup && (
              <motion.div
                className="qr-code-popup"
                variants={confirmPopupVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="qr-code-content">
                  <h3>Xác nhận đặt hàng</h3>
                  <p>Bạn có chắc chắn muốn thanh toán bằng MoMo?</p>
                  <div className="qr-code-buttons">
                    <motion.button
                      className="qr-confirm-btn"
                      onClick={async () => {
                        setShowConfirmPopup(false);
                        await handleMoMoPayment();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      OK
                    </motion.button>
                    <motion.button
                      className="qr-cancel-btn"
                      onClick={() => setShowConfirmPopup(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Hủy
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.p
                className="error-message"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              className="confirm-order-btn"
              onClick={handleConfirmOrder}
              disabled={isLoading}
              variants={itemVariants}
              whileHover={{ scale: 1.05, backgroundColor: isLoading ? '#ccc' : '#a64ca6' }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}