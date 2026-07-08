import { useNavigate } from "react-router-dom";
import { User, Eye, Pencil, Trash2 } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/ui/Table";
import type { BuildingData } from "../../../../services/buildingService";

interface BuildingListProps {
  sortedBuildings: BuildingData[];
  role: string | null;
  setEditItem: (item: BuildingData | null) => void;
  setShowModifyModal: (show: boolean) => void;
  setDeleteItem: (item: BuildingData | null) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
}

export default function BuildingList({
  sortedBuildings,
  role,
  setEditItem,
  setShowModifyModal,
  setDeleteItem,
  requestSort,
  getSortIcon,
}: BuildingListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedBuildings.map((building) => (
          <div key={building.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="font-semibold text-primary-600 cursor-pointer text-base hover:underline"
                onClick={() => navigate(`/admin/buildings/${building.id}`)}
              >
                {building.branch_name}
              </span>
              <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
              </Badge>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>
                <span className="font-semibold text-gray-700">Địa chỉ:</span> {building.address_new}
              </p>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">Quản lý bởi:</span>
                {building.manager ? (
                  <span className="inline-flex items-center gap-1 text-primary-600 font-medium">
                    <User size={12} />
                    {building.manager.fullName || building.manager.username}
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-xs">Chưa bàn giao</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => navigate(`/admin/buildings/${building.id}`)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
              >
                <Eye size={14} /> Chi tiết
              </button>
              {role === "ADMIN" && (
                <>
                  <button
                    onClick={() => { setEditItem(building); setShowModifyModal(true); }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Pencil size={14} /> Sửa
                  </button>
                  <button
                    onClick={() => setDeleteItem(building)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View List */}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("branch_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tên chi nhánh {getSortIcon("branch_name")}
              </TableHead>
              <TableHead onClick={() => requestSort("address_new")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Địa chỉ {getSortIcon("address_new")}
              </TableHead>
              <TableHead onClick={() => requestSort("manager.fullName")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Quản lý bởi {getSortIcon("manager.fullName")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBuildings.map((building) => (
              <TableRow key={building.id}>
                <TableCell className="font-semibold text-primary-600">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/buildings/${building.id}`)}>
                    <span>{building.branch_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">
                  <span className="block max-w-xs truncate" title={building.address_new}>
                    {building.address_new}
                  </span>
                </TableCell>
                <TableCell className="text-gray-700">
                  {building.manager ? (
                    <div className="flex items-center gap-1.5 font-medium text-primary-600">
                      <User size={13} />
                      <span>{building.manager.fullName || building.manager.username}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Không</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                    {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => navigate(`/admin/buildings/${building.id}`)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                      <Eye size={16} />
                    </button>
                    {role === "ADMIN" && (
                      <>
                        <button onClick={() => { setEditItem(building); setShowModifyModal(true); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteItem(building)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
