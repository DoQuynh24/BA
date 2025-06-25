"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import "./styleHome.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Invoice {
  invoiceID: string;
  perID: number;
  receiverName: string;
  status: string;
  createdAt: string;
  product_name?: string;
  totalPrice?: number;
  quantity?: number;
}

interface Product {
  productID?: string;
  product_name: string;
  material?: string;
  style?: string;
}

interface User {
  perID: string;
  full_name: string;
}

interface Activity {
  type: "admin" | "user";
  message: string;
  timestamp: string;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface ProductData {
  product_name: string;
  quantity: number;
}

interface JewelryInsights {
  weddingSeason: { orders: number; months: string };
}

const AdminHome: React.FC = () => {
  // State
  const [insights, setInsights] = useState<JewelryInsights>({
    weddingSeason: { orders: 0, months: "" },
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterTime, setFilterTime] = useState<"today" | "week" | "month" | "all" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"admin" | "user">("user");
  const [chartTab, setChartTab] = useState<"revenue" | "products">("revenue");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Định nghĩa biến môi trường
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Effect để lấy dữ liệu
  useEffect(() => {
    fetchData();
  }, []);

  // Cập nhật dữ liệu khi thay đổi ngày
  useEffect(() => {
    if (filterTime === "custom" && startDate && endDate && invoices.length > 0) {
      calculateRevenueData(invoices, filterTime, startDate, endDate);
      calculateProductData(invoices, filterTime, startDate, endDate);
      calculateJewelryInsights(invoices, products, filterTime, startDate, endDate);
    }
  }, [startDate, endDate, invoices, products]);

  // Hàm lấy dữ liệu từ API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoices, products, users] = await fetchApiData();
      setInvoices(invoices);
      setProducts(products);
      calculateJewelryInsights(invoices, products, filterTime);
      calculateRevenueData(invoices, filterTime);
      calculateProductData(invoices, filterTime);
      const activities = generateActivities(invoices, products);
      setActivities(activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiData = async (): Promise<[Invoice[], Product[], User[]]> => {
    const [invoiceResponse, productResponse, userResponse] = await Promise.all([
      axios.get(`${API_URL}/invoices/all`),
      axios.get(`${API_URL}/products`),
      axios.get(`${API_URL}/users`),
    ]);

    if (!invoiceResponse.data.success) {
      throw new Error(invoiceResponse.data.message || "Lỗi khi lấy danh sách hóa đơn");
    }
    if (!productResponse.data.success) {
      throw new Error(productResponse.data.message || "Lỗi khi lấy danh sách sản phẩm");
    }
    if (!userResponse.data.success) {
      throw new Error(userResponse.data.message || "Lỗi khi lấy danh sách người dùng");
    }

    return [
      invoiceResponse.data.data || [],
      productResponse.data.data || [],
      userResponse.data.data || [],
    ];
  };

  // Tính toán jewelry insights
  const calculateJewelryInsights = (
    invoices: Invoice[],
    products: Product[],
    timeFilter: typeof filterTime,
    start?: string,
    end?: string
  ) => {
    const now = new Date();
    const filteredInvoices = invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      if (timeFilter === "today") return createdAt.toDateString() === now.toDateString();
      if (timeFilter === "week") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return createdAt >= oneWeekAgo;
      }
      if (timeFilter === "month") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return createdAt >= oneMonthAgo;
      }
      if (timeFilter === "custom" && start && end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return createdAt >= startTime && createdAt <= endTime;
      }
      return true;
    });

