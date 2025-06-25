"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./styleInvoice.css";
import { motion } from "framer-motion";
import io from "socket.io-client";
import { orange } from "@mui/material/colors";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

interface Invoice {
  invoiceID: string;
  perID: number;
  receiverName: string;
  receiverPhone: string;
  fullAddress: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  detailID?: number;
  productID?: string;
  materialID?: number;
  unitPrice?: number;
  shippingFee?: number;
  totalPrice?: number;
  ringSize?: string | null;
  product_name?: string;
  material_name?: string;
  imageURL?: string;
  quantity?: number;
}

interface UserInfo {
  perID: number;
  full_name: string;
  phone_number: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

export default function Invoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPerID, setUserPerID] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [updatedAddress, setUpdatedAddress] = useState({
    receiverName: "",
    receiverPhone: "",
    fullAddress: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"; 

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
        setUserPerID(parsedUserInfo.perID);
      } catch (err) {
        setError("Lỗi khi lấy thông tin người dùng từ localStorage");
      }
    } else {
      setError("Vui lòng đăng nhập để xem đơn hàng");
    }
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!userPerID) return;
      try {
        const queryInvoiceID = searchParams.get("invoiceID");
        const response = await fetch(`${API_URL}/invoices?perID=${userPerID}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Lỗi khi lấy danh sách hóa đơn");
        }
        const sortedInvoices = [...result.data || []].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setInvoices(sortedInvoices);

        if (queryInvoiceID) {
          const invoice = result.data.find((inv: Invoice) => inv.invoiceID === queryInvoiceID);
          if (!invoice) {
            setError("Không tìm thấy hóa đơn với ID: " + queryInvoiceID);
          }
          localStorage.removeItem("pendingInvoiceID");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải hóa đơn");
      } finally {
        setLoading(false);
      }
    };

    if (userPerID) fetchInvoices();
  }, [userPerID, searchParams, API_URL]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  const term = e.target.value.toLowerCase();
  setSearchTerm(term);
  };

  const handleViewDetails = async (invoiceID: string) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceID}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi lấy chi tiết hóa đơn");
      }
      setSelectedInvoice(result.data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải chi tiết hóa đơn");
    }
  };

  const closeDetails = () => {
    setSelectedInvoice(null);
  };

  const handleConfirmReceived = async (invoiceID: string) => {
    try {
      const response = await fetch(`${API_URL}/invoices/confirm-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi xác nhận nhận hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Đã giao" } : inv))
      );
      socket.emit("invoiceStatusUpdate", { invoiceID, status: "Đã giao" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xác nhận nhận hàng");
    }
  };

  const handleCancelOrder = async (invoiceID: string) => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${API_URL}/invoices/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi hủy đơn hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Đã hủy" } : inv))
      );
      socket.emit("invoiceStatusUpdate", { invoiceID, status: "Đã hủy" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi hủy đơn hàng");
    }
  };

  const handleRequestReturn = async (invoiceID: string) => {
    try {
      const response = await fetch(`${API_URL}/invoices/request-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi yêu cầu trả hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Yêu cầu trả hàng" } : inv))
      );
      socket.emit("invoiceStatusUpdate", { invoiceID, status: "Yêu cầu trả hàng" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi yêu cầu trả hàng");
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedInvoice) return;

  try {
    const response = await fetch(`${API_URL}/invoices/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceID: selectedInvoice.invoiceID,
        receiverName: updatedAddress.receiverName,
        receiverPhone: updatedAddress.receiverPhone,
        fullAddress: updatedAddress.fullAddress,
        paymentMethod: selectedInvoice.paymentMethod,
        status: selectedInvoice.status,
      }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Lỗi khi cập nhật địa chỉ");
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceID === selectedInvoice.invoiceID
          ? {
              ...inv,
              receiverName: updatedAddress.receiverName,
              receiverPhone: updatedAddress.receiverPhone,
              fullAddress: updatedAddress.fullAddress,
            }
          : inv
      )
    );
    setSelectedInvoice((prev) =>
      prev
        ? {
            ...prev,
            receiverName: updatedAddress.receiverName,
            receiverPhone: updatedAddress.receiverPhone,
            fullAddress: updatedAddress.fullAddress,
          }
        : null
    );
    setIsEditingAddress(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Lỗi khi cập nhật địa chỉ");
  }
};  

  const handleContactSeller = (invoice: Invoice) => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (!storedUserInfo) {
      setError("Vui lòng đăng nhập để liên hệ người bán");
      return;
    }

    const userInfo: UserInfo = JSON.parse(storedUserInfo);
    const userChatKey = `chat_${userInfo.perID}`;
    let currentChat = localStorage.getItem(userChatKey)
      ? JSON.parse(localStorage.getItem(userChatKey) || "{}")
      : { name: "Admin", messages: [] };

    const messageText = `Yêu cầu hỗ trợ đơn hàng:\n- Mã đơn hàng: ${invoice.invoiceID}\n- Tên người nhận: ${invoice.receiverName}\n- Liên hệ: ${invoice.receiverPhone}\n- Sản phẩm: ${invoice.product_name || "N/A"}\n- Tổng tiền: ₫${invoice.totalPrice?.toLocaleString("vi-VN") || "N/A"}`;

    const messageData = {
      sender: "user",
      text: messageText,
      userName: userInfo.full_name,
      room: userInfo.full_name,
    };
    socket.emit("sendMessage", messageData, (response: any) => {
      if (response?.status !== "ok") {
        console.error("Gửi tin nhắn thất bại:", response?.error || "Unknown error");
      }
    });

    currentChat.messages.push({ sender: "user", text: messageText });
    localStorage.setItem(userChatKey, JSON.stringify(currentChat));

    socket.emit("joinRoom", userInfo.full_name);
    alert("Tin nhắn đã được gửi tới người bán!");
  };

  const statusToTabMap: { [key: string]: string } = {
    "Chờ xác nhận": "Chờ xác nhận",
    "Chờ thanh toán": "Chờ thanh toán",
    "Chờ lấy hàng": "Đang lấy hàng",
    "Chờ giao hàng": "Chờ giao hàng",
    "Đã giao": "Hoàn thành",
    "Đã hủy": "Đã hủy",
    "Yêu cầu trả hàng": "Trả hàng/Hoàn tiền",
  };

  const filteredInvoices = invoices.filter((invoice) => {
  if (activeTab === "Tất cả") {
    return (
      invoice.invoiceID.toLowerCase().includes(searchTerm) ||
      (invoice.product_name && invoice.product_name.toLowerCase().includes(searchTerm)) ||
      invoice.receiverName.toLowerCase().includes(searchTerm) ||
      invoice.receiverPhone.toLowerCase().includes(searchTerm)
    );
  }
  const tabStatus = Object.keys(statusToTabMap).find((key) => statusToTabMap[key] === activeTab);
  return (
    tabStatus &&
    invoice.status.toLowerCase() === tabStatus.toLowerCase() &&
    (invoice.invoiceID.toLowerCase().includes(searchTerm) ||
      (invoice.product_name && invoice.product_name.toLowerCase().includes(searchTerm)) ||
      invoice.receiverName.toLowerCase().includes(searchTerm) ||
      invoice.receiverPhone.toLowerCase().includes(searchTerm))
    );
  });

  const handleRetryMoMoPayment = async (invoice: Invoice) => {
  try {
    const response = await fetch(`${API_URL}/invoices/${invoice.invoiceID}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!result.success || !result.data[0]) {
      throw new Error("Không thể lấy thông tin hóa đơn");
    }
    const invoiceData = result.data[0];

    if (invoiceData.status !== "Chờ thanh toán") {
      throw new Error("Hóa đơn không ở trạng thái Chờ thanh toán");
    }

    const uniqueOrderId = `${invoice.invoiceID}-${Date.now()}`; // Tạo orderId duy nhất

    const momoResponse = await fetch(`${API_URL}/invoices/momo-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: uniqueOrderId,
        amount: Math.round(invoiceData.totalPrice),
        orderInfo: `Thanh toán đơn hàng ${invoice.invoiceID}`,
        redirectUrl: `${window.location.origin}/USER/invoices?invoiceID=${invoice.invoiceID}`,
        extraData: invoice.invoiceID, // Thêm extraData để lưu invoiceID
      }),
    });

    const momoResult = await momoResponse.json();
    if (momoResult.success && momoResult.payUrl) {
      // Lưu thông tin hóa đơn tạm thời để xử lý sau khi thanh toán thành công
      localStorage.setItem("pendingInvoiceID", invoice.invoiceID);
      window.location.href = momoResult.payUrl;
    } else {
      throw new Error(momoResult.message || "Không thể tạo liên kết thanh toán MoMo");
    }
  } catch (err) {
    console.error("Lỗi khi thử thanh toán lại:", err);
    setError(err instanceof Error ? err.message : "Lỗi khi tạo liên kết thanh toán MoMo");
  }
};

  // Định nghĩa các variants cho Framer Motion
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
        type: "spring",
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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  if (!userPerID) {
    return (
      <Layout>
        <motion.div
          className="container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="alert-warning"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Vui lòng đăng nhập để xem đơn hàng của bạn
          </motion.div>
        </motion.div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <motion.div
          className="container loading"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="spinner"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          ></motion.div>
          <motion.p
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Đang tải danh sách đơn hàng...
          </motion.p>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        id="content-invoice"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="search"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Image
              src="/images/search.png"
              alt="search"
              width={20}
              height={20}
              className="search-icon"
            />
            <input
              type="text"
              placeholder="Bạn có thể tìm kiếm theo ID đơn hàng hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </motion.div>

          <motion.ul
            className="nav-tabs"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {["Tất cả", "Chờ xác nhận","Chờ thanh toán", "Đang lấy hàng", "Chờ giao hàng", "Hoàn thành", "Đã hủy", "Trả hàng/Hoàn tiền"].map(
              (tab) => (
                <motion.li
                  key={tab}
                  className="nav-item"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    className={`nav-link ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                </motion.li>
              )
            )}
          </motion.ul>

          {error && (
            <motion.div
              className="alert-error"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {error}
            </motion.div>
          )}
          {filteredInvoices.length === 0 ? (
            <motion.div
              className="alert-info"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              Bạn chưa có đơn hàng nào
            </motion.div>
          ) : (
            <motion.div
              className="invoice-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.invoiceID}
                  className="invoice-card"
                  variants={itemVariants}
                >
                  <div className="card-header">
                    <div className="header-info">
                      <span className="order-id">
                        <i className="bi bi-truck"></i>
                        <Image
                          src="/images/icon-product.png"
                          alt="delete"
                          width={20}
                          height={20}
                          className="order-icon"
                        />
                        {invoice.invoiceID}
                      </span>
                      <span className="status-badge">{invoice.status}</span>
                    </div>
                  </div>
                  <div
                    className="card-body"
                    onClick={() => handleViewDetails(invoice.invoiceID)}
                  >
                    <div className="product-details">
                      <Image
                        src={
                          invoice.imageURL
                            ? `${API_URL}${invoice.imageURL}`
                            : "/images/addImage.png"
                        }
                        alt={invoice.product_name || "Product"}
                        width={80}
                        height={80}
                        className="product-image"
                      />
                      <div className="product-info">
                        <p className="name_invoices">{invoice.product_name || "N/A"}</p>
                        <p className="material">Chất liệu: {invoice.material_name || "N/A"}</p>
                        <p className="size">Size: {invoice.ringSize || "Không có"}</p>
                      </div>
                    </div>
                    <div className="price-invoice">
                      ₫{invoice.totalPrice?.toLocaleString("vi-VN") || "N/A"}
                    </div>
                  </div>

                  <div className="card-footer">
                    <p className="footer-note">
                      Vui lòng chỉ nhận "Đã nhận được hàng" khi đơn hàng đã được giao đến bạn và sản phẩm
                      không có vấn đề nào
                    </p>
                    <div className="action-buttons">
                      {invoice.status === "Chờ giao hàng" && (
                        <>
                          <motion.button
                            className="btn-received"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmReceived(invoice.invoiceID);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Đã Nhận Hàng
                          </motion.button>
                          <motion.button
                            className="btn-return"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestReturn(invoice.invoiceID);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Yêu Cầu Trả Hàng/Hoàn Tiền
                          </motion.button>
                          <motion.button
                            className="btn-contact"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSeller(invoice);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Liên Hệ Người Bán
                          </motion.button>
                        </>
                      )}
                      {invoice.status === "Đã giao" && (
                        <motion.button
                          className="btn-contact"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactSeller(invoice);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Liên Hệ Người Bán
                        </motion.button>
                      )}
                      {invoice.status === "Chờ xác nhận" && (
                        <>
                          <motion.button
                            className="btn-cancel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(invoice.invoiceID);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Hủy Đơn Hàng
                          </motion.button>
                          <motion.button
                            className="btn-contact"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSeller(invoice);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Liên Hệ Người Bán
                          </motion.button>
                        </>
                      )}
                      {invoice.status === "Chờ thanh toán" && (
                        <>
                          <motion.button
                            className="btn-retry-payment"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryMoMoPayment(invoice);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Thanh Toán 
                          </motion.button>
                          <motion.button
                            className="btn-cancel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(invoice.invoiceID);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Hủy Đơn Hàng
                          </motion.button>
                          <motion.button
                            className="btn-contact"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSeller(invoice);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Liên Hệ Người Bán
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}    
        </motion.div>
      </motion.div>
      {selectedInvoice && (
            <motion.div
              className="modal show"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
               onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDetails();
              }
            }}
            >
              <motion.div
                className="modal-dialog"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="modal-content"
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="modal-header">
                    <h5>Chi Tiết Đơn Hàng</h5>
                    <button className="close-btn" onClick={closeDetails}>
                      ×
                    </button>
                  </div>
                  <motion.div
                    className="modal-body"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="info-container">
                      <div className="delivery-info">
                        <div style={{ display: "flex", alignItems: "center",justifyContent:"space-between"}}>
                          <p>Địa Chỉ Nhận Hàng</p>
                          {["Chờ xác nhận", "Chờ thanh toán"].includes(selectedInvoice.status) && (
                            <button
                              className={`btn-edit-address ${isEditingAddress ? "btn-edit-address" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (isEditingAddress) {
                                  handleUpdateAddress(e);
                                } else {
                                  setIsEditingAddress(true);
                                  setUpdatedAddress({
                                    receiverName: selectedInvoice.receiverName,
                                    receiverPhone: selectedInvoice.receiverPhone,
                                    fullAddress: selectedInvoice.fullAddress,
                                  });
                                }
                              }}
                            >
                              {isEditingAddress ? "Lưu" : "Sửa"}
                            </button>
                          )}
                        </div>
                        {isEditingAddress ? (
                          <form className="edit-address-form">
                            <div className="input-group">
                              <input
                                type="text"
                                placeholder="Tên người nhận"
                                value={updatedAddress.receiverName}
                                onChange={(e) =>
                                  setUpdatedAddress({ ...updatedAddress, receiverName: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="input-group">
                              <input
                                type="text"
                                placeholder="Số điện thoại"
                                value={updatedAddress.receiverPhone}
                                onChange={(e) =>
                                  setUpdatedAddress({ ...updatedAddress, receiverPhone: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="input-group">
                              <input
                                type="text"
                                placeholder="Địa chỉ"
                                value={updatedAddress.fullAddress}
                                onChange={(e) =>
                                  setUpdatedAddress({ ...updatedAddress, fullAddress: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="edit-address-buttons">
                              <button
                                type="button"
                                className="btn-cancel-edit"
                                onClick={() => setIsEditingAddress(false)}
                              >
                                Hủy
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p>{selectedInvoice.receiverName} - {selectedInvoice.receiverPhone}</p>
                            <p>{selectedInvoice.fullAddress}</p>
                          </>
                        )}
                      </div>
                      <div className="divider"></div>
                      <div className="order-status">
                        <p>{selectedInvoice.status}</p>
                        <p>Ngày đặt: {new Date(selectedInvoice.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>

                    <div className="product-details-modal">
                      <div className="product-info-modal">
                        <Image
                          src={
                            selectedInvoice.imageURL
                              ? `${API_URL}${selectedInvoice.imageURL}`
                              : "/images/addImage.png"
                          }
                          alt={selectedInvoice.product_name || "Product"}
                          width={80}
                          height={80}
                          className="modal-product-image"
                        />
                        <div className="text-info">
                          <p>{selectedInvoice.product_name || "N/A"}</p>
                          <p>Phân loại hàng: {selectedInvoice.material_name || "N/A"}</p>
                          <p>x{selectedInvoice.quantity || 1}</p>
                        </div>
                        <div className="price-info">
                          <p>
                            ₫{(selectedInvoice.unitPrice || 0).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="price-details">
                      <div className="price-row">
                        <span>Tổng tiền hàng</span>
                        <span>
                          ₫
                          {((selectedInvoice.unitPrice || 0) * (selectedInvoice.quantity || 1)).toLocaleString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="price-row">
                        <span>Phí vận chuyển</span>
                        <span>
                          ₫{(selectedInvoice.shippingFee || 0).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="price-row" style={{ color:" #ee4d2d"}}>
                        <span>Thành tiền</span>
                        <span>
                          ₫{(selectedInvoice.totalPrice || 0).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="price-row">
                        <span>Phương thức thanh toán</span>
                        <span>{selectedInvoice.paymentMethod}</span>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    className="modal-footer"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.button
                      className="btn-close-modal"
                      onClick={closeDetails}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Đóng
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
    </Layout>
  );
}