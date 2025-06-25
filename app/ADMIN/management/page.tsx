"use client";

import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import "./styleManagement.css";

interface VoucherType {
  voucherTypeID: string;
  discountType: "percentage" | "free_shipping";
  discountValue: number;
  quantity: number;
  winRate: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  expiryStatus?: string;
}

interface User {
  perID: string;
  full_name: string;
}

interface VoucherHistory {
  voucherID: string;
  userID: string;
  full_name: string;
  voucherTypeID: string;
  discountType: "percentage" | "free_shipping";
  discountValue: number;
  code: string;
  createdAt: string;
}

interface UsedVoucher {
  voucherID: string;
  userID: string;
  full_name: string;
  discountType: "percentage" | "free_shipping";
  discountValue: number;
  code: string;
  usedAt: string;
}

export default function VoucherManagement() {
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [voucherHistory, setVoucherHistory] = useState<VoucherHistory[]>([]);
  const [usedVouchers, setUsedVouchers] = useState<UsedVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [voucherForm, setVoucherForm] = useState({
    voucherTypeID: "",
    discountType: "percentage" as "percentage" | "free_shipping",
    discountValue: "",
    quantity: "",
    winRate: "",
    validityDays: "",
    isActive: false,
    createdAt: "",
    expiresAt: "",
  });
  const [formError, setFormError] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    // Gọi các hàm fetch ban đầu khi component mount
    fetchVoucherTypes();
    fetchUsers();
    fetchVoucherHistory();
    fetchUsedVouchers();
    // Không sử dụng setInterval để bỏ cập nhật tự động mỗi 30 giây
  }, []);

  const fetchVoucherTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vouchers`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi lấy danh sách loại voucher");
      }
      const vouchers = response.data.data || [];
      vouchers.forEach((v: VoucherType) => {
        if (!v.expiresAt || isNaN(new Date(v.expiresAt).getTime())) {
          console.warn(`Voucher ${v.voucherTypeID} has invalid expiresAt: ${v.expiresAt}`);
        }
      });
      setVoucherTypes(vouchers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải danh sách loại voucher");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi lấy danh sách khách hàng");
      }
      setUsers(response.data.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách khách hàng:", err);
    }
  };

  const fetchVoucherHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/vouchers/win-history`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi lấy lịch sử trúng thưởng");
      }
      setVoucherHistory(response.data.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử trúng thưởng:", err);
    }
  };

  const fetchUsedVouchers = async () => {
    try {
      const response = await axios.get(`${API_URL}/vouchers/used-history`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi lấy lịch sử sử dụng voucher");
      }
      setUsedVouchers(response.data.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử sử dụng voucher:", err);
    }
  };

  const openModal = (voucher?: VoucherType) => {
    if (voucher && new Date(voucher.expiresAt) < new Date()) {
      alert("Không thể chỉnh sửa voucher đã hết hạn");
      return;
    }
    if (voucher) {
      setIsEditMode(true);
      setVoucherForm({
        voucherTypeID: voucher.voucherTypeID,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue.toString(),
        quantity: voucher.quantity.toString(),
        winRate: voucher.winRate.toString(),
        validityDays: voucher.validityDays.toString(),
        isActive: voucher.isActive,
        createdAt: voucher.createdAt,
        expiresAt: voucher.expiresAt,
      });
    } else {
      setIsEditMode(false);
      setVoucherForm({
        voucherTypeID: "",
        discountType: "percentage",
        discountValue: "",
        quantity: "",
        winRate: "",
        validityDays: "",
        isActive: false,
        createdAt: new Date().toISOString(),
        expiresAt: "",
      });
    }
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const validateForm = () => {
    const { discountType, discountValue, quantity, winRate, validityDays } = voucherForm;
    if (!quantity || !winRate || !validityDays) {
      setFormError("Vui lòng nhập đầy đủ số lượng, tỷ lệ thắng và ngày hiệu lực");
      return false;
    }
    if (discountType === "percentage" && (!discountValue || parseFloat(discountValue) <= 0)) {
      setFormError("Vui lòng nhập giá trị giảm giá hợp lệ cho loại percentage");
      return false;
    }
    if (parseFloat(winRate) < 0 || parseFloat(winRate) > 100) {
      setFormError("Tỷ lệ thắng phải từ 0 đến 100");
      return false;
    }
    const otherWinRate = voucherTypes.reduce(
      (sum, vt) => (vt.voucherTypeID !== voucherForm.voucherTypeID ? sum + Number(vt.winRate) : sum),
      0
    );
    if (otherWinRate + parseFloat(winRate) > 100) {
      setFormError("Tổng tỷ lệ thắng không được vượt quá 100%");
      return false;
    }
    if (parseInt(validityDays) <= 0) {
      setFormError("Ngày hiệu lực phải lớn hơn 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  const validityDays = parseInt(voucherForm.validityDays);
  const expiresAt = new Date(
    new Date().getTime() + validityDays * 24 * 60 * 60 * 1000
  );
  // Định dạng expiresAt thành YYYY-MM-DD HH:mm:ss
  const formattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  if (isEditMode && new Date(voucherForm.expiresAt) < new Date()) {
    setFormError("Không thể cập nhật voucher đã hết hạn");
    return;
  }

  const payload = {
    discountType: voucherForm.discountType,
    discountValue: voucherForm.discountType === "percentage" ? parseFloat(voucherForm.discountValue) : 0,
    quantity: parseInt(voucherForm.quantity),
    winRate: parseFloat(voucherForm.winRate),
    validityDays,
    isActive: voucherForm.isActive,
    expiresAt: formattedExpiresAt, 
  };

  try {
    let response;
    if (isEditMode) {
      response = await axios.post(`${API_URL}/vouchers/update`, {
        voucherTypeID: voucherForm.voucherTypeID,
        ...payload,
      });
    } else {
      response = await axios.post(`${API_URL}/vouchers/add`, payload);
    }
    if (!response.data.success) {
      throw new Error(response.data.message || `Lỗi khi ${isEditMode ? "cập nhật" : "tạo"} loại voucher`);
    }
    alert(`${isEditMode ? "Cập nhật" : "Tạo"} loại voucher thành công`);
    fetchVoucherTypes();
    fetchVoucherHistory();
    fetchUsedVouchers();
    closeModal();
  } catch (err) {
    console.error(`Error ${isEditMode ? "updating" : "creating"} voucher:`, err);
    setFormError(err instanceof Error ? err.message : `Lỗi khi ${isEditMode ? "cập nhật" : "tạo"} loại voucher. Vui lòng kiểm tra kết nối server.`);
  }
};

  const handleToggleWheel = async (voucherTypeID: string, isActive: boolean) => {
    try {
      const response = await axios.post(`${API_URL}/vouchers/toggle-wheel`, {
        voucherTypeID,
        isActive: !isActive,
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi cập nhật trạng thái vòng quay");
      }
      fetchVoucherTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái vòng quay");
    }
  };

  const handleDeleteVoucher = async (voucherTypeID: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa loại voucher này?")) return;
    try {
      const response = await axios.post(`${API_URL}/vouchers/delete`, { voucherTypeID });
      if (!response.data.success) {
        throw new Error(response.data.message || "Lỗi khi xóa voucher");
      }
      alert("Xóa voucher thành công");
      fetchVoucherTypes();
      fetchVoucherHistory();
      fetchUsedVouchers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi khi xóa voucher");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" padding={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box className="voucher-management" display="flex" gap={2}>
        <Box className="voucher-setup" flex={6}>
          <Box className="header">
            <Typography variant="h5" fontWeight="bold">
              Quản lý Voucher
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              className="create-voucher-btn"
              onClick={() => openModal()}
            >
              Tạo loại voucher
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {voucherTypes.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: "center", p: 4 }}>
              Chưa có loại voucher nào
            </Alert>
          ) : (
            <TableContainer component={Paper} className="voucher-table-wrapper">
              <Table className="voucher-table">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Giảm</TableCell>
                    <TableCell>Bắt đầu</TableCell>
                    <TableCell>Kết thúc</TableCell>
                    <TableCell>Kích hoạt</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voucherTypes.map((voucher) => {
                    const isExpired = voucher.expiresAt && !isNaN(new Date(voucher.expiresAt).getTime())
                      ? new Date(voucher.expiresAt) < new Date()
                      : false;
                    return (
                      <TableRow
                        key={voucher.voucherTypeID}
                        hover
                        onClick={() => openModal(voucher)}
                        sx={{ cursor: isExpired ? "not-allowed" : "pointer" }}
                      >
                        <TableCell>{voucher.voucherTypeID}</TableCell>
                        <TableCell sx={{ position: "relative", width: "180px" }}>
                          {voucher.discountType === "percentage" ? "Giảm phần trăm" : "Miễn phí vận chuyển"}
                          {isExpired && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: "30%",
                                transform: "translate(-50%, -50%) rotate(-30deg)",
                                background: "rgba(255, 0, 0, 0.1)",
                                color: "red",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                border: "2px solid red",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              Đã hết hạn
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {voucher.discountType === "percentage" ? `${voucher.discountValue}%` : "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(voucher.createdAt)}</TableCell>
                        <TableCell>{formatDate(voucher.expiresAt)}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={voucher.isActive}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleWheel(voucher.voucherTypeID, voucher.isActive);
                            }}
                            disabled={isExpired}
                            title={voucher.isActive ? "Tắt vòng quay" : "Kích hoạt vòng quay"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            onClick={(e) => handleDeleteVoucher(voucher.voucherTypeID, e)}
                            startIcon={<Delete />}
                            size="small"
                          >
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Box className="voucher-history" flex={4} display="flex" flexDirection="column" gap={2}>
          <Box className="history-section" flex={1}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Lịch sử trúng thưởng
            </Typography>
            <TableContainer component={Paper} className="history-table-wrapper">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Giá trị</TableCell>
                    <TableCell>Ngày trúng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voucherHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Chưa có lịch sử trúng thưởng
                      </TableCell>
                    </TableRow>
                  ) : (
                    voucherHistory.map((history, index) => (
                      <TableRow key={history.voucherID}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{history.full_name}</TableCell>
                        <TableCell>
                          {history.discountType === "percentage" ? "Giảm phần trăm" : "Miễn phí vận chuyển"}
                        </TableCell>
                        <TableCell>
                          {history.discountType === "percentage" ? `${history.discountValue}%` : "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(history.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box className="history-section" flex={1}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Lịch sử sử dụng voucher
            </Typography>
            <TableContainer component={Paper} className="history-table-wrapper">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Giá trị</TableCell>
                    <TableCell>Ngày sử dụng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usedVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Chưa có lịch sử sử dụng voucher
                      </TableCell>
                    </TableRow>
                  ) : (
                    usedVouchers.map((voucher, index) => (
                      <TableRow key={voucher.voucherID}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{voucher.full_name}</TableCell>
                        <TableCell>
                          {voucher.discountType === "percentage" ? "Giảm phần trăm" : "Miễn phí vận chuyển"}
                        </TableCell>
                        <TableCell>
                          {voucher.discountType === "percentage" ? `${voucher.discountValue}%` : "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(voucher.usedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>

      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? "Sửa Loại Voucher" : "Tạo Loại Voucher"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Loại giảm giá</InputLabel>
            <Select
              value={voucherForm.discountType}
              onChange={(e) =>
                setVoucherForm({ ...voucherForm, discountType: e.target.value as "percentage" | "free_shipping" })
              }
              label="Loại giảm giá"
            >
              <MenuItem value="percentage">Giảm phần trăm</MenuItem>
              <MenuItem value="free_shipping">Miễn phí vận chuyển</MenuItem>
            </Select>
          </FormControl>

          {voucherForm.discountType === "percentage" && (
            <TextField
              fullWidth
              margin="normal"
              label="Giá trị giảm (%)"
              type="number"
              value={voucherForm.discountValue}
              onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: e.target.value })}
              placeholder="Nhập giá trị giảm giá"
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Số lượng"
            type="number"
            value={voucherForm.quantity}
            onChange={(e) => setVoucherForm({ ...voucherForm, quantity: e.target.value })}
            placeholder="Nhập số lượng voucher"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Tỷ lệ thắng (%)"
            type="number"
            value={voucherForm.winRate}
            onChange={(e) => setVoucherForm({ ...voucherForm, winRate: e.target.value })}
            placeholder="Nhập tỷ lệ thắng"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Ngày hiệu lực"
            type="number"
            value={voucherForm.validityDays}
            onChange={(e) => {
              const days = e.target.value;
              const expiresAt = days
                ? new Date(new Date().getTime() + parseInt(days) * 24 * 60 * 60 * 1000).toISOString()
                : "";
              setVoucherForm({ ...voucherForm, validityDays: days, expiresAt });
            }}
            placeholder="Nhập số ngày hiệu lực"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={voucherForm.isActive}
                onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                disabled={
                  voucherForm.expiresAt && !isNaN(new Date(voucherForm.expiresAt).getTime())
                    ? new Date(voucherForm.expiresAt) < new Date()
                    : false
                }
              />
            }
            label="Kích hoạt vòng quay"
          />

          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {isEditMode ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}