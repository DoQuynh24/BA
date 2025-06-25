"use client";

import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import axios from "axios";
import { FaSearch, FaChevronDown, FaChevronUp, FaCrown, FaGem, FaSortUp, FaSortDown } from "react-icons/fa";
import "./styleUser.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface User {
  perID: string;
  phone_number: string;
  full_name: string;
  email?: string;
  created_at: string;
}

interface Invoice {
  perID: string;
  invoiceID: string;
  createdAt: string;
  product_name?: string;
  totalPrice?: number;
}

interface SearchSuggestion {
  full_name: string;
  phone_number: string;
  perID: string;
}

interface VoucherType {
  voucherTypeID: string;
  discountType: 'percentage' | 'free_shipping';
  discountValue: number;
  quantity: number;
  winRate: number;
  validityDays: number;
}

export default function AdminUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPurchaseCount, setFilterStatusPurchaseCount] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>("");
  const [voucherSendUserID, setVoucherSendUserID] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchData();
    fetchVoucherTypes();
  }, []);

  const fetchData = async () => {
    try {
      const userResponse = await axios.get(`${API_URL}/users`);
      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "Lỗi khi lấy danh sách người dùng");
      }
      const userData = userResponse.data.data || [];

      const invoiceResponse = await axios.get(`${API_URL}/invoices/all`);
      if (!invoiceResponse.data.success) {
        throw new Error(invoiceResponse.data.message || "Lỗi khi lấy danh sách hóa đơn");
      }
      const invoiceData = invoiceResponse.data.data || [];

      const customerIds = new Set(invoiceData.map((invoice: Invoice) => invoice.perID));
      const customers = userData.filter((user: User) => customerIds.has(user.perID));

      setUsers(customers);
      setFilteredUsers(customers);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/voucher`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi lấy danh sách loại voucher");
      }
      setVoucherTypes(response.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải danh sách loại voucher");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterStatus, filterPurchaseCount);

    if (term) {
      const suggestions = users
        .filter(
          (user) =>
            user.full_name.toLowerCase().includes(term) ||
            user.phone_number.toLowerCase().includes(term)
        )
        .slice(0, 5)
        .map((userInfo) => ({
          full_name: userInfo.full_name,
          phone_number: userInfo.phone_number,
          perID: userInfo.perID,
        }));
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.full_name);
    setSearchSuggestions([]);
    applyFilters(suggestion.full_name.toLowerCase(), filterStatus, filterPurchaseCount);
  };

  const handleFilterStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterStatus(value);
    applyFilters(searchTerm, value, filterPurchaseCount);
  };

  const handleFilterPurchaseCount = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterStatusPurchaseCount(value);
    applyFilters(searchTerm, filterStatus, value);
  };

  const applyFilters = (search: string, status: string, purchaseCount: string) => {
    setCurrentPage(1);
    let filtered = [...users];

    if (search) {
      filtered = filtered.filter((user) =>
        user.full_name.toLowerCase().includes(search) ||
        user.phone_number.toLowerCase().includes(search)
      );
    }

    if (status !== "All") {
      filtered = filtered.filter((user) => {
        const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
        const totalSpent = userInvoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
        const purchaseCount = userInvoices.length;
        if (status === "Kim cương") return totalSpent >= 50000000 || purchaseCount >= 20;
        if (status === "Vàng") return (totalSpent >= 20000000 && totalSpent < 50000000) || (purchaseCount >= 10 && purchaseCount < 20);
        if (status === "Bạc") return (totalSpent >= 5000000 && totalSpent < 20000000) || (purchaseCount >= 3 && purchaseCount < 10);
        if (status === "Đồng") return totalSpent < 5000000 || purchaseCount < 3;
        return true;
      });
    }

    if (purchaseCount !== "All") {
      const [min, max] = purchaseCount.split("-").map(Number);
      filtered = filtered.filter((user) => {
        const orderCount = invoices.filter((inv) => inv.perID === user.perID).length;
        return max ? orderCount >= min && orderCount <= max : orderCount >= min;
      });
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (sortConfig.key === "full_name") {
          return sortConfig.direction === "asc"
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        }
        if (sortConfig.key === "purchaseCount") {
          const countA = invoices.filter((inv) => inv.perID === a.perID).length;
          const countB = invoices.filter((inv) => inv.perID === b.perID).length;
          return sortConfig.direction === "asc" ? countA - countB : countB - countA;
        }
        if (sortConfig.key === "lastPurchase") {
          const lastA = invoices
            .filter((inv) => inv.perID === a.perID)
            .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt;
          const lastB = invoices
            .filter((inv) => inv.perID === b.perID)
            .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt;
          const timeA = lastA ? new Date(lastA).getTime() : 0;
          const timeB = lastB ? new Date(lastB).getTime() : 0;
          return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
        }
        return 0;
      });
    }

    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("vi-VN");

  const getCustomerStatus = (user: User): string => {
    const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
    const totalSpent = userInvoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
    const purchaseCount = userInvoices.length;
    if (totalSpent >= 50000000 || purchaseCount >= 20) return "Kim cương";
    if ((totalSpent >= 20000000 && totalSpent < 50000000) || (purchaseCount >= 10 && purchaseCount < 20)) return "Vàng";
    if ((totalSpent >= 5000000 && totalSpent < 20000000) || (purchaseCount >= 3 && purchaseCount < 10)) return "Bạc";
    return "Đồng";
  };

  const getLastProduct = (user: User): string => {
    const lastOrder = invoices
      .filter((inv) => inv.perID === user.perID)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return lastOrder?.product_name || "N/A";
  };

  const toggleExpand = (perID: string) => {
    setExpandedUser(expandedUser === perID ? null : perID);
  };

  const openSendVoucherModal = (perID: string) => {
    setVoucherSendUserID(perID);
    setSelectedVoucherType("");
    setVoucherError("");
  };

  const closeSendVoucherModal = () => {
    setVoucherSendUserID(null);
    setSelectedVoucherType("");
    setVoucherError("");
  };

  const handleSendOffer = async () => {
    if (!selectedVoucherType) {
      setVoucherError("Vui lòng chọn loại voucher");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/voucher/send`, {
        userID: voucherSendUserID,
        voucherTypeID: selectedVoucherType,
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi gửi voucher");
      }
      alert(`Gửi voucher thành công cho khách hàng ${voucherSendUserID}`);
      closeSendVoucherModal();
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : "Lỗi khi gửi voucher");
    }
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    applyFilters(searchTerm, filterStatus, filterPurchaseCount);
  };

  const indexOfFirstUser = (currentPage - 1) * usersPerPage;
  const indexOfLastUser = currentPage * usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Layout>
        <div className="loading">Đang tải danh sách khách hàng...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-report">
        <div className="report">
          <div className="filter">
            <div className="wrapper">
              <FaSearch className="search" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                value={searchTerm}
                onChange={handleSearch}
                className="input"
              />
              {searchSuggestions.length > 0 && (
                <div className="suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <p>{suggestion.full_name} ({suggestion.phone_number})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select
              className="select"
              value={filterStatus}
              onChange={handleFilterStatus}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Kim cương">VIP Kim cương</option>
              <option value="Vàng">VIP Vàng</option>
              <option value="Bạc">Bạc</option>
              <option value="Đồng">Đồng</option>
            </select>
            <select
              className="select"
              value={filterPurchaseCount}
              onChange={handleFilterPurchaseCount}
            >
              <option value="All">Tất cả số lần mua</option>
              <option value="0-2">0-2 lần</option>
              <option value="3-9">3-9 lần</option>
              <option value="10">10+ lần</option>
            </select>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {filteredUsers.length === 0 ? (
          <div className="alert-info">Chưa có khách hàng nào</div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <div className="users-table">
                <div className="table-header">
                  <div className="column">STT</div>
                  <div className="column sortable" onClick={() => handleSort("full_name")}>
                    Tên {sortConfig?.key === "full_name" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                  <div className="column sortable" onClick={() => handleSort("purchaseCount")}>
                    Số lần mua {sortConfig?.key === "purchaseCount" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                  <div className="column sortable" onClick={() => handleSort("lastPurchase")}>
                    Lần mua cuối {sortConfig?.key === "lastPurchase" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                  <div className="column-user">Sản phẩm gần nhất</div>
                  <div className="column-user">Trạng thái</div>
                  <div className="column-user"></div>
                </div>
                {currentUsers.map((user, index) => {
                  const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
                  const purchaseCount = userInvoices.length;
                  const lastPurchase = userInvoices.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )[0]?.createdAt;
                  const status = getCustomerStatus(user);
                  const lastProduct = getLastProduct(user);
                  const isExpanded = expandedUser === user.perID;

                  return (
                    <React.Fragment key={index}>
                      <div className="table-row" onClick={() => toggleExpand(user.perID)}>
                        <div className="column-user">{indexOfFirstUser + index + 1}</div>
                        <div className="column-user">{user.full_name}</div>
                        <div className="column-user">{purchaseCount}</div>
                        <div className="column-user">{lastPurchase ? formatDate(lastPurchase) : "N/A"}</div>
                        <div className="column-user">{lastProduct}</div>
                        <div className="column-user">
                          <span className={`status-badge-user ${status.toLowerCase().replace(" ", "-")}`}>
                            {status === "Kim cương" && <FaGem className="fa-gem-icon" />}
                            {status === "Kim cương" || status === "Vàng" ? <FaCrown className="fa-crown-icon" /> : null}
                            {status}
                          </span>
                        </div>
                        <div className="column-user">
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="table-expand">
                          <div className="content">
                            <p><strong>Liên hệ:</strong> {user.phone_number}</p>
                            <h5>Lịch sử mua hàng</h5>
                            {userInvoices.length > 0 ? (
                              userInvoices
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((inv, idx) => (
                                  <p key={idx}>
                                    {formatDate(inv.createdAt)} - {inv.product_name || "N/A"}
                                  </p>
                                ))
                            ) : (
                              <p>Chưa có đơn hàng nào</p>
                            )}
                            {(status === "Kim cương" || status === "Vàng") && (
                              <div className="offer-container">
                                <button
                                  className="offer-btn"
                                  onClick={() => openSendVoucherModal(user.perID)}
                                >
                                  Gửi ưu đãi {status}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="use-pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`page ${currentPage === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {voucherSendUserID && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Gửi Voucher</h5>
                <button className="close-btn" onClick={closeSendVoucherModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <label>Chọn loại voucher:</label>
                <select
                  className="select"
                  value={selectedVoucherType}
                  onChange={(e) => setSelectedVoucherType(e.target.value)}
                >
                  <option value="">Chọn loại voucher</option>
                  {voucherTypes.map((voucher) => (
                    <option key={voucher.voucherTypeID} value={voucher.voucherTypeID}>
                      {voucher.discountType === "percentage"
                        ? `${voucher.discountValue}% - Còn lại: ${voucher.quantity}`
                        : `Miễn phí vận chuyển - Còn lại: ${voucher.quantity}`}
                    </option>
                  ))}
                </select>
                {voucherError && <p className="error">{voucherError}</p>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSendOffer} disabled={!selectedVoucherType}>
                  Gửi
                </button>
                <button className="btn btn-secondary" onClick={closeSendVoucherModal}>
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}