"use client";
import React, { useState } from "react";
import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { UserData } from "@/app/types/global";
import InstructionView from "@/app/components/projectManager/instructionView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogBig";
import {
  useTask,
  useGetTaskUserDetail,
  useTaskDistrubuion,
} from "@/lib/hooks/useProject";
import { useGetTaskMicroTaskResponseForReviewers } from "@/lib/hooks/useReviewer";
import { userProfileFacilitators } from "@/lib/hooks/useFacilitator";
import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Copy,
  Plus,
  Users,
  Link2,
  ChevronDown,
} from "lucide-react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { MicroTask, ReviewerDataset } from "@/app/types/project";
import { TaskInstructions } from "@/app/types/project";
import type { SortingState } from "@tanstack/react-table";
import TaskDetailsGeneral from "@/app/components/projectManager/taskDetailsGeneral";
import TaskDataset from "./microTaskDataset";
import { useTranslation } from "@/lib/hooks/useTranslation";
interface MicroTaskListProps {
  taskId: string;
  microTaskPage: number;
  setMicroTaskPage: (page: number) => void;
  microTaskPageSize: number;
  setMicroTaskPageSize: (pageSize: number) => void;
  searchQuery: string;
  verificationStatus?: string;
  setVerificationStatus: (status: string | undefined) => void;
  onCancelTask: () => void;
}
interface PaginationProps {
  pageCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  showingText: string;
}

