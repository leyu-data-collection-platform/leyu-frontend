import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskResponse } from "@/app/types/project";
import { useGetProjectTaskAll } from "@/lib/hooks/useProject";
import {
  useAddUserSingleMicroTask,
  useExportUserTask,
} from "@/lib/hooks/useMicrotask";
import { toast } from "react-toastify";

interface ExportUserTaskProps {
  onClose: () => void;
  type?: string;
  taskData: TaskResponse;
}

const ExportUserTask: React.FC<ExportUserTaskProps> = ({
  onClose,
  type,
  taskData,
}) => {
  const [formData, setFormData] = useState({
    status: "",
    datasetStatus: "",
    contributors: "",
    acceptedTasks: "",
    taskName: "",
    sourceTaskId:""
  });

  const { data: tasksDataAll, isLoading: isTaskLoading } = useGetProjectTaskAll(
    {
      projectId: taskData.data.project_id,
    },
  );

  const addProjectUserMutation = useAddUserSingleMicroTask();
  const exportUserTaskMutation = useExportUserTask();


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    console.log("TASK NAME ",name);
    console.log("Value",value)
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "CSV") {
      try {
        let response = await exportUserTaskMutation.mutateAsync({
          sourceTaskId: taskData.data.id,
          status: "Active",
          limit: parseInt(formData.contributors),
          minNumberOfAcceptedDataSets: parseInt(formData.acceptedTasks),
        });

        // Ensure response.data exists and is an array
        const csvContent = [
          [
            "ID",
            "First Name",
            "Middle Name",
            "Last Name",
            "Email",
            "Phone Number",
            "Gender",
            "Contribution Count",
          ],
          ...(response.data && Array.isArray(response.data)
            ? response.data.map((user) => [
                user.id,
                user.first_name,
                user.middle_name,
                user.last_name,
                user.email,
                user.phone_number,
                user.gender,
                user.contribution_count,
              ])
            : []),
        ]
          .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
          .join("\n");

        if (!response.data || response.data.length === 0) {
          toast.warn("No data available to export");
          return;
        }

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "exported_users.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Failed to export users");
      }
    } else {
      try {
        await addProjectUserMutation.mutateAsync({
          targetTaskId:taskData.data.id,
          sourceTaskId: formData.sourceTaskId,
          status: formData.status,
          datasetStatus: formData.datasetStatus,
          limit: parseInt(formData.contributors),
          minNumberOfAcceptedDataSets: parseInt(formData.acceptedTasks)
        });
        toast.success("Users assigned successfully");
      } catch (error) {
        console.error("Assign user error:", error);
        toast.error("Failed to assign user");
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full sm:w-auto sm:min-w-[400px] sm:max-w-[800px] relative flex flex-col h-full max-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          {type === "task" ? (
            <h2 className="text-lg font-semibold text-gray-800">
              Import Contributors
            </h2>
          ) : (
            <h2 className="text-lg font-semibold text-gray-800">
              Export to {type}
            </h2>
          )}

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1 pb-24"
        >
          {/* Task (shown first when type === "task" so it sets context) */}
          {type === "task" && (
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-800">
                Task <span className="text-red-500">*</span>
              </label>
              <select
                name="sourceTaskId"
                value={formData.sourceTaskId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">Select a task</option>
                {isTaskLoading ? (
                  <option disabled>Loading tasks…</option>
                ) : (
                  tasksDataAll?.data.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Membership Status */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Membership Status
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (optional)
              </span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Submission Progress — grouped visually */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Submission Progress
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  (optional)
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Filter contributors based on how many submissions they have
                made.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Minimum Submissions
              </label>
              <input
                type="number"
                min={0}
                name="acceptedTasks"
                value={formData.acceptedTasks}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {type === "task" && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Submission Status
                </label>
                <p className="text-xs text-gray-400">
                  Count only submissions matching this review status.
                </p>
                <select
                  name="datasetStatus"
                  value={formData.datasetStatus}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Any status</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Flagged">Flagged</option>
                </select>
              </div>
            )}
          </div>

          {/* Max Contributors — required */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Contributor Limit <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400">
              Maximum number of contributors to import.
            </p>
            <input
              type="number"
              min={1}
              name="contributors"
              value={formData.contributors}
              onChange={handleChange}
              placeholder="e.g. 50"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </form>

        {/* Footer - sticky bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#095FAF] text-white hover:bg-blue-700"
          >
            {type === "CSV" ? "Export" : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportUserTask;