    const monthOrders: { [key: string]: number } = {};
    filteredInvoices.forEach((invoice) => {
      const month = new Date(invoice.createdAt).getMonth() + 1;
      const monthKey = `Tháng ${month}`;
      monthOrders[monthKey] = (monthOrders[monthKey] || 0) + 1;
    });
    const peakMonths = Object.entries(monthOrders)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([month]) => month);
    const weddingSeasonOrders = peakMonths.reduce(
      (sum, month) => sum + (monthOrders[month] || 0),
      0
    );

    setInsights({
      weddingSeason: {
        orders: weddingSeasonOrders,
        months: peakMonths.join(", ") || "Chưa có dữ liệu",
      },
    });
  };

  // Tính toán dữ liệu doanh thu
  const calculateRevenueData = (
    invoices: Invoice[],
    timeFilter: typeof filterTime,
    start?: string,
    end?: string
  ) => {
    const now = new Date();
    const filteredInvoices = invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      if (timeFilter === "today") return createdAt.toDateString() === now.toDateString();
      if (timeFilter === "week") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return createdAt >= oneWeekAgo;
      }
      if (timeFilter === "month") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return createdAt >= oneMonthAgo;
      }
      if (timeFilter === "custom" && start && end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return createdAt >= startTime && createdAt <= endTime;
      }
      return true;
    });

    const revenueMap: { [key: string]: number } = {};
    filteredInvoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt).toLocaleDateString("vi-VN");
      revenueMap[date] = (revenueMap[date] || 0) + (invoice.totalPrice || 0);
    });

    const revenueData = Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setRevenueData(revenueData);
  };

  // Tính toán dữ liệu sản phẩm
  const calculateProductData = (
    invoices: Invoice[],
    timeFilter: typeof filterTime,
    start?: string,
    end?: string
  ) => {
    const now = new Date();
    const filteredInvoices = invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      if (timeFilter === "today") return createdAt.toDateString() === now.toDateString();
      if (timeFilter === "week") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return createdAt >= oneWeekAgo;
      }
      if (timeFilter === "month") {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return createdAt >= oneMonthAgo;
      }
      if (timeFilter === "custom" && start && end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return createdAt >= startTime && createdAt <= endTime;
      }
      return true;
    });

    const productMap: { [key: string]: number } = {};
    filteredInvoices.forEach((invoice) => {
      const productName = invoice.product_name || "Unknown";
      productMap[productName] = (productMap[productName] || 0) + (invoice.quantity || 1);
    });

    const productData = Object.entries(productMap)
      .map(([product_name, quantity]) => ({ product_name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Giới hạn top 5 sản phẩm

    setProductData(productData);
  };

  // Tạo danh sách hoạt động
  const generateActivities = (invoices: Invoice[], products: Product[]): Activity[] => {
    const uniqueInvoices = Array.from(
      new Map(invoices.map((invoice) => [invoice.invoiceID, invoice])).values()
    );
    const uniqueProducts = Array.from(
      new Map(products.map((product) => [product.productID, product])).values()
    );

    const userActivities = generateUserActivities(uniqueInvoices);
    const adminActivities = generateAdminActivities(uniqueInvoices, uniqueProducts);

    return [...userActivities, ...adminActivities];
  };

  // Tạo hoạt động người dùng
  const generateUserActivities = (invoices: Invoice[]): Activity[] => {
    return invoices
      .filter((invoice) =>
        ["Chờ xác nhận", "Đã giao", "Đã hủy", "Yêu cầu trả hàng"].includes(invoice.status)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((invoice) => ({
        type: "user" as const,
        message: `${invoice.receiverName} ${getUserActivityMessage(invoice.status)} hóa đơn ${invoice.invoiceID} (${invoice.product_name || "N/A"})`,
        timestamp: new Date(invoice.createdAt).toLocaleString("vi-VN"),
      }));
  };

  // Tạo hoạt động admin
  const generateAdminActivities = (invoices: Invoice[], products: Product[]): Activity[] => {
    const invoiceActivities = invoices
      .filter((invoice) =>
        ["Chờ xác nhận", "Chờ lấy hàng", "Chờ giao hàng", "Đã hủy", "Yêu cầu trả hàng"].includes(
          invoice.status
        )
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((invoice) => ({
        type: "admin" as const,
        message: `Admin đã cập nhật trạng thái hóa đơn ${invoice.invoiceID} thành "${invoice.status}"`,
        timestamp: new Date(invoice.createdAt).toLocaleString("vi-VN"),
      }));

    return invoiceActivities;
  };

  // Xử lý thay đổi bộ lọc thời gian
  const handleFilterChange = (filter: typeof filterTime) => {
    setFilterTime(filter);
    if (filter !== "custom") {
      setStartDate("");
      setEndDate("");
      calculateRevenueData(invoices, filter);
      calculateProductData(invoices, filter);
      calculateJewelryInsights(invoices, products, filter);
    }
  };

  // Ánh xạ trạng thái hóa đơn thành thông điệp người dùng
  const getUserActivityMessage = (status: string): string => {
    switch (status) {
      case "Chờ xác nhận":
        return "đã đặt";
      case "Đã giao":
        return "đã xác nhận hoàn thành";
      case "Đã hủy":
        return "đã hủy";
      case "Yêu cầu trả hàng":
        return "đã yêu cầu trả hàng";
      default:
        return "";
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  // Dữ liệu biểu đồ doanh thu
  const barChartData = {
    labels: revenueData.map((item) => item.date),
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: revenueData.map((item) => item.revenue),
        backgroundColor: revenueData.map((item) =>
          item.revenue < 10000000 ? "#ffc107" : item.revenue <= 30000000 ? "#28a745" : "#a64ca6"
        ),
        borderColor: revenueData.map((item) =>
          item.revenue < 10000000 ? "#ffc107" : item.revenue <= 30000000 ? "#28a745" : "#a64ca6"
        ),
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu biểu đồ sản phẩm
  const barChartProductData = {
    labels: productData.map((item) => item.product_name),
    datasets: [
      {
        label: "Số lượng bán",
        data: productData.map((item) => item.quantity),
        backgroundColor: productData.map((item, index) =>
          index % 3 === 0 ? "#a64ca6" : index % 3 === 1 ? "#28a745" : "#ffc107"
        ),
        borderColor: productData.map((item, index) =>
          index % 3 === 0 ? "#a64ca6" : index % 3 === 1 ? "#28a745" : "#ffc107"
        ),
        borderWidth: 1,
      },
    ],
  };

  // Cấu hình biểu đồ doanh thu
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 14 },
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw || 0)}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Ngày",
          font: { size: 14 },
          color: "#333",
        },
      },
      y: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Doanh thu (VND)",
          font: { size: 14 },
          color: "#333",
        },
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number): string => {
            const value = typeof tickValue === "string" ? parseFloat(tickValue) : tickValue;
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Cấu hình biểu đồ sản phẩm
  const barChartProductOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 14 },
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw || 0} sản phẩm`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Sản phẩm",
          font: { size: 14 },
          color: "#333",
        },
      },
      y: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Số lượng bán",
          font: { size: 14 },
          color: "#333",
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (tickValue: string | number): string => {
            return `${tickValue} sản phẩm`;
          },
        },
      },
    },
  };

  // Render giao diện
  if (loading) {
    return (
      <Layout>
        <div className="loading">Đang tải dữ liệu...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="main-sections">
        <div className="left-section">
          <div className="chart-card">
            <div className="filter-menu">
              <div
                className={`filter-tab ${chartTab === "revenue" ? "active" : ""}`}
                onClick={() => setChartTab("revenue")}
              >
                Doanh thu
              </div>
              <div
                className={`filter-tab ${chartTab === "products" ? "active" : ""}`}
                onClick={() => setChartTab("products")}
              >
                Sản phẩm
              </div>
              {["today", "week", "month", "all", "custom"].map((filter) => (
                <div
                  key={filter}
                  className={`filter-tab ${filterTime === filter ? "active" : ""}`}
                  onClick={() => handleFilterChange(filter as typeof filterTime)}
                >
                  {filter === "today"
                    ? "Hôm nay"
                    : filter === "week"
                    ? "7 ngày qua"
                    : filter === "month"
                    ? "30 ngày qua"
                    : filter === "all"
                    ? "Tất cả"
                    : "Tùy chỉnh"}
                </div>
              ))}
            </div>
            {filterTime === "custom" && (
              <div className="filter">
                <div className="date">
                  <label>Từ ngày:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Chọn ngày bắt đầu"
                  />
                </div>
                <div className="date">
                  <label>Đến ngày:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-label="Chọn ngày kết thúc"
                  />
                </div>
              </div>
            )}
            <div className="bar-chart-container">
              {chartTab === "revenue" ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <Bar data={barChartProductData} options={barChartProductOptions} />
              )}
              <div className="insight-content">
                {chartTab === "revenue" ? (
                  <>
                    <span className="insight-value">{insights.weddingSeason.orders} đơn</span>
                    <p>
                      {insights.weddingSeason.months
                        ? `Tăng mạnh ở ${insights.weddingSeason.months}. Chuẩn bị kho hàng ngay!`
                        : "Chưa có dữ liệu mùa cưới"}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="insight-value">
                      {productData.length > 0
                        ? `${productData[0].product_name}: ${productData[0].quantity} sản phẩm`
                        : "Chưa có dữ liệu"}
                    </span>
                    <p>
                      {productData.length > 0
                        ? "Sản phẩm bán chạy nhất trong khoảng thời gian đã chọn."
                        : "Không có sản phẩm nào được bán."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="right-section">
          <div className="activity-card">
            <h3>Hoạt động gần đây</h3>
            <div className="activity-tabs">
              {["user", "admin"].map((tab) => (
                <div
                  key={tab}
                  className={`activity-chip ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab as "admin" | "user")}
                >
                  {tab === "user" ? "Người dùng" : "Admin"}
                </div>
              ))}
            </div>
            <div className="activity-list">
              {activities.filter((activity) => activity.type === activeTab).length > 0 ? (
                activities
                  .filter((activity) => activity.type === activeTab)
                  .map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-dot"></span>
                      <p>{activity.message}</p>
                      <span className="activity-time">{activity.timestamp}</span>
                    </div>
                  ))
              ) : (
                <p>Chưa có hoạt động nào</p>
              )}
            </div>
          </div>
          <div className="video-card">
            <h3>Video quảng bá</h3>
            <div className="video-placeholder">
              <video
                width="100%"
                height="100%"
                controls
                autoPlay
                muted
                loop
                aria-label="Video quảng bá trang sức Tierra.vn"
              >
                <source src="/images/video1.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;