const PaginationControls: React.FC<{ pagination: PaginationProps }> = ({
  pagination,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="md:text-sm text-xs text-gray-500">{t("showing")}</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            pagination.setPageSize(newSize);
            pagination.setPage(1);
          }}
          className="border  border-gray-100 rounded-md md:text-sm text-xs px-2 py-1 bg-white"
          title="Page Size"
        >
          {[5, 10, 20, 30, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="md:text-sm text-xs pl-2 text-gray-500">
        {pagination.showingText}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        {Array.from(
          { length: Math.max(1, pagination.pageCount) },
          (_, i) => i + 1,
        ).map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pagination.page === pageNumber ? "outline" : "outline"}
            className={
              pagination.page === pageNumber ? "border-brand text-brand" : ""
            }
            size="sm"
            onClick={() => pagination.setPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => pagination.setPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.pageCount}
        >
          <ChevronRightIcon className="md:w-4 md:h-4 w-2 h-2" />
        </Button>
      </div>
    </div>
  );
};
const MicroTaskList: React.FC<MicroTaskListProps> = ({
  taskId,
  microTaskPage,
  setMicroTaskPage,
  microTaskPageSize,
  setMicroTaskPageSize,
  searchQuery,
  verificationStatus,
  setVerificationStatus,
  onCancelTask,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const debouncedTaskSearch = useDebounce(searchQuery, 500);
  const [userPage, setUserPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const { t } = useTranslation();
  const {
    data: usersData,
    isLoading: isUserLoading,
    error: userError,
  } = userProfileFacilitators({
    taskId,
    page: page,
    pageSize: pageSize,
    searchQuery: debouncedTaskSearch,
    verificationStatus,
  });
  const [activeTab, setActiveTab] = useState<"Task Details" | "Users">(
    "Task Details",
  );
  const [isInstructionFullScreen, setIsInstructionFullScreen] = useState(false);
  const [userSubmissionsView, setUserSubmissionsView] = useState(false);
  const [contributor_id, setContributor_id] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData>();
  const [selectedInstruction, setSelectedInstruction] = useState<any>(null);
  
  const microtasks: UserData[] = Array.isArray(usersData?.data?.result)
    ? (usersData?.data?.result ?? [])
    : [];

  const microTaskTotalElements = usersData?.data?.total || 0;
  const { data: taskData, isLoading: isTaskLoading, error } = useTask(taskId);
  const microTaskTotalPages = usersData?.data?.totalPages || 1;
  const microTaskStartRecord = microtasks.length
    ? (microTaskPage - 1) * microTaskPageSize + 1
    : 0;
  const microTaskEndRecord = Math.min(
    microTaskPage * microTaskPageSize,
    microTaskTotalElements,
  );
  const handleOpenInstruction = (instruction: TaskInstructions) => {
    setSelectedInstruction(instruction);
    setTimeout(() => {
      setIsInstructionFullScreen(true);
    }, 100);
  };

  const task = taskData?.data;
  const microTaskColumns: ColumnDef<UserData>[] = [
    {
      accessorKey: "first_name",
      header: t('firstName'),
    },
    {
      accessorKey: "middle_name",
      header: t('middleName'),
    },
    {
      accessorKey: "phone_number",
      header:  t('phoneNumber'),
    },
    {
      accessorKey: "email",
      header: t('email'),
    },
    {
      accessorKey: "score",
      header: t('score'),
    },
    {
      accessorKey: "",
      header: t('submissionsHeader'),
      cell: ({ row }) => {
        return (
          <button
            aria-label="More options"
            className="p-2 rounded-2xl bg-primary text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              setContributor_id(row.original.id);
              setSelectedUser(row.original);
              setTimeout(() => {
                setUserSubmissionsView(true);
              }, 20);
            }}
          >
            {t('view')}
          </button>
          // <Dialog>
          //   <DialogTrigger asChild>
          //     <button
          //       aria-label="More options"
          //       className="p-2 rounded-md bg-primary text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          //     >
          //       View
          //     </button>
          //   </DialogTrigger>
          //   <DialogContent className="w-full">
          //     <TaskDataset task_id={taskId} contributor_id={row.original.id} />
          //   </DialogContent>
          // </Dialog>
        );
      },
    },
  ];

  const microTaskTable = useReactTable({
    data: microtasks,
    columns: microTaskColumns,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize: pageSize },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: microTaskTotalElements,
  });

  if (userError) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Error loading microtasks: {(userError as Error).message}
        </p>
      </div>
    );
  }

  return (
    <>
      {userSubmissionsView ? (
        <>
          <TaskDataset
            task_id={taskId}
            contributor_id={contributor_id}
            user={selectedUser}
            taskType={task?.taskType.task_type}
            onCancel={() => setUserSubmissionsView(false)}
          />
        </>
      ) : (
        <>
          <Button variant={"ghost"} className="mb-4">
            <span onClick={onCancelTask}>←  {t('tasks')}</span>
          </Button>
          <div className="border-b border-gray-100 mb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab("Task Details")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "Task Details"
                    ? "border-b-2 border-blue-600 text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('taskDetails')}
             
              </button>

              <button
                onClick={() => {
                  setActiveTab("Users");
                  setUserPage(1); // Reset page on tab switch
                  setUserSearchQuery(""); // Reset search
                }}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "Users"
                    ? "border-b-2 border-blue-600 text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                    {t('users')}
                
              </button>
            </nav>
          </div>
          {activeTab === "Task Details" && task ? (
            <TaskDetailsGeneral type={false} task={task} />
          ) : (
            <div></div>
          )}
          {activeTab === "Users" && (
            <>
              {isUserLoading ? (
                <div className="flex justify-center items-center h-48"></div>
              ) : microtasks.length === 0 ? (
                <div className="relative flex flex-col items-center justify-center py-12">
                  <img
                    src="/empty.svg"
                    alt="No users found"
                    className="w-64 h-64 opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="rounded-md border border-gray-100 bg-white overflow-hidden relative">
                    <Table>
                      <TableHeader>
                        {microTaskTable.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead
                                key={header.id}
                                className="text-sm font-bold  bg-gray-100 px-5 py-5 text-gray-700"
                              >
                                {header.isPlaceholder ? null : (
                                  <div
                                    className="flex items-center space-x-1 cursor-pointer"
                                    onClick={header.column.getToggleSortingHandler()}
                                  >
                                    <span>
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                    </span>
                                    {header.column.getCanSort() && (
                                      <span className="text-gray-500">
                                        {header.column.getIsSorted() ===
                                        "asc" ? (
                                          <ArrowUp className="h-4 w-4" />
                                        ) : header.column.getIsSorted() ===
                                          "desc" ? (
                                          <ArrowDown className="h-4 w-4" />
                                        ) : (
                                          <ArrowUpDown className="h-4 w-4" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {microTaskTable.getRowModel().rows?.length ? (
                          microTaskTable.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="border-gray-100">
                              {row.getVisibleCells().map((cell) => (
                                <TableCell
                                  key={cell.id}
                                  className=" bg-white px-5 py-5 text-sm"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={microTaskColumns.length}
                              className="h-24 text-center"
                            >
                              {isUserLoading ? (
                                ""
                              ) : (
                                <div className="flex justify-center items-center h-48">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <PaginationControls
                      pagination={{
                        pageCount: microTaskTotalPages,
                        page: page,
                        setPage: setPage,
                        pageSize: pageSize,
                        setPageSize: setPageSize,
                        showingText:
                          microTaskTotalElements > 0
                            ? `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, microTaskTotalElements)} out of ${microTaskTotalElements} records`
                            : "",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default MicroTaskList;
