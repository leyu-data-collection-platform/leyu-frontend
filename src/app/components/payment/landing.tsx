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
import { PaginationControls } from "@/components/ui/pagination";
import {
  MyBalanceResponse,
  useWithdrawMoney,
  useTransactionResponse,
  Reviewerstatistics,
  useWithdrawOptions,
} from "@/lib/hooks/usePayment";
import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialogBig";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortingState } from "@tanstack/react-table";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Define Transaction interface based on provided structure
interface Transaction {
  id: string;
  amount: string;
  metadata: null;
  status: string;
  user_id: string;
  created_date: string;
  updated_date: string;
}

interface LandingProps {
  usertype: string;
}

interface WithdrawMoney {
  bank_code: string;
  amount: string;
  account_number: string;
}

const Landing: React.FC<LandingProps> = ({ usertype }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { t } = useTranslation();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { data: withdrawOptionsData, isLoading: withdrawOptionsLoading } =
    useWithdrawOptions();
  const [withdrawFormData, setWithdrawFormData] = useState<WithdrawMoney>({
    amount: "",
    bank_code: "",
    account_number: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<WithdrawMoney>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [type, setType] = useState<"Credit" | "Withdraw">("Credit");

  const {
    data: reviwerStatistic,
    isLoading: reviwerStatisticLoading,
    error: reviwerStatisticError,
  } = Reviewerstatistics();
  const {
    data: mybalance,
    isLoading: isMicroTaskLoading,
    error: microTaskError,
  } = MyBalanceResponse();
  const withdrawMutation = useWithdrawMoney();
  const {
    data: transactionData,
    isLoading: isUserLoading,
    refetch,
  } = useTransactionResponse({
    page,
    pageSize,
    type,
  });
  const transactionDataResponse: Transaction[] = Array.isArray(
    transactionData?.data?.result,
  )
    ? (transactionData?.data?.result ?? [])
    : [];
  const totaltransaction = transactionData ? transactionData.data.total : 0;
  const totalPages = Math.ceil(totaltransaction / pageSize);

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };
  const formatDateToEAT = (isoDate: string): string => {
    const date = new Date(isoDate);
    date.setUTCHours(date.getUTCHours() + 3); // Adjust to EAT (UTC+3)

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours() % 12 || 12; // Convert to 12-hour format
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const period = date.getUTCHours() >= 12 ? "PM" : "AM";

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${period} EAT`;
  };
  const transactionColumns: ColumnDef<Transaction>[] = [
    { accessorKey: "id", header: t("transactionId"), enableSorting: true },
    {
      accessorKey: "amount",
      header: t("amountEtb"),
      enableSorting: true,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount") || "0");
        const isPositive = amount >= 0;
        return (
          <span className={isPositive ? "text-green-600" : "text-red-600"}>
            {isPositive ? `+${amount} Birr` : `${amount} Birr`}
          </span>
        );
      },
    },
    { accessorKey: "status", header: t("statusHeader"), enableSorting: true },
    {
      accessorKey: "created_date",
      header: t("createdDateHeader"),
      enableSorting: true,
      cell: ({ row }) => formatDateToEAT(row.getValue("created_date")),
    },
    {
      accessorKey: "updated_date",
      header: t("updatedDate"),
      enableSorting: true,
      cell: ({ row }) => formatDateToEAT(row.getValue("updated_date")),
    },
  ];

  const transactionTable = useReactTable({
    data: transactionDataResponse || [],
    columns: transactionColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleWithdrawModalOpen = () => {
    setWithdrawFormData({
      amount: "",
      bank_code: "",
      account_number: "",
    });
    setFormErrors({});
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawModalClose = () => {
    setIsWithdrawModalOpen(false);
    setFormErrors({});
  };

  const handleWithdrawFormChange = (
    field: keyof WithdrawMoney,
    value: string,
  ) => {
    setWithdrawFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateWithdrawForm = (): boolean => {
    const errors: Partial<WithdrawMoney> = {};
    const balance = parseFloat(mybalance?.data || "0");
    const amount = parseFloat(withdrawFormData.amount || "0");
    console;
    if (!withdrawFormData.account_number) {
      errors.account_number = "Account number is required";
    }
    if (!withdrawFormData.amount || Number(amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (amount > balance) {
      errors.amount = `Amount cannot exceed available balance of ${balance} Birr`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWithdrawSubmit = () => {
    if (validateWithdrawForm()) {
      const payload = {
        ...withdrawFormData,
        amount: parseFloat(withdrawFormData.amount),
      };
      withdrawMutation.mutate(payload as any, {
        onSuccess: () => {
          handleWithdrawModalClose();

          refetch(); // Refetch transactions after successful withdrawal
        },
        onError: (error) => {
          console.error("Withdraw failed:", error);
        },
      });
    }
  };

  return (
    <div className="bg-white  p-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between mb-6  border-gray-100 pb-4 gap-6">
        {/* Wallet Balance Card — hidden for reviewer */}
        {usertype !== "reviewer" && (
          <div className="relative w-full lg:w-96 h-40 rounded-md overflow-hidden">
            <svg
              width="516"
              height="180"
              viewBox="0 0 516 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="575.83"
                height="180"
                rx=""
                fill="url(#paint0_linear_422_6974)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_422_6974"
                  x1="-255.895"
                  y1="-4.34849e-06"
                  x2="960.443"
                  y2="207.197"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#095FAF" />
                  <stop stopColor="#086CA8" />
                  <stop offset="0.275781" stopColor="#086CA8" />
                  <stop
                    offset="0.484108"
                    stopColor="#0779A2"
                    stopOpacity="0.93"
                  />
                  <stop
                    offset="0.657743"
                    stopColor="#068B99"
                    stopOpacity="0.82"
                  />
                  <stop offset="1" stopColor="#02C27D82" stopOpacity="0.51" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <div className="flex flex-row w-full">
                <span className="justify-start text-sm text-white opacity-80">
                  {t("yourWalletBalance")}
                </span>
                <div className="flex justify-end ml-auto">
                  <svg
                    width="30"
                    height="29"
                    viewBox="0 0 30 29"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 16.7915C20 17.7407 20.8395 18.5103 21.875 18.5103C22.9105 18.5103 23.75 17.7407 23.75 16.7915C23.75 15.8423 22.9105 15.0728 21.875 15.0728C20.8395 15.0728 20 15.8423 20 16.7915Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M23.625 9.9165C23.707 9.54627 23.75 9.16308 23.75 8.77067C23.75 5.60654 20.9517 3.0415 17.5 3.0415C14.0483 3.0415 11.25 5.60654 11.25 8.77067C11.25 9.16308 11.293 9.54627 11.375 9.9165"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8.75 9.90908H20C23.5355 9.90908 25.3032 9.90908 26.4016 10.9164C27.5 11.9237 27.5 13.5449 27.5 16.7874V19.0802C27.5 22.3227 27.5 23.9439 26.4016 24.9512C25.3032 25.9585 23.5355 25.9585 20 25.9585H12.5C7.78595 25.9585 5.42894 25.9585 3.96446 24.6155C2.5 23.2723 2.5 21.1107 2.5 16.7874V14.4947C2.5 10.1713 2.5 8.00968 3.96446 6.6666C5.14333 5.58547 6.90054 5.37462 10 5.3335H12.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-white mt-1">
                {mybalance?.data ? `ETB ${mybalance.data}` : "ETB 0"}
              </span>
              <div>
                <svg
                  width="462"
                  height="2"
                  viewBox="0 0 462 2"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    y1="-0.5"
                    x2="461.032"
                    y2="-0.5"
                    transform="matrix(0.999999 -0.00102619 0.00102518 1 0.395386 1.88477)"
                    stroke="white"
                    strokeOpacity="0.5"
                    strokeDasharray="6 6"
                  />
                </svg>
              </div>
              <div>
                <Button
                  onClick={handleWithdrawModalOpen}
                  className="mt-4 w-32 bg-[#3989b9] text-white rounded-2xl font-medium "
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.508 14.0978L17.8716 10.6329C17.5961 9.13607 17.4584 8.38763 16.9142 7.94502C16.37 7.50241 15.5873 7.50146 14.023 7.50146H9.81921C8.25489 7.50146 7.47321 7.50146 6.92802 7.94502C6.38379 8.38763 6.24607 9.13607 5.97063 10.6329L5.33426 14.0978C4.76439 17.2046 4.4785 18.7585 5.35706 19.7776C6.23562 20.7986 7.85978 20.7986 11.1062 20.7986H12.736C15.9824 20.7986 17.6066 20.7986 18.4852 19.7785C19.3637 18.7585 19.0788 17.2046 18.508 14.0988"
                      stroke="white"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.9211 10.8256V16.9993M9.54658 15.0997L11.9211 17.4742L14.2956 15.0997M20.4692 11.3005C20.616 11.2273 20.749 11.1293 20.8625 11.0108C21.419 10.4353 21.419 9.50541 21.419 7.64571C21.419 5.786 21.419 4.8571 20.8625 4.27963C20.3059 3.70215 19.4112 3.70215 17.6199 3.70215H6.22229C4.43097 3.70215 3.53626 3.70215 2.97968 4.27963C2.4231 4.8571 2.4231 5.78695 2.4231 7.64571C2.4231 9.50446 2.4231 10.4343 2.97968 11.0108C3.09365 11.1299 3.22472 11.2264 3.37289 11.3005"
                      stroke="white"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t("withdraw")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="relative bg-white h-40 p-5 rounded-lg shadow flex flex-col justify-center">
            {/* Top-right SVG */}
            <div className="absolute top-3 right-3">
              <svg
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.65918"
                  y="0.5"
                  width="48.8296"
                  height="48.8296"
                  rx="14.6489"
                  fill="#095FAF"
                  fillOpacity="0.1"
                />

                <g transform="translate(12,12)">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.7526 17.5993H10.7176M8.70593 4.5234V8.54675M5.68842 2.51172V10.5584M2.6709 5.52924V7.54091M11.7234 5.52924V7.54091M4.68258 13.5759C4.68459 17.7522 4.73086 19.8876 6.00827 21.2324C7.33397 22.6285 9.46836 22.6285 13.7351 22.6285H14.1878C18.017 22.6285 19.9311 22.6285 21.2015 21.4869C21.3819 21.3246 21.5492 21.1482 21.7034 20.9578C22.7877 19.621 22.7877 17.6063 22.7877 13.5759C22.7877 9.54555 22.7877 7.52884 21.7034 6.19309C21.5499 6.00376 21.3818 5.82686 21.2005 5.66402C20.092 4.66421 18.4887 4.53949 15.5456 4.5234H14.741"
                      stroke="#095FAF"
                      strokeWidth="1.60647"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </g>
              </svg>
            </div>

            <span className="text-sm text-gray-500 mt-2">
              {t("audioDataSet")}
            </span>
            <span className="text-3xl font-bold text-gray-900">
              {reviwerStatistic?.data.audioDataSet}
            </span>
          </div>
          <div className="relative bg-white h-40 p-5 rounded-lg shadow flex flex-col justify-center">
            {/* Top-right SVG */}
            <div className="absolute top-3 right-3">
              <svg
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.65918"
                  y="0.5"
                  width="48.8296"
                  height="48.8296"
                  rx="14.6489"
                  fill="#02C27D"
                  fillOpacity="0.08"
                />

                <g transform="translate(12.5,12.5)">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.14453 13.9248H12.4854C13.071 13.9248 13.5518 14.4055 13.5518 14.9912V19.3955C13.5516 19.9811 13.0709 20.4619 12.4854 20.4619H11.0176C10.834 20.4619 10.6846 20.3125 10.6846 20.1289C10.6848 19.9455 10.8341 19.7969 11.0176 19.7969H11.3848C12.2146 19.7967 12.8867 19.1238 12.8867 18.2939V16.4189C12.8867 15.4085 12.0681 14.5889 11.0576 14.5889H6.57324C5.56279 14.5889 4.74316 15.4085 4.74316 16.4189V17.9678C4.74342 18.978 5.56294 19.7969 6.57324 19.7969H6.8877C7.25492 19.7969 7.5942 19.9932 7.77734 20.3115L8.69824 21.9121C8.78571 22.0642 8.73425 22.2587 8.58301 22.3477C8.42896 22.4383 8.23069 22.385 8.14258 22.2295L7.66602 21.3896C7.34116 20.8164 6.73313 20.4619 6.07422 20.4619H5.14453C4.5591 20.4617 4.07825 19.981 4.07812 19.3955V14.9912C4.07812 14.4057 4.55903 13.925 5.14453 13.9248ZM22.0283 13.1904C22.2118 13.1904 22.3612 13.339 22.3613 13.5225V14.2568C22.3613 16.8979 20.2651 18.9941 17.624 18.9941H16.8896C16.7062 18.994 16.5576 18.8446 16.5576 18.6611C16.5577 18.4777 16.7062 18.3293 16.8896 18.3291H17.624C19.9012 18.3291 21.6963 16.534 21.6963 14.2568V13.5225C21.6964 13.339 21.8449 13.1905 22.0283 13.1904ZM10.2832 4.38184H12.4854C12.6689 4.38184 12.8183 4.53029 12.8184 4.71387C12.8184 4.89747 12.669 5.0459 12.4854 5.0459H10.2832C8.00614 5.04599 6.21102 6.8411 6.21094 9.11816V9.85254C6.21086 10.0361 6.06247 10.1846 5.87891 10.1846C5.69537 10.1845 5.54695 10.0361 5.54688 9.85254V9.11816C5.54696 6.47724 7.64228 4.38192 10.2832 4.38184ZM18.4658 2.91309C18.709 2.91309 18.9061 3.11039 18.9062 3.35352V7.81738C18.9062 8.06059 18.709 8.25781 18.4658 8.25781C18.2227 8.2577 18.0254 8.06052 18.0254 7.81738V3.35352C18.0255 3.11047 18.2228 2.9132 18.4658 2.91309ZM21.0684 4.23145C21.263 4.23151 21.4207 4.38934 21.4209 4.58398V7.09863C21.4209 7.29342 21.2631 7.45111 21.0684 7.45117C20.8735 7.45117 20.7158 7.29346 20.7158 7.09863V4.58398C20.716 4.3893 20.8736 4.23145 21.0684 4.23145ZM16.1074 4.38184C16.2644 4.38184 16.3916 4.50907 16.3916 4.66602V6.23047C16.3915 6.38735 16.2643 6.51465 16.1074 6.51465C15.9506 6.51453 15.8233 6.38728 15.8232 6.23047V4.66602C15.8232 4.50914 15.9506 4.38195 16.1074 4.38184Z"
                      fill="#02C27D"
                      stroke="#02C27D"
                      strokeWidth="0.803236"
                    />
                  </svg>
                </g>
              </svg>
            </div>

            <span className="text-sm text-gray-500 mt-2">
              {t("textDataSet")}
            </span>
            <span className="text-3xl font-bold text-gray-900">
              {reviwerStatistic?.data.textDataSet}
            </span>
          </div>
          <div className="relative bg-white h-40 p-5 rounded-lg shadow flex flex-col justify-center">
            {/* Top-right SVG */}
            <div className="absolute top-3 right-3">
              <svg
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.65918"
                  y="0.5"
                  width="48.8296"
                  height="48.8296"
                  rx="14.6489"
                  fill="#095FAF"
                  fillOpacity="0.1"
                />
                <g transform="translate(12.5,12.5)">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.67676 14.481H11.2207C11.8286 14.4811 12.328 14.9796 12.3281 15.5874V20.1138C12.3281 20.7217 11.8286 21.2211 11.2207 21.2212H9.71191C9.51721 21.2212 9.35957 21.0633 9.35938 20.8687C9.35938 20.6738 9.51709 20.5151 9.71191 20.5151H10.0889C10.9356 20.5151 11.6221 19.8287 11.6221 18.9819V17.0151C11.6218 16.005 10.8031 15.1863 9.79297 15.186H5.10449C4.09429 15.1861 3.27564 16.005 3.27539 17.0151V18.686C3.27545 19.6964 4.09417 20.515 5.10449 20.5151H5.49121C5.85832 20.5152 6.19776 20.7116 6.38086 21.0298L7.33789 22.6948C7.4308 22.8564 7.37646 23.0632 7.21582 23.1577C7.05216 23.254 6.84069 23.1969 6.74707 23.0317L6.24707 22.1489C5.92224 21.5757 5.31413 21.2212 4.65527 21.2212H3.67676C3.06875 21.2212 2.56934 20.7218 2.56934 20.1138V15.5874C2.56946 14.9795 3.06882 14.481 3.67676 14.481ZM21.0273 13.7261C21.2221 13.7261 21.3797 13.8839 21.3799 14.0786V14.8335C21.3798 17.5537 19.2212 19.7124 16.501 19.7124H15.7471C15.5524 19.7124 15.3937 19.5545 15.3936 19.3599C15.3936 19.165 15.5522 19.0063 15.7471 19.0063H16.501C18.835 19.0063 20.6747 17.1674 20.6748 14.8335V14.0786C20.6749 13.8839 20.8327 13.7261 21.0273 13.7261ZM8.95703 4.67334H11.2207C11.4153 4.67344 11.573 4.83132 11.5732 5.02588C11.5732 5.22064 11.4154 5.3793 11.2207 5.37939H8.95703C6.62325 5.37958 4.78436 7.21846 4.78418 9.55225V10.3071C4.7841 10.5019 4.62544 10.6597 4.43066 10.6597C4.23609 10.6594 4.07821 10.5017 4.07812 10.3071V9.55225C4.07831 6.83226 6.23704 4.67353 8.95703 4.67334ZM14.9922 9.19971H18.0098C18.2045 9.19971 18.3621 9.35758 18.3623 9.55225C18.3623 9.74707 18.2046 9.90576 18.0098 9.90576H14.9922C14.7975 9.90564 14.6396 9.74699 14.6396 9.55225C14.6398 9.35766 14.7976 9.19983 14.9922 9.19971ZM14.9922 6.18213H22.5361C22.7308 6.18213 22.8884 6.34003 22.8887 6.53467C22.8887 6.72949 22.731 6.88818 22.5361 6.88818H14.9922C14.7975 6.88806 14.6396 6.72942 14.6396 6.53467C14.6399 6.34011 14.7976 6.18225 14.9922 6.18213ZM14.9922 3.16455H22.5361C22.7308 3.16455 22.8884 3.32248 22.8887 3.51709C22.8887 3.71191 22.731 3.87061 22.5361 3.87061H14.9922C14.7975 3.87048 14.6396 3.71184 14.6396 3.51709C14.6399 3.32256 14.7976 3.16467 14.9922 3.16455Z"
                      fill="#095FAF"
                      stroke="#095FAF"
                      strokeWidth="0.803236"
                    />
                  </svg>
                </g>
              </svg>
            </div>

            <span className="text-sm text-gray-500 mt-2">
              {t("totalDataSet")}
            </span>
            <span className="text-3xl font-bold text-gray-900">
              {reviwerStatistic?.data.totalDataSet}
            </span>
          </div>
        </div>
      </div>

      {/* --- TRANSACTION TABLE SECTION --- */}
      {usertype !== "reviewer" && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("transactionHistory")}
          </h2>
          <div className="flex justify-start space-x-2 mt-2 mb-4">
            <Button
              className={`${type == "Credit" ? "bg-green-400 text-white" : "bg-white-600 text-gray-500"} rounded-3xl hover:bg-blue-100 hover:text-gray-500`}
              onClick={() => setType("Credit")}
            >
              <span className={`h-2 w-2 rounded-full ${"bg-white"}`}></span>
              {t("credit")}
            </Button>
            <Button
              className={`${type === "Withdraw" ? "bg-primary text-white" : "bg-white-600 text-gray-500"}  rounded-3xl hover:bg-blue-200 border-b-blue-400`}
              onClick={() => setType("Withdraw")}
            >
              <span
                className={`h-2 w-2 rounded-full ${type === "Withdraw" ? "bg-white" : "bg-primary"}`}
              ></span>
              {t("withdraw")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              {transactionTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-sm font-bold text-gray-500 p-4"
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
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
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
              {isUserLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={transactionColumns.length}
                    className="h-24 text-center text-gray-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : transactionTable.getRowModel().rows?.length ? (
                transactionTable.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3 px-4 text-sm text-gray-600"
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
                    colSpan={transactionColumns.length}
                    className="h-96 text-center text-gray-500"
                  >
                    <div className="relative flex flex-col items-center justify-center py-12">
                      <img
                        src="/empty.svg"
                        alt="No transactions available"
                        className="w-64 h-64 opacity-50"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <PaginationControls
              pagination={{
                pageCount: totalPages,
                page: page,
                setPage: setPage,
                pageSize: pageSize,
                setPageSize: setPageSize,
                showingText:
                  totaltransaction > 0
                    ? `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                        page * pageSize,
                        totaltransaction,
                      )} of ${totaltransaction} transactions`
                    : "No transactions to show",
              }}
            />
          </div>
        </div>
      )}

      {/* --- WITHDRAW MODAL --- */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              {t("withdrawFunds")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("paymentMethod")} <span className="text-red-500">*</span>
              </label>
              <Select
                value={withdrawFormData.bank_code}
                onValueChange={(value) => {
                  const selected = withdrawOptionsData?.data?.find(
                    (option) => option.id.toString() === value,
                  );

                  setWithdrawFormData((prev) => ({
                    ...prev,
                    paymentMethod: selected?.name || "",
                    bank_code: value,
                  }));
                }}
              >
                <SelectTrigger
                  id="paymentMethod"
                  className={`w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.bank_code ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder={t("selectPaymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {withdrawOptionsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    withdrawOptionsData?.data?.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="account_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("account_number")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="account_number"
                type="text"
                value={withdrawFormData.account_number}
                onChange={(e) =>
                  handleWithdrawFormChange("account_number", e.target.value)
                }
                className={`w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.account_number ? "border-red-500" : ""}`}
              />
              {formErrors.account_number && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.account_number}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("amountEtb")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="amount"
                type="number"
                value={withdrawFormData.amount}
                onChange={(e) =>
                  handleWithdrawFormChange("amount", e.target.value)
                }
                placeholder="Enter amount"
                className={`w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 ${formErrors.amount ? "border-red-500" : ""}`}
                min="0"
                step="0.01"
              />
              {formErrors.amount && (
                <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {t("availableBalance")}: {mybalance?.data || "0"} ETB
              </p>
            </div>
          </div>
          <DialogFooter className="mt-8 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleWithdrawModalClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-2"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleWithdrawSubmit}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-2 disabled:bg-blue-400"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                t("withdraw")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
