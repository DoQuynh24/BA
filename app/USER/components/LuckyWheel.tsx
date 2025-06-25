"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface VoucherType {
  voucherTypeID: string;
  discountType: "percentage" | "free_shipping";
  discountValue: number;
  quantity: number;
  winRate: number;
  isActive: number;
}

interface Voucher {
  voucherID: string;
  voucherTypeID: string;
  discountType: "percentage" | "free_shipping" | "no_win";
  discountValue: number;
  code: string;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  life: number;
}

const LuckyWheel = ({ onClose, userID }: { onClose: () => void; userID: number }) => {
  const [wheelResult, setWheelResult] = useState<Voucher | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [segments, setSegments] = useState<string[]>([]);
  const [segColors, setSegColors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
  const fetchVouchers = async () => {
    try {
      const response = await fetch(`${API_URL}/vouchers`); // Sửa route từ /vouchers thành /voucher
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi lấy danh sách voucher");
      }
      const availableVouchers = result.data.filter(
        (vt: VoucherType) => vt.quantity > 0 && vt.isActive === 1
      );
      const totalWinRate = availableVouchers.reduce((sum: number, vt: VoucherType) => sum + vt.winRate, 0);
      const noWinRate = 100 - totalWinRate;

      const newSegments = [
        ...availableVouchers.map((vt: VoucherType) =>
          vt.discountType === "percentage" ? `${vt.discountValue}% OFF` : "Miễn phí vận chuyển"
        ),
        ...(noWinRate > 0 ? ["Chúc bạn may mắn lần sau"] : []),
      ];

      // Tạo danh sách màu pastel đa dạng dựa trên #8a5da3 (RGB: 138, 93, 163)
      const baseColor = { r: 138, g: 93, b: 163 };
      const pastelColors = newSegments.map((_, i) => {
        const hueShift = (i * 360) / newSegments.length; // Phân bố đều theo vòng màu
        const saturation = 50 + Math.random() * 20; // Độ bão hòa từ 50-70%
        const lightness = 70 + Math.random() * 20; // Độ sáng từ 70-90%
        return `hsl(${hueShift}, ${saturation}%, ${lightness}%)`;
      });

      setSegments(newSegments);
      setSegColors(pastelColors);
    } catch (err) {
      setError("Không thể tải vòng quay. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  fetchVouchers();
}, [userID]);

  const drawWheel = (angle: number) => {
  const canvas = canvasRef.current;
  if (!canvas || segments.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const radius = canvas.width / 2;
  const arc = (2 * Math.PI) / segments.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  segments.forEach((segment, i) => {
    const startAngle = i * arc + angle;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, startAngle, startAngle + arc);
    ctx.lineTo(radius, radius);
    ctx.fillStyle = segColors[i];
    ctx.fill();
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(startAngle + arc / 2);
    ctx.fillStyle = "#333333";
    ctx.font = "14px Arial"; // Giảm kích thước font xuống 14px
    const text = segment.length > 10 ? segment.substring(0, 10) + "..." : segment; // Cắt ngắn nếu quá dài
    ctx.fillText(text, radius - 120, 10); // Điều chỉnh vị trí text nếu cần
    ctx.restore();
  });

  ctx.beginPath();
  ctx.moveTo(radius - 10, 20);
  ctx.lineTo(radius + 10, 20);
  ctx.lineTo(radius, 40);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#333333";
  ctx.stroke();
};

  useEffect(() => {
    drawWheel(currentAngle);
  }, [segments, currentAngle]);

 const handleSpin = async () => {
  if (isSpinning || segments.length <= 1) return;
  setIsSpinning(true);
  setError(null);
  setWheelResult(null);

  const spins = 5;
  const duration = 4000;
  const start = Date.now();

  try {
    const response = await fetch(`${API_URL}/vouchers/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID }),
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Lỗi khi quay vòng quay");
    }

    let winner: string;
    let voucherData: Voucher | null = null;

    if (result.data && result.data.discountType !== "no_win") {
      voucherData = result.data;
      winner =
        result.data.discountType === "percentage"
          ? `${result.data.discountValue}% OFF`
          : "Miễn phí vận chuyển";
    } else {
      winner = "Chúc bạn may mắn lần sau";
      voucherData = { voucherID: "", voucherTypeID: "", discountType: "no_win", discountValue: 0, code: "" };
    }

    const segmentIndex = segments.indexOf(winner);
    if (segmentIndex === -1) {
      throw new Error(`Kết quả '${winner}' không tìm thấy trong segments`);
    }

    const arc = 360 / segments.length;
    const targetAngle = segmentIndex * arc + arc / 2;
    const finalAngle = spins * 360 + (360 - targetAngle);

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newAngle = easeOut * finalAngle;
      setCurrentAngle(newAngle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setWheelResult(voucherData);
          setIsSpinning(false);
          // Gọi Fireworks cùng lúc với kết quả
          const fireworksCanvas = document.createElement("canvas");
          fireworksCanvas.width = 350;
          fireworksCanvas.height = 350;
          fireworksCanvas.style.position = "absolute";
          fireworksCanvas.style.top = "0";
          fireworksCanvas.style.left = "0";
          document.querySelector(".MuiDialogContent-root")?.appendChild(fireworksCanvas);

          const ctx = fireworksCanvas.getContext("2d");
          if (ctx) {
            const particles: Particle[] = [];
            for (let i = 0; i < 100; i++) {
              particles.push({
                x: 175,
                y: 175,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                color: `hsl(${Math.random() * 360}, 70%, 70%)`,
                life: 50,
              });
            }

            const animateFireworks = () => {
              ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
              particles.forEach((p, i) => {
                if (p.life > 0) {
                  p.x += p.dx;
                  p.y += p.dy;
                  p.life--;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                  ctx.fillStyle = p.color;
                  ctx.fill();
                } else {
                  particles.splice(i, 1);
                }
              });
              if (particles.length > 0) requestAnimationFrame(animateFireworks);
              else fireworksCanvas.remove();
            };

            animateFireworks();
          }
        }, 1000); // Dừng 1 giây trước khi hiển thị kết quả và pháo hoa
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Lỗi khi quay vòng quay may mắn");
    setIsSpinning(false);
  }

  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
};

  const handleRetry = () => {
    setError(null);
    setIsSpinning(false);
    setWheelResult(null);
    setCurrentAngle(0);
  };

  const Fireworks = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    document.querySelector(".MuiDialogContent-root")?.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: 150,
        y: 150,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10,
        color: `hsl(${Math.random() * 360}, 70%, 70%)`,
        life: 50,
      });
    }

    const animateFireworks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        if (p.life > 0) {
          p.x += p.dx;
          p.y += p.dy;
          p.life--;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          particles.splice(i, 1);
        }
      });
      if (particles.length > 0) requestAnimationFrame(animateFireworks);
      else canvas.remove();
    };

    animateFireworks();
    return null;
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden">
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "8px",
            maxHeight: "90vh",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            padding: "15px 20px",
          }}
        >
          <Typography>Vòng Quay May Mắn</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "20px", textAlign: "center", position: "relative" }}>
          {isLoading ? (
            <CircularProgress />
          ) : error ? (
            <Box>
              <Typography color="error" mb={2}>
                {error}
              </Typography>
              <Button
                onClick={handleRetry}
                variant="contained"
                sx={{
                  background: "#EE4D2D",
                  color: "#fff",
                  "&:hover": { background: "#D43F21" },
                }}
              >
                Thử lại
              </Button>
            </Box>
          ) : isSpinning ? (
            <Box>
              <Typography variant="body1" mb={2}>
                Vòng quay đang quay...
              </Typography>
              <Box mt={2} mb={2}>
                <canvas ref={canvasRef} width={350} height={350} style={{ display: "block", margin: "0 auto" }} />
              </Box>
              <Button
                variant="contained"
                disabled={true}
                sx={{
                  background: "linear-gradient(90deg, #8a5da3, #b583c9)",
                  color: "#fff",
                  borderRadius: "15px",
                  padding: "10px 20px",
                  fontSize: "16px",
                  "&:disabled": { background: "#ccc" },
                }}
              >
                Đang quay...
              </Button>
            </Box>
          ) : (
            <Box>
              {wheelResult === null ? (
                <>
                  <Typography variant="body1" mb={2}>
                    Quay để nhận voucher may mắn!
                  </Typography>
                  <Box mt={2} mb={2}>
                    <canvas ref={canvasRef} width={350} height={350} style={{ display: "block", margin: "0 auto" }} />
                  </Box>
                  <Button
                    onClick={handleSpin}
                    variant="contained"
                    disabled={isSpinning || segments.length <= 1}
                    sx={{
                      background: "linear-gradient(90deg, #8a5da3, #b583c9)",
                      color: "#fff",
                      borderRadius: "15px",
                      padding: "10px 20px",
                      fontSize: "16px",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 3px 10px rgba(138, 93, 165, 0.3)",
                      },
                      "&:disabled": { background: "#ccc" },
                    }}
                  >
                    {segments.length <= 1 ? "Vòng quay chưa sẵn sàng" : "Quay"}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="h6" mb={2}>
                    Kết quả:
                  </Typography>
                  <Typography variant="h4" color="#EE4D2D" mb={2}>
                    {wheelResult.discountType === "percentage"
                      ? `${wheelResult.discountValue}% OFF`
                      : wheelResult.discountType === "free_shipping"
                      ? "Miễn phí vận chuyển"
                      : "🥲Chúc bạn may mắn lần sau"}
                  </Typography>
                  <Typography variant="subtitle1" mb={2}>
                    {wheelResult.discountType !== "no_win"
                      ? `🥳Mã voucher: ${wheelResult.code} đã được lưu.`
                      : "Hãy thử lại vào ngày mai!"}
                  </Typography>
                  <Fireworks />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        {(wheelResult !== null || error) && (
          <DialogActions sx={{ justifyContent: "center", padding: "15px 20px" }}>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                backgroundColor: "#EE4D2D",
                color: "#fff",
                borderRadius: "5px",
                padding: "8px 20px",
                "&:hover": { backgroundColor: "#D43F21" },
              }}
            >
              Đóng
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </motion.div>
  );
};

export default LuckyWheel;