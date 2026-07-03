"use client";
import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { useTaskStatistics, useTaskDatasetStatistics } from "@/lib/hooks/useStatistics";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem,
} from "chart.js";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TaskOverviewProps {
  taskId: string;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ taskId }) => {
  const [viewType, setViewType] = useState("WEEKLY");
  const { t } = useTranslation();

  const { data: taskStatsData, isLoading: taskStatsLoading } = useTaskStatistics(taskId);
  const { data: datasetData, isLoading: datasetLoading } = useTaskDatasetStatistics(viewType, taskId);

  const datasetIcon = (
    <svg width="47" height="48" viewBox="0 0 47 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="23.1484" cy="24.3281" rx="22.8632" ry="23.3437" fill="#095FAF" />
      <path d="M25.5945 11.8398H21.3335C20.6598 11.8399 20.0096 12.0862 19.5074 12.5319C19.0053 12.9775 18.6862 13.5911 18.6114 14.2554H16.4639C15.7374 14.2554 15.0407 14.5417 14.527 15.0513C14.0133 15.561 13.7247 16.2522 13.7247 16.9729V33.2779C13.7247 33.9986 14.0133 34.6898 14.527 35.1994C15.0407 35.7091 15.7374 35.9954 16.4639 35.9954H30.4641C30.8238 35.9954 31.18 35.9251 31.5123 35.7885C31.8447 35.652 32.1466 35.4518 32.401 35.1994C32.6554 34.9471 32.8571 34.6475 32.9948 34.3178C33.1324 33.9881 33.2033 33.6347 33.2033 33.2779V16.9729C33.2033 16.616 33.1324 16.2627 32.9948 15.933C32.8571 15.6033 32.6554 15.3037 32.401 15.0513C32.1466 14.799 31.8447 14.5988 31.5123 14.4623C31.18 14.3257 30.8238 14.2554 30.4641 14.2554H28.3166C28.2417 13.5911 27.9227 12.9775 27.4205 12.5319C26.9183 12.0862 26.2682 11.8399 25.5945 11.8398Z" fill="white" />
    </svg>
  );

  const microTaskIcon = (
    <svg width="46" height="47" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="23.1385" cy="23.4994" rx="22.5" ry="23.306" fill="#095FAF" />
      <path d="M17.7859 28.7322H21.5623V24.9558H17.7859V28.7322ZM25.3387 28.7322H29.1152V24.9558H25.3387V28.7322ZM17.7859 21.1794H21.5623V17.4029H17.7859V21.1794ZM25.3387 21.1794H29.1152V17.4029H25.3387V21.1794ZM15.4142 33.1381C14.8344 33.1381 14.3506 32.9442 13.9628 32.5565C13.5751 32.1688 13.3808 31.6846 13.38 31.1039V15.0313C13.38 14.4514 13.5743 13.9676 13.9628 13.5799C14.3514 13.1922 14.8352 12.9979 15.4142 12.9971H31.488C32.0671 12.9971 32.5509 13.1913 32.9395 13.5799C33.328 13.9685 33.5219 14.4523 33.521 15.0313V31.1051C33.521 31.6842 33.3272 32.168 32.9395 32.5565C32.5517 32.9451 32.0675 33.1389 31.4868 33.1381H15.4142Z" fill="white" />
    </svg>
  );

  const usersIcon = (
    <svg width="46" height="48" viewBox="0 0 46 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22.8888" cy="23.9994" rx="22.5" ry="23.306" fill="#667085" />
      <path d="M22.7691 21.6976C25.3117 21.6976 27.3728 19.6364 27.3728 17.0939C27.3728 14.5514 25.3117 12.4902 22.7691 12.4902C20.2266 12.4902 18.1655 14.5514 18.1655 17.0939C18.1655 19.6364 20.2266 21.6976 22.7691 21.6976Z" fill="white" />
      <path d="M31.9763 30.3285C31.9763 33.1886 31.9763 35.5077 22.769 35.5077C13.5616 35.5077 13.5616 33.1886 13.5616 30.3285C13.5616 27.4685 17.6842 25.1494 22.769 25.1494C27.8537 25.1494 31.9763 27.4685 31.9763 30.3285Z" fill="white" />
    </svg>
  );

  const reviewerIcon = (
    <svg width="46" height="47" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22.8887" cy="23.4994" rx="22.5" ry="23.306" fill="#667085" />
      <path d="M12.6266 17.0249C12.6266 15.823 13.1041 14.6703 13.9539 13.8205C14.8038 12.9706 15.9565 12.4932 17.1584 12.4932H29.243C30.4449 12.4932 31.5975 12.9706 32.4474 13.8205C33.2973 14.6703 33.7747 15.823 33.7747 17.0249V29.1095C33.7747 30.3114 33.2973 31.4641 32.4474 32.3139C31.5975 33.1638 30.4449 33.6413 29.243 33.6413H17.1584C15.9565 33.6413 14.8038 33.1638 13.9539 32.3139C13.1041 31.4641 12.6266 30.3114 12.6266 29.1095V17.0249Z" fill="white" />
    </svg>
  );

  const metrics = taskStatsData?.data
    ? [
        {
          title: t("totalDatasets"),
          value: taskStatsData.data.total_data_sets,
          bg: "bg-blue-100",
          icon: datasetIcon,
        },
        {
          title: t("totalMicroTasks"),
          value: taskStatsData.data.total_micro_tasks,
          bg: "bg-white",
          icon: microTaskIcon,
        },
        {
          title: t("totalContributors"),
          value: taskStatsData.data.total_contributors,
          bg: "bg-blue-100",
          icon: usersIcon,
        },
        {
          title: t("totalFacilitators"),
          value: taskStatsData.data.total_facilitators,
          bg: "bg-white",
          icon: usersIcon,
        },
        {
          title: t("totalReviewers"),
          value: taskStatsData.data.total_reviewers,
          bg: "bg-blue-100",
          icon: reviewerIcon,
        },
      ]
    : [];

  const currentYear = new Date().getFullYear();
  const labels = (() => {
    switch (viewType) {
      case "WEEKLY":
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      case "MONTHLY":
        return Array.from({ length: 12 }, (_, i) =>
          new Date(currentYear, i, 1).toLocaleString("default", { month: "short" })
        );
      case "YEARLY":
        return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String);
      default:
        return ["No Data"];
    }
  })();

  const dataValues =
    Array.isArray(datasetData?.data) && datasetData!.data.length > 0
      ? datasetData!.data.map((item) => {
          let index: number;
          switch (viewType) {
            case "WEEKLY":
              // API returns 0-6 (0 = Sunday). Map Sunday(0) to index 6, Mon-Sat(1-6) to 0-5
              index = item.date === 0 ? 6 : item.date - 1;
              break;
            case "MONTHLY":
              // API returns 1-12 for months
              index = Math.max(0, item.date - 1) % 12;
              break;
            case "YEARLY":
              index = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].indexOf(item.date);
              break;
            default:
              index = 0;
          }
          return { index, value: parseInt(item.count) || 0 };
        })
      : labels.map((_, i) => ({ index: i, value: 0 }));

  const lineData: ChartData<"line", number[], string> = {
    labels,
    datasets: [
      {
        label: t("totalDatasets"),
        data: labels.map((_, i) => {
          const point = dataValues.find((d) => d.index === i);
          return point ? point.value : 0;
        }),
        fill: false,
        backgroundColor: "rgba(0,0,0,0)",
        borderColor: "rgba(0,112,192,1)",
        pointBackgroundColor: "rgba(0,0,0,1)",
        pointBorderColor: "rgba(0,0,0,1)",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: t("totalDatasets"),
        color: "#095FAF",
      },
      tooltip: {
        enabled: true,
        mode: "nearest" as const,
        callbacks: {
          label: (item: TooltipItem<"line">) => `${item.dataset.label}: ${item.raw}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Count" } },
      x: { ticks: { autoSkip: false } },
    },
  };

  return (
    <div className="py-4 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {taskStatsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white px-3 py-5 flex items-center gap-2 rounded-lg shadow-sm animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          : metrics.map((metric, i) => (
              <div key={i} className={`${metric.bg} px-3 py-5 flex flex-row rounded-lg shadow-sm items-center gap-2`}>
                <div>{metric.icon}</div>
                <div className="py-2 px-1">
                  <p className="text-gray-500 text-sm font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Dataset chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("totalDatasets")}</h2>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white"
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
          >
            <option value="WEEKLY">{t("weekly")}</option>
            <option value="MONTHLY">{t("monthly")}</option>
            <option value="YEARLY">{t("yearly")}</option>
          </select>
        </div>
        <div className="relative w-full h-[350px] md:h-[400px]">
          {datasetLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <Line data={lineData} options={lineOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;
