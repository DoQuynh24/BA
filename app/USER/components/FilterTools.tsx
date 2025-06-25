"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Box, Select, MenuItem, FormControl, InputLabel, IconButton } from "@mui/material";
import { motion } from "framer-motion";

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface FilterToolsProps {
  materials: Material[];
  selectedMaterial: number | null;
  setSelectedMaterial: (value: number | null) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  sortOrder: "asc" | "desc" | null;
  setSortOrder: (value: "asc" | "desc" | null) => void;
  viewMode: "grid" | "list";
  setViewMode: (value: "grid" | "list") => void;
}

const toolsVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: 0.2,
      ease: "easeOut",
    },
  },
};

export default function FilterTools({
  materials,
  selectedMaterial,
  setSelectedMaterial,
  priceRange,
  setPriceRange,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
}: FilterToolsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <motion.div variants={toolsVariants} initial="hidden" animate="visible">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          background: "linear-gradient(90deg, #f8dff6, #e3e3e3)",
          borderBottom: "1px solid #eee",
         
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Image src="/images/filter.png" alt="filter" width={25} height={25} />
          <span>Bộ lọc</span>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: "13px", top: "-10px" }}>Chọn chất liệu</InputLabel>
            <Select
              value={selectedMaterial || ""}
              onChange={(e) => setSelectedMaterial(e.target.value ? Number(e.target.value) : null)}
              label="Chọn chất liệu"
              sx={{
                height: "30px",
                fontSize: "13px",
                "& .MuiSelect-select": {},
              }}
            >
              {materials.map((material) => (
                <MenuItem key={material.materialID} value={material.materialID} sx={{ fontSize: "13px" }}>
                  {material.material_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: "13px", top: "-10px" }}>Chọn mức giá</InputLabel>
            <Select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as string)}
              sx={{
                height: "30px",
                fontSize: "12px",
                "& .MuiSelect-select": {},
              }}
            >
              <MenuItem value="0-5000000" sx={{ fontSize: "13px" }}>Dưới 5 triệu</MenuItem>
              <MenuItem value="5000000-10000000" sx={{ fontSize: "13px" }}>5 triệu - 10 triệu</MenuItem>
              <MenuItem value="10000000-20000000" sx={{ fontSize: "13px" }}>10 triệu - 20 triệu</MenuItem>
              <MenuItem value="20000000" sx={{ fontSize: "13px" }}>Trên 20 triệu</MenuItem>
            </Select>
          </FormControl>
          <Image src="/images/arranage.png" alt="arrange" width={25} height={25} />
          <span>Sắp xếp</span>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: "13px", top: "-10px" }}>Sắp xếp</InputLabel>
            <Select
              value={sortOrder || ""}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc" | null)}
              label="Sắp xếp"
              sx={{
                height: "30px",
                fontSize: "13px",
                "& .MuiSelect-select": {},
              }}
            >
              <MenuItem value="asc" sx={{ fontSize: "13px" }}>Giá tăng dần</MenuItem>
              <MenuItem value="desc" sx={{ fontSize: "13px" }}>Giá giảm dần</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Box sx={{ display: "flex", gap: "10px" }}>
            {isClient && ( // Chỉ render IconButton khi client sẵn sàng
              <>
                <IconButton
                  onClick={() => setViewMode("grid")}
                  color={viewMode === "grid" ? "primary" : "default"}
                >
                  <Image
                    src={viewMode === "grid" ? "/images/grid-active.png" : "/images/grid.png"}
                    alt="grid view"
                    width={25}
                    height={25}
                  />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode("list")}
                  color={viewMode === "list" ? "primary" : "default"}
                >
                  <Image
                    src={viewMode === "list" ? "/images/list-active.png" : "/images/list.png"}
                    alt="list view"
                    width={25}
                    height={25}
                  />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}